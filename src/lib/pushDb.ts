// Persistence for Web Push subscriptions — the one piece of this app's
// data model that has to survive a server restart, unlike everything else
// (UV readings, geocoding results) which is either proxied-and-discarded
// or lives entirely in the browser's own localStorage. See PRIVACY.md-
// equivalent: this is documented as its own data category in /privacy.
//
// Uses node:sqlite (built into Node, no native compile step, no external
// service to run) rather than a JSON file, since concurrent writes from
// overlapping subscribe/unsubscribe requests and the background scheduler
// need real locking, not "read the whole file, rewrite the whole file".
// It's still an experimental Node API as of this writing, so every export
// here degrades to a no-op (never throws) if it isn't available — losing
// background push shouldn't be able to take the rest of the app down.
//
// Loaded via dynamic import(), not a static top-level import or require():
// Turbopack's server bundle can't resolve a bare `require("node:sqlite")`
// (it wants an ESM-style specifier), and a static top-level import would
// force node:sqlite to exist just to load this module at all, rather than
// only when a subscription is actually touched.

import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export type PushSubscriptionRecord = {
  endpoint: string;
  p256dh: string;
  auth: string;
  lat: number;
  lon: number;
  placeLabel: string | null;
  locale: string;
  lastUv: number | null;
};

type PushReminderRecord = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  profileId: string;
  profileName: string;
  locale: string;
  dueAt: number;
};

type DatabaseSyncLike = InstanceType<
  typeof import("node:sqlite").DatabaseSync
>;

let db: DatabaseSyncLike | null = null;
let initPromise: Promise<DatabaseSyncLike | null> | null = null;

function init(): Promise<DatabaseSyncLike | null> {
  if (db) return Promise.resolve(db);
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const { DatabaseSync } = await import("node:sqlite");
      const path = process.env.PUSH_DB_PATH || "./data/push.sqlite";
      if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
      const database = new DatabaseSync(path);
      database.exec(`
        CREATE TABLE IF NOT EXISTS push_subscriptions (
          endpoint TEXT PRIMARY KEY,
          p256dh TEXT NOT NULL,
          auth TEXT NOT NULL,
          lat REAL NOT NULL,
          lon REAL NOT NULL,
          place_label TEXT,
          locale TEXT NOT NULL DEFAULT 'en',
          last_uv REAL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `);
      // One-shot scheduled pushes for the reapply reminder — separate from
      // push_subscriptions above, which is "watch this location forever
      // until unsubscribed". A reminder is "fire once at this timestamp,
      // then it's gone", and keyed by (endpoint, profileId) rather than
      // endpoint alone since one device can run independent reapply
      // timers for several profiles (people) at once.
      database.exec(`
        CREATE TABLE IF NOT EXISTS push_reminders (
          id TEXT PRIMARY KEY,
          endpoint TEXT NOT NULL,
          p256dh TEXT NOT NULL,
          auth TEXT NOT NULL,
          profile_id TEXT NOT NULL,
          profile_name TEXT NOT NULL,
          locale TEXT NOT NULL DEFAULT 'en',
          due_at INTEGER NOT NULL,
          created_at INTEGER NOT NULL
        )
      `);
      db = database;
      return database;
    } catch (err) {
      console.warn(
        "[push] node:sqlite unavailable — background high-UV push is disabled on this deployment.",
        err,
      );
      return null;
    }
  })();
  return initPromise;
}

/**
 * Every exported function below is this same shape — get the DB, and if
 * it's unavailable (older Node, or init failed) return a harmless
 * fallback instead of throwing. Centralized here rather than repeating
 * `const database = await init(); if (!database) return ...;` at each
 * call site.
 */
function withDb<T>(fn: (database: DatabaseSyncLike) => T, fallback: T): Promise<T> {
  return init().then((database) => (database ? fn(database) : fallback));
}

export async function isPushDbAvailable(): Promise<boolean> {
  return (await init()) !== null;
}

export function upsertPushSubscription(input: {
  endpoint: string;
  p256dh: string;
  auth: string;
  lat: number;
  lon: number;
  placeLabel: string | null;
  locale: string;
}): Promise<void> {
  return withDb((database) => {
    const now = Date.now();
    database
      .prepare(
        `INSERT INTO push_subscriptions
           (endpoint, p256dh, auth, lat, lon, place_label, locale, last_uv, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
         ON CONFLICT(endpoint) DO UPDATE SET
           p256dh = excluded.p256dh,
           auth = excluded.auth,
           lat = excluded.lat,
           lon = excluded.lon,
           place_label = excluded.place_label,
           locale = excluded.locale,
           updated_at = excluded.updated_at`,
      )
      .run(
        input.endpoint,
        input.p256dh,
        input.auth,
        input.lat,
        input.lon,
        input.placeLabel,
        input.locale,
        now,
        now,
      );
  }, undefined);
}

export function deletePushSubscription(endpoint: string): Promise<void> {
  return withDb((database) => {
    database.prepare(`DELETE FROM push_subscriptions WHERE endpoint = ?`).run(endpoint);
  }, undefined);
}

export function listPushSubscriptions(): Promise<PushSubscriptionRecord[]> {
  return withDb((database) => {
    const rows = database
      .prepare(
        `SELECT endpoint, p256dh, auth, lat, lon, place_label, locale, last_uv FROM push_subscriptions`,
      )
      .all() as Array<{
      endpoint: string;
      p256dh: string;
      auth: string;
      lat: number;
      lon: number;
      place_label: string | null;
      locale: string;
      last_uv: number | null;
    }>;
    return rows.map((r) => ({
      endpoint: r.endpoint,
      p256dh: r.p256dh,
      auth: r.auth,
      lat: r.lat,
      lon: r.lon,
      placeLabel: r.place_label,
      locale: r.locale,
      lastUv: r.last_uv,
    }));
  }, []);
}

export function updateLastUv(endpoint: string, uv: number): Promise<void> {
  return withDb((database) => {
    database
      .prepare(`UPDATE push_subscriptions SET last_uv = ?, updated_at = ? WHERE endpoint = ?`)
      .run(uv, Date.now(), endpoint);
  }, undefined);
}

function reminderId(endpoint: string, profileId: string): string {
  return `${endpoint}:${profileId}`;
}

/** Re-arming (same endpoint + profileId) replaces the previous due time rather than duplicating. */
export function upsertPushReminder(input: {
  endpoint: string;
  p256dh: string;
  auth: string;
  profileId: string;
  profileName: string;
  locale: string;
  dueAt: number;
}): Promise<void> {
  return withDb((database) => {
    const id = reminderId(input.endpoint, input.profileId);
    database
      .prepare(
        `INSERT INTO push_reminders
           (id, endpoint, p256dh, auth, profile_id, profile_name, locale, due_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           p256dh = excluded.p256dh,
           auth = excluded.auth,
           profile_name = excluded.profile_name,
           locale = excluded.locale,
           due_at = excluded.due_at`,
      )
      .run(
        id,
        input.endpoint,
        input.p256dh,
        input.auth,
        input.profileId,
        input.profileName,
        input.locale,
        input.dueAt,
        Date.now(),
      );
  }, undefined);
}

export function deletePushReminder(endpoint: string, profileId: string): Promise<void> {
  return withDb((database) => {
    database
      .prepare(`DELETE FROM push_reminders WHERE id = ?`)
      .run(reminderId(endpoint, profileId));
  }, undefined);
}

export function deletePushReminderById(id: string): Promise<void> {
  return withDb((database) => {
    database.prepare(`DELETE FROM push_reminders WHERE id = ?`).run(id);
  }, undefined);
}

export function listPushReminders(): Promise<PushReminderRecord[]> {
  return withDb((database) => {
    const rows = database
      .prepare(
        `SELECT id, endpoint, p256dh, auth, profile_id, profile_name, locale, due_at FROM push_reminders`,
      )
      .all() as Array<{
      id: string;
      endpoint: string;
      p256dh: string;
      auth: string;
      profile_id: string;
      profile_name: string;
      locale: string;
      due_at: number;
    }>;
    return rows.map((r) => ({
      id: r.id,
      endpoint: r.endpoint,
      p256dh: r.p256dh,
      auth: r.auth,
      profileId: r.profile_id,
      profileName: r.profile_name,
      locale: r.locale,
      dueAt: r.due_at,
    }));
  }, []);
}

/** Removes every reminder tied to an endpoint — used when a subscription itself is gone (410). */
export function deletePushRemindersForEndpoint(endpoint: string): Promise<void> {
  return withDb((database) => {
    database.prepare(`DELETE FROM push_reminders WHERE endpoint = ?`).run(endpoint);
  }, undefined);
}

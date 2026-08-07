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

export async function isPushDbAvailable(): Promise<boolean> {
  return (await init()) !== null;
}

export async function upsertPushSubscription(input: {
  endpoint: string;
  p256dh: string;
  auth: string;
  lat: number;
  lon: number;
  placeLabel: string | null;
  locale: string;
}): Promise<void> {
  const database = await init();
  if (!database) return;
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
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  const database = await init();
  if (!database) return;
  database.prepare(`DELETE FROM push_subscriptions WHERE endpoint = ?`).run(endpoint);
}

export async function listPushSubscriptions(): Promise<PushSubscriptionRecord[]> {
  const database = await init();
  if (!database) return [];
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
}

export async function updateLastUv(endpoint: string, uv: number): Promise<void> {
  const database = await init();
  if (!database) return;
  database
    .prepare(`UPDATE push_subscriptions SET last_uv = ?, updated_at = ? WHERE endpoint = ?`)
    .run(uv, Date.now(), endpoint);
}

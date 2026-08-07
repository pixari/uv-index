// @vitest-environment node
//
// The suite's default jsdom environment treats every import as
// client/browser-bundleable, which chokes on pushDb.ts's dynamic
// import("node:sqlite") — a genuine Node built-in with nothing to
// polyfill. This file exercises server-only code with no DOM
// dependency, so it opts back into plain Node instead.
import { beforeEach, describe, expect, it, vi } from "vitest";

// pushDb.ts reads PUSH_DB_PATH lazily on first use and caches the
// connection — setting these before any import/call runs gives each test
// a private in-memory database instead of touching a real file, while
// still exercising the actual SQL (no mocking pushDb itself).
process.env.PUSH_DB_PATH = ":memory:";
process.env.VAPID_PUBLIC_KEY = "test-public-key";
process.env.VAPID_PRIVATE_KEY = "test-private-key";
process.env.VAPID_SUBJECT = "mailto:test@example.com";

const sendNotification = vi.fn();
vi.mock("web-push", () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: (...args: unknown[]) => sendNotification(...args),
  },
}));

const fetchCurrentUv = vi.fn();
vi.mock("./metForecast", () => ({
  fetchCurrentUv: (...args: unknown[]) => fetchCurrentUv(...args),
}));

const { upsertPushSubscription, listPushSubscriptions, deletePushSubscription } =
  await import("./pushDb");
const { runCheck, gridKey, notificationFor } = await import("./pushScheduler");

async function addSubscription(overrides: {
  endpoint: string;
  lat?: number;
  lon?: number;
  locale?: string;
}) {
  await upsertPushSubscription({
    endpoint: overrides.endpoint,
    p256dh: "p256dh",
    auth: "auth",
    lat: overrides.lat ?? 41.9,
    lon: overrides.lon ?? 12.5,
    placeLabel: "Roma",
    locale: overrides.locale ?? "en",
  });
}

beforeEach(async () => {
  sendNotification.mockReset();
  fetchCurrentUv.mockReset();
  // Clean slate between tests — delete whatever the previous test left.
  for (const sub of await listPushSubscriptions()) {
    await deletePushSubscription(sub.endpoint);
  }
});

describe("gridKey", () => {
  it("buckets nearby points together and distinct points apart", () => {
    expect(gridKey(41.9012, 12.4988)).toBe(gridKey(41.9013, 12.4987));
    expect(gridKey(41.9, 12.5)).not.toBe(gridKey(48.85, 2.35));
  });
});

describe("notificationFor", () => {
  it("interpolates the rounded UV value into the locale's body", () => {
    const { title, body } = notificationFor("it", 8.4);
    expect(title).toBeTruthy();
    expect(body).toContain("8");
    expect(body).not.toContain("{uv}");
  });

  it("falls back to English for an unknown locale", () => {
    expect(notificationFor("xx", 9)).toEqual(notificationFor("en", 9));
  });
});

describe("runCheck", () => {
  it("sends a push on the rising edge and records the new UV", async () => {
    await addSubscription({ endpoint: "https://push.example/a" });
    fetchCurrentUv.mockResolvedValue(9);

    await runCheck();

    expect(sendNotification).toHaveBeenCalledTimes(1);
    const [subject, payload] = sendNotification.mock.calls[0];
    expect(subject.endpoint).toBe("https://push.example/a");
    expect(JSON.parse(payload).body).toContain("9");

    const [stored] = await listPushSubscriptions();
    expect(stored.lastUv).toBe(9);
  });

  it("does not re-send while the reading stays above the threshold", async () => {
    await addSubscription({ endpoint: "https://push.example/b" });
    fetchCurrentUv.mockResolvedValue(9);
    await runCheck(); // rising edge — sends once
    sendNotification.mockClear();

    fetchCurrentUv.mockResolvedValue(9.5); // still high, not a new rise
    await runCheck();

    expect(sendNotification).not.toHaveBeenCalled();
  });

  it("sends again after dropping back below and rising a second time", async () => {
    await addSubscription({ endpoint: "https://push.example/c" });
    fetchCurrentUv.mockResolvedValue(9);
    await runCheck();
    sendNotification.mockClear();

    fetchCurrentUv.mockResolvedValue(4); // drops back below threshold
    await runCheck();
    expect(sendNotification).not.toHaveBeenCalled();

    fetchCurrentUv.mockResolvedValue(8); // rises again
    await runCheck();
    expect(sendNotification).toHaveBeenCalledTimes(1);
  });

  it("fetches once per grid cell, not once per subscription", async () => {
    await addSubscription({ endpoint: "https://push.example/d1", lat: 41.9012, lon: 12.4988 });
    await addSubscription({ endpoint: "https://push.example/d2", lat: 41.9013, lon: 12.4987 });
    fetchCurrentUv.mockResolvedValue(9);

    await runCheck();

    expect(fetchCurrentUv).toHaveBeenCalledTimes(1);
    expect(sendNotification).toHaveBeenCalledTimes(2);
  });

  it("prunes the subscription when the push service reports it gone (410)", async () => {
    await addSubscription({ endpoint: "https://push.example/e" });
    fetchCurrentUv.mockResolvedValue(9);
    sendNotification.mockRejectedValueOnce(Object.assign(new Error("gone"), { statusCode: 410 }));

    await runCheck();

    expect(await listPushSubscriptions()).toHaveLength(0);
  });

  it("leaves stored state untouched on an upstream fetch failure", async () => {
    await addSubscription({ endpoint: "https://push.example/f" });
    fetchCurrentUv.mockResolvedValue(null);

    await runCheck();

    expect(sendNotification).not.toHaveBeenCalled();
    const [stored] = await listPushSubscriptions();
    expect(stored.lastUv).toBeNull();
  });
});

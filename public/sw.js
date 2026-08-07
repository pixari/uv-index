// Minimal push-only service worker. This app has no offline caching
// strategy to speak of (every screen is either a live reading or static
// editorial content, both fine to just re-fetch) — the only reason this
// file exists is that Web Push requires an active service worker
// registration to receive `push` events at all, even ones fired while
// the app itself is fully closed.

self.addEventListener("push", (event) => {
  let payload = { title: "UV Index", body: "" };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    // Malformed/empty payload — fall back to the default above rather
    // than dropping the notification entirely.
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/pwa-icon/192",
      badge: "/pwa-icon/192",
      tag: "uv-index-high-uv", // replaces a still-unread prior alert instead of stacking
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ("focus" in client) return client.focus();
        }
        if (self.clients.openWindow) return self.clients.openWindow("/");
      }),
  );
});

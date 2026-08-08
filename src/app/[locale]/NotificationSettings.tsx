"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ensureNotificationPermission,
  getHighUvNotifPref,
  getReapplyNotifPref,
  notificationsSupported,
  setHighUvNotifPref,
  setReapplyNotifPref,
} from "@/lib/notifications";
import {
  isPushSubscribedLocally,
  subscribeToHighUvPush,
  unsubscribeFromHighUvPush,
} from "@/lib/pushClient";
import { getLastPlace } from "@/lib/lastPlace";
import Toggle from "./Toggle";

// The "Notifications" section of Settings — fully self-contained (reads
// its own prefs, owns its own state) apart from `open`, which it needs
// to know about so its values refresh every time the sheet reopens, the
// same as when this lived inline in SettingsSheet.
export default function NotificationSettings({ open }: { open: boolean }) {
  const t = useTranslations("settings");
  const locale = useLocale();
  const [reapplyNotif, setReapplyNotif] = useState(false);
  const [highUvNotif, setHighUvNotif] = useState(false);
  // Whether the high-UV toggle is actually backed by a live push
  // subscription (alerts even when the app is closed) rather than just
  // the foreground Notification permission — shown as a small hint so
  // "on" doesn't silently mean two different things depending on the
  // browser/deployment.
  const [pushActive, setPushActive] = useState(false);
  // Browser-level, sticky until the person changes it in their browser's
  // own site settings — distinct from just "not decided yet".
  const [notifBlocked, setNotifBlocked] = useState(false);

  useEffect(() => {
    if (!open) return;
    setReapplyNotif(getReapplyNotifPref());
    setHighUvNotif(getHighUvNotifPref());
    setPushActive(isPushSubscribedLocally());
    setNotifBlocked(notificationsSupported() && Notification.permission === "denied");
  }, [open]);

  // Turning a toggle on needs permission first; if it's denied (or the
  // browser can't do notifications at all), the toggle snaps back off
  // instead of silently claiming to be on — and, if it was denied, a hint
  // explains why rather than leaving it a mystery.
  async function toggleReapplyNotif(next: boolean) {
    if (next) {
      const granted = await ensureNotificationPermission();
      setNotifBlocked(notificationsSupported() && Notification.permission === "denied");
      if (!granted) {
        setReapplyNotif(false);
        setReapplyNotifPref(false);
        return;
      }
    }
    setReapplyNotif(next);
    setReapplyNotifPref(next);
  }

  async function toggleHighUvNotif(next: boolean) {
    if (next) {
      const granted = await ensureNotificationPermission();
      setNotifBlocked(notificationsSupported() && Notification.permission === "denied");
      if (!granted) {
        setHighUvNotif(false);
        setHighUvNotifPref(false);
        return;
      }
      // Best-effort — a browser without Push support, or a deployment
      // that hasn't configured VAPID keys, still gets the foreground
      // alert above; this just adds the "even when closed" half on top
      // where it's actually available.
      const place = getLastPlace();
      const subscribed = place ? await subscribeToHighUvPush(place, locale) : false;
      setPushActive(subscribed);
    } else {
      await unsubscribeFromHighUvPush();
      setPushActive(false);
    }
    setHighUvNotif(next);
    setHighUvNotifPref(next);
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-muted-foreground">
        {t("notifications.title")}
      </h3>
      {notificationsSupported() ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-foreground">{t("notifications.reapplyLabel")}</span>
            <Toggle
              checked={reapplyNotif}
              onChange={toggleReapplyNotif}
              label={t("notifications.reapplyLabel")}
            />
          </div>
          <div className="border-t border-border pt-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-foreground">{t("notifications.highUvLabel")}</span>
              <Toggle
                checked={highUvNotif}
                onChange={toggleHighUvNotif}
                label={t("notifications.highUvLabel")}
              />
            </div>
            {highUvNotif && (
              <p className="mt-1.5 text-xs leading-snug text-muted-foreground">
                {pushActive ? t("notifications.pushActive") : t("notifications.pushInactive")}
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t("notifications.unsupported")}</p>
      )}
      {notifBlocked && (
        <p className="mt-2 text-xs leading-snug text-muted-foreground">
          {t("notifications.blocked")}
        </p>
      )}
    </div>
  );
}

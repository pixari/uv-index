"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import WhoGradientBar from "../learn/WhoGradientBar";

const CONTACT_EMAIL = "raffaele.pizzari@gmail.com";

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-12 scroll-mt-20">
      <h2 className="mb-4 font-display text-2xl leading-tight">{title}</h2>
      {children}
    </section>
  );
}

// A neutral, non-WHO-colored callout — DESIGN.md reserves the risk-tier
// palette for the actual UV signal, so a legal disclaimer box borrows
// nothing from it and stays in the app's ordinary bordered-surface
// vocabulary instead.
function Callout({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="mb-1.5 text-sm font-semibold text-foreground">{title}</p>
      <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function DataCard({
  title,
  body,
  legalBasis,
  retention,
}: {
  title: string;
  body: string;
  legalBasis: string;
  retention?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="mb-1.5 text-sm font-semibold text-foreground">{title}</p>
      <p className="text-sm leading-relaxed text-ink">{body}</p>
      <p className="mt-3 text-xs leading-snug text-muted-foreground">{legalBasis}</p>
      {retention && (
        <p className="mt-1 text-xs leading-snug text-muted-foreground">{retention}</p>
      )}
    </div>
  );
}

function MailLink() {
  return (
    <a
      href={`mailto:${CONTACT_EMAIL}`}
      className="text-sm font-medium text-brand-ink hover:underline"
    >
      {CONTACT_EMAIL}
    </a>
  );
}

export default function PrivacyClient() {
  const t = useTranslations("privacy");

  return (
    <main
      id="privacyTop"
      className="mx-auto max-w-xl px-6 py-10"
      style={{
        background:
          "linear-gradient(to bottom, oklch(0.48 0.15 230 / 0.08), oklch(0.48 0.15 230 / 0) 480px)",
      }}
    >
      <Link
        href="/"
        className="mb-8 inline-block text-sm text-muted-foreground hover:text-brand-ink transition-colors"
      >
        {t("back")}
      </Link>

      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-ink">
        {t("eyebrow")}
      </p>
      <h1 className="break-words font-display text-5xl leading-[1.05] mb-4">
        {t("title")}
      </h1>
      <p className="mb-2 text-sm text-muted-foreground">{t("lastUpdated")}</p>
      <p className="mb-8 text-ink leading-relaxed">{t("intro")}</p>

      <div className="mb-8">
        <WhoGradientBar />
      </div>

      <nav
        className="mb-12 rounded-2xl border border-brand/15 bg-brand/[0.04] p-4"
        aria-label={t("toc.title")}
      >
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("toc.title")}
        </p>
        <ul className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
          {(
            [
              "disclaimer",
              "controller",
              "dataWeCollect",
              "thirdParties",
              "cookiesStorage",
              "yourRights",
              "contact",
            ] as const
          ).map((key) => (
            <li key={key}>
              <a
                href={`#${key}`}
                className="text-sm text-ink hover:text-brand-ink hover:underline"
              >
                {t(`toc.${key}`)}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <Section id="disclaimer" title={t("disclaimer.title")}>
        <div className="flex flex-col gap-3">
          <Callout
            title={t("disclaimer.notMedicalAdvice.title")}
            body={t("disclaimer.notMedicalAdvice.body")}
          />
          <Callout
            title={t("disclaimer.dataAccuracy.title")}
            body={t("disclaimer.dataAccuracy.body")}
          />
          <Callout
            title={t("disclaimer.noLiability.title")}
            body={t("disclaimer.noLiability.body")}
          />
        </div>
      </Section>

      <Section id="controller" title={t("controller.title")}>
        <p className="mb-3 text-ink leading-relaxed">{t("controller.body")}</p>
        <MailLink />
      </Section>

      <Section id="dataWeCollect" title={t("dataWeCollect.title")}>
        <p className="mb-4 text-ink leading-relaxed">{t("dataWeCollect.intro")}</p>
        <div className="flex flex-col gap-3">
          <DataCard
            title={t("dataWeCollect.location.title")}
            body={t("dataWeCollect.location.body")}
            legalBasis={t("dataWeCollect.location.legalBasis")}
            retention={t("dataWeCollect.location.retention")}
          />
          <DataCard
            title={t("dataWeCollect.ip.title")}
            body={t("dataWeCollect.ip.body")}
            legalBasis={t("dataWeCollect.ip.legalBasis")}
            retention={t("dataWeCollect.ip.retention")}
          />
          <DataCard
            title={t("dataWeCollect.profile.title")}
            body={t("dataWeCollect.profile.body")}
            legalBasis={t("dataWeCollect.profile.legalBasis")}
          />
          <DataCard
            title={t("dataWeCollect.analytics.title")}
            body={t("dataWeCollect.analytics.body")}
            legalBasis={t("dataWeCollect.analytics.legalBasis")}
            retention={t("dataWeCollect.analytics.retention")}
          />
          <DataCard
            title={t("dataWeCollect.push.title")}
            body={t("dataWeCollect.push.body")}
            legalBasis={t("dataWeCollect.push.legalBasis")}
            retention={t("dataWeCollect.push.retention")}
          />
        </div>
      </Section>

      <Section id="thirdParties" title={t("thirdParties.title")}>
        <p className="mb-4 text-ink leading-relaxed">{t("thirdParties.intro")}</p>
        <ul className="mb-4 space-y-2">
          {(["met", "openMeteo", "bigDataCloud", "umami", "pushService"] as const).map((key) => (
            <li
              key={key}
              className="rounded-lg border border-border px-4 py-3 text-sm text-foreground"
            >
              {t(`thirdParties.${key}`)}
            </li>
          ))}
        </ul>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("thirdParties.note")}
        </p>
      </Section>

      <Section id="cookiesStorage" title={t("cookiesStorage.title")}>
        <p className="text-ink leading-relaxed">{t("cookiesStorage.body")}</p>
      </Section>

      <Section id="yourRights" title={t("yourRights.title")}>
        <p className="mb-4 text-ink leading-relaxed">{t("yourRights.intro")}</p>
        <ul className="mb-4 space-y-2.5">
          {(
            [
              "access",
              "rectification",
              "erasure",
              "restriction",
              "portability",
              "complaint",
            ] as const
          ).map((key) => (
            <li key={key} className="flex gap-2.5 text-sm leading-relaxed text-ink">
              <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand" />
              <span>{t(`yourRights.${key}`)}</span>
            </li>
          ))}
        </ul>
        <p className="mb-3 text-ink leading-relaxed">{t("yourRights.outro")}</p>
        <MailLink />
      </Section>

      <section id="children" className="mb-12 scroll-mt-20">
        <h2 className="mb-2 font-display text-lg leading-tight">
          {t("children.title")}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("children.body")}
        </p>
      </section>

      <section id="changes" className="mb-12 scroll-mt-20">
        <h2 className="mb-2 font-display text-lg leading-tight">
          {t("changes.title")}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("changes.body")}
        </p>
      </section>

      <Section id="contact" title={t("contact.title")}>
        <p className="mb-3 text-ink leading-relaxed">{t("contact.body")}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <MailLink />
          <span className="text-sm text-muted-foreground">{t("contact.githubAlt")}</span>
        </div>
      </Section>

      <footer className="mt-4 border-t border-border pt-8 pb-2">
        <div className="mb-6">
          <WhoGradientBar />
        </div>
        <div className="mb-4 flex items-center gap-2">
          <div
            aria-hidden
            className="h-6 w-6 shrink-0 rounded-full"
            style={{
              background:
                "linear-gradient(135deg, #3EA72D 0%, #FFF300 35%, #F18B00 65%, #E53210 100%)",
            }}
          />
          <span className="font-display text-base text-foreground">UV Index</span>
        </div>
        <p className="mb-6 max-w-[38ch] text-sm text-muted-foreground leading-relaxed">
          {t("footer.tagline")}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <a href="#privacyTop" className="text-sm text-brand-ink hover:underline">
            {t("footer.backToTop")}
          </a>
          <span aria-hidden className="text-border">
            ·
          </span>
          <Link href="/" className="text-sm text-brand-ink hover:underline">
            {t("footer.backToHome")}
          </Link>
          <span aria-hidden className="text-border">
            ·
          </span>
          <Link href="/learn" className="text-sm text-brand-ink hover:underline">
            {t("footer.learnLink")}
          </Link>
          <span aria-hidden className="text-border">
            ·
          </span>
          <a
            href="https://github.com/pixari/uv-index"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-brand-ink hover:underline"
          >
            {t("footer.sourceLink")}
          </a>
        </div>
      </footer>
    </main>
  );
}

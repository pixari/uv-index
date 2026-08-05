"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const SOURCES = [
  {
    name: "WHO / WMO / UNEP / ICNIRP",
    title: "Global Solar UV Index: A Practical Guide",
    url: "https://www.who.int/publications/i/item/9241590076",
  },
  {
    name: "IARC (WHO)",
    title: "Solar and ultraviolet radiation — Group 1 carcinogen",
    url: "https://publications.iarc.fr/Book-And-Report-Series/Iarc-Monographs-On-The-Identification-Of-Carcinogenic-Hazards-To-Humans/Solar-And-Ultraviolet-Radiation-1997",
  },
  {
    name: "American Academy of Dermatology",
    title: "Sunscreen FAQs",
    url: "https://www.aad.org/media/stats-sunscreen",
  },
  {
    name: "Skin Cancer Foundation",
    title: "Skin cancer facts & statistics",
    url: "https://www.skincancer.org/skin-cancer-information/skin-cancer-facts/",
  },
];

export default function ScienceSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("science");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl pb-8">
        <SheetHeader>
          <SheetTitle className="font-display text-xl">
            {t("title")}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4">
          <p className="text-foreground leading-relaxed">{t("intro")}</p>

          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">
              {t("sources")}
            </h3>
            <ul className="space-y-3">
              {SOURCES.map((s) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg border border-border px-4 py-3 hover:bg-surface transition-colors"
                  >
                    <span className="block text-sm font-medium text-foreground">
                      {s.name}
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      {s.title}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <Link
            href="/learn"
            className="text-sm text-brand-ink underline-offset-4 hover:underline"
          >
            {t("learnMoreLink")}
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}

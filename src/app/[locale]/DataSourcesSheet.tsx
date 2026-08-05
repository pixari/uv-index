"use client";

import { useTranslations } from "next-intl";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const SOURCES = [
  {
    name: "MET Norway",
    url: "https://api.met.no/weatherapi/locationforecast/2.0/documentation",
    key: "met",
  },
  {
    name: "Open-Meteo",
    url: "https://open-meteo.com/en/docs/geocoding-api",
    key: "openMeteo",
  },
  {
    name: "BigDataCloud",
    url: "https://www.bigdatacloud.com/geocoding-apis/free-reverse-geocode-to-city-api",
    key: "bigDataCloud",
  },
];

export default function DataSourcesSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("dataSources");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl pb-8">
        <SheetHeader>
          <SheetTitle className="font-display text-xl">
            {t("title")}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4">
          <p className="text-foreground leading-relaxed">
            {t("locationNote")}
          </p>

          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">
              {t("sources")}
            </h3>
            <ul className="space-y-3">
              {SOURCES.map((s) => (
                <li key={s.key}>
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
                      {t(`uses.${s.key}`)}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("analyticsNote")}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

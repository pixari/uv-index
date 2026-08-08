// Attribution for each item in /learn's "myths" section — one org per myth
// since, unlike most of this page, each one traces back to a different
// primary source. Shared between LearnClient (rendering the section) and
// the page's FAQPage structured data (SEO), so the two lists of myths
// can't quietly drift apart from each other.
export const MYTH_KEYS = ["reapplySpf", "clouds", "darkSkin", "baseTan", "expiration"] as const;
export type MythKey = (typeof MYTH_KEYS)[number];

export const MYTH_SOURCES: Record<MythKey, { label: string; url: string }> = {
  reapplySpf: {
    label: "American Academy of Dermatology",
    url: "https://www.aad.org/public/everyday-care/sun-protection/shade-clothing-sunscreen/how-to-apply-sunscreen",
  },
  clouds: {
    label: "WHO/WMO/UNEP/ICNIRP",
    url: "https://www.who.int/publications/i/item/9241590076",
  },
  darkSkin: {
    label: "Skin Cancer Foundation",
    url: "https://www.skincancer.org/blog/are-people-of-color-at-risk-for-skin-cancer/",
  },
  baseTan: {
    label: "American Academy of Dermatology",
    url: "https://www.aad.org/news/new-survey-reveals-public-confusion-about-risks-of-tanning-and-sunburns",
  },
  expiration: {
    label: "U.S. Food and Drug Administration",
    url: "https://www.fda.gov/drugs/understanding-over-counter-medicines/sunscreen-how-help-protect-your-skin-sun",
  },
};

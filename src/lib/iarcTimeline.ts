// Real dates from IARC Monographs — the same body already cited in
// ScienceSheet/DataSourcesSheet's source list.
export type IarcMilestone = { year: number; key: string; url: string };

export const IARC_TIMELINE: IarcMilestone[] = [
  {
    year: 1992,
    key: "solarUv",
    // IARC Monograph Volume 55, working group met in Lyon, 11-18 Feb 1992.
    url: "https://publications.iarc.fr/Book-And-Report-Series/Iarc-Monographs-On-The-Identification-Of-Carcinogenic-Hazards-To-Humans/Solar-And-Ultraviolet-Radiation-1997",
  },
  {
    year: 2009,
    key: "tanningDevices",
    // IARC Monograph Volume 100D.
    url: "https://www.thelancet.com/journals/lanonc/article/PIIS1470-2045(09)70213-X/fulltext",
  },
];

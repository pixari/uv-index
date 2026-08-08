// The "frosted glass" card treatment used for every floating panel on
// Home's dark sky background (the UV scale card, ReapplyTimer) — kept in
// one place so the two don't quietly drift into slightly different
// translucency/blur values over time. Layout classes (flex, gap, padding,
// width) stay local to each usage since those genuinely differ.
export const GLASS_CARD =
  "rounded-3xl bg-white/12 shadow-lg ring-1 ring-white/15 backdrop-blur-xl";

import { readFile } from "node:fs/promises";
import path from "node:path";

// Social-preview crawlers (Facebook, X, WhatsApp, Slack, iMessage) hit
// these image routes on every share — fetching a font from Google's CDN at
// request time would make "always beautiful" depend on an external
// service's uptime for something as basic as a headline rendering. The
// font file is vendored locally instead (Fraunces, SIL Open Font License,
// same family DESIGN.md specifies for the app's own display type).
//
// Plain fs.readFile against a process.cwd()-relative path — not
// `fetch(new URL(..., import.meta.url))`, the pattern Next's own docs show
// for this. That pattern is Edge-runtime-only: Node's built-in fetch
// doesn't implement the file: scheme, so it fails here with "not
// implemented... yet". The corresponding half of the fix is
// `outputFileTracingIncludes` in next.config.ts, which is what actually
// gets this file shipped into `output: "standalone"` — a raw fs read like
// this one isn't traced automatically the way a JS import would be.
async function loadFont(relativePath: string) {
  return readFile(path.join(process.cwd(), relativePath));
}

export async function loadFrauncesFonts() {
  const [bold, semiBold] = await Promise.all([
    loadFont("src/assets/fonts/Fraunces-Bold.ttf"),
    loadFont("src/assets/fonts/Fraunces-SemiBold.ttf"),
  ]);
  return [
    { name: "Fraunces", data: bold, weight: 700 as const, style: "normal" as const },
    { name: "Fraunces", data: semiBold, weight: 600 as const, style: "normal" as const },
  ];
}

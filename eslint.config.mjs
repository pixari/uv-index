import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // This app's state is fundamentally client-only (localStorage
      // profiles/prefs, geolocation, visibility/focus events, polling) —
      // none of it exists during SSR, so every read has to happen in a
      // `useEffect` after mount rather than a lazy `useState` initializer,
      // which would render empty on the server and mismatch on hydration.
      // That's exactly the "synchronize with an external system" case the
      // rule's own docs carve out, not the derived-state antipattern it's
      // meant to catch — every flagged call site here is an external-system
      // sync (storage, timers, DOM events, geolocation), not one piece of
      // React state mirroring another.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
  ]),
]);

export default eslintConfig;

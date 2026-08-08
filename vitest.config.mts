import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Mirrors tsconfig.json's "@/*" -> "./src/*" path mapping. Next's own
  // build resolves that via tsconfig automatically; Vitest's Vite-based
  // resolver needs it spelled out, or any test that transitively imports
  // an "@/..." absolute import (not just relative sibling imports, which
  // is all that happened to be needed here before) fails to resolve.
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
    setupFiles: ["./vitest.setup.ts"],
  },
});

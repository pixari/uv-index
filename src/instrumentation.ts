// Runs once when the Next.js server process starts (see
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation.md).
// Used here purely to start the background high-UV push scheduler —
// nothing else in this app needs process-boot code.
export async function register() {
  // proxy.ts (this app's middleware) and any edge-targeted code also
  // triggers `register`, but node:sqlite/web-push are Node-only —
  // guard against ever importing them into an edge bundle.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { startPushScheduler } = await import("./lib/pushScheduler");
  await startPushScheduler();
}

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "UV Index",
    short_name: "UV Index",
    description: "Real-time UV index, mobile-first.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/pwa-icon/192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/pwa-icon/512",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/pwa-icon/512-maskable",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    // Manifest shortcuts are static — they can't point at a specific saved
    // place, since those live in each browser's own localStorage, not
    // anywhere this server-rendered route can see. HomeClient reads the
    // `action` param on load and performs it (jumps straight to a fresh
    // GPS reading, or opens the location sheet with saved places visible)
    // instead.
    shortcuts: [
      {
        name: "Use my location",
        short_name: "My location",
        url: "/?action=gps",
        icons: [{ src: "/pwa-icon/192", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Saved places",
        short_name: "Saved",
        url: "/?action=location",
        icons: [{ src: "/pwa-icon/192", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}

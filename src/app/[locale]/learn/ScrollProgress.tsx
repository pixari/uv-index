"use client";

import { useEffect, useState } from "react";

// A thin, fixed progress bar for a page long enough that "where am I"
// is a real question (~11,000px, per LearnClient's own footer comment).
// Deliberately a plain brand fill, not the WHO risk gradient — this isn't
// a risk signal, and DESIGN.md reserves that palette for the actual UV
// scale so it isn't diluted by reuse as decoration here.
export default function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function onScroll() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div aria-hidden className="fixed inset-x-0 top-0 z-50 h-0.5 bg-transparent">
      <div
        className="h-full bg-brand transition-[width] duration-100 ease-out"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}

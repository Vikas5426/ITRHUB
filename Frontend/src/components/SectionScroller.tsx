"use client";

import { useEffect } from "react";

export function SectionScroller({ sections }: { sections: string[] }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const target = window.location.hash.replace("#", "") || params.get("section");

    if (!target || !sections.includes(target)) return;

    window.setTimeout(() => {
      document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, [sections]);

  return null;
}

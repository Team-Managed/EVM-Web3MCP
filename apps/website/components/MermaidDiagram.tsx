"use client";

import { useEffect, useRef } from "react";

// Mermaid keeps global state while it draws, so two diagrams drawn at once can land in each other's SVG
// and leave one empty. Every diagram on the page waits for the one before it.
let queue: Promise<unknown> = Promise.resolve();

export function MermaidDiagram({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    queue = queue
      // Bundled from npm so the lockfile pins the version; Next loads it only on pages with a diagram.
      .then(() => import("mermaid"))
      .then(({ default: mermaid }) => {
        if (cancelled || !ref.current) return;
        mermaid.initialize({ startOnLoad: false, theme: "base", securityLevel: "strict" });
        return mermaid.run({ nodes: [ref.current] });
      })
      .catch(() => {
        if (ref.current) ref.current.dataset.renderError = "true";
      });
    return () => { cancelled = true; };
  }, [chart]);

  return (
    <div className="my-8 overflow-x-auto border border-[#E2DFD7] bg-white p-5 shadow-[5px_5px_0_#F0E9DD]">
      <div ref={ref} className="mermaid min-w-[620px] text-center text-xs text-[#5A5D64]">{chart}</div>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";

export function MermaidDiagram({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    // Bundled from npm so the lockfile pins the version; Next loads it only on pages with a diagram.
    import("mermaid").then(({ default: mermaid }) => {
      if (cancelled || !ref.current) return;
      mermaid.initialize({ startOnLoad: false, theme: "base", securityLevel: "strict" });
      return mermaid.run({ nodes: [ref.current] });
    }).catch(() => {
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

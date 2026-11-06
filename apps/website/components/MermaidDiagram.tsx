"use client";

import { useEffect, useRef } from "react";

type MermaidApi = {
  initialize: (options: { startOnLoad: boolean; theme: string; securityLevel: string }) => void;
  run: (options: { nodes: HTMLElement[] }) => Promise<void>;
};

declare global {
  interface Window {
    mermaid?: MermaidApi;
  }
}

let mermaidPromise: Promise<MermaidApi> | undefined;

function loadMermaid() {
  if (window.mermaid) return Promise.resolve(window.mermaid);
  if (!mermaidPromise) {
    mermaidPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[data-mermaid="true"]');
      const script = existing ?? document.createElement("script");
      script.dataset.mermaid = "true";
      script.src = "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js";
      script.onload = () => window.mermaid ? resolve(window.mermaid) : reject(new Error("Mermaid did not load"));
      script.onerror = () => reject(new Error("Unable to load Mermaid"));
      if (!existing) document.head.appendChild(script);
    });
  }
  return mermaidPromise;
}

export function MermaidDiagram({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadMermaid().then((mermaid) => {
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

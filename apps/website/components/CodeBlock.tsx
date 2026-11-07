"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** A dark code block with its own copy button. Give each command its own block, so each copies on its own. */
export function CodeBlock({ children, label }: { children: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () =>
    navigator.clipboard.writeText(children).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => {},
    );

  return (
    <div>
      {label && <p className="mb-1.5 font-mono text-[11px] text-[#7A7E87]">{label}</p>}
      <div className="relative">
        <pre className="no-scrollbar overflow-x-auto whitespace-pre-wrap break-words border border-[#2C3036] bg-[#111316] p-5 pr-14 font-mono text-xs leading-6 text-[#E8E5DD] shadow-[5px_5px_0_#D6C8B1]">
          <code>{children}</code>
        </pre>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Copied" : "Copy to clipboard"}
          title={copied ? "Copied" : "Copy"}
          className="absolute right-2.5 top-2.5 inline-flex h-8 w-8 items-center justify-center border border-white/15 bg-white/5 text-[#C9C5BA] transition-colors hover:bg-white/15 hover:text-white"
        >
          {copied ? <Check className="h-4 w-4 text-[#7EE2A8]" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

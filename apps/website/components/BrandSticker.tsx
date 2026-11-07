"use client";

import { useState } from "react";

export type BrandKey = "ethereum" | "ens" | "arkiv" | "claude" | "openai" | "metamask" | "viem" | "typescript" | "node";

// domain: where Logo.dev finds the logo; without one, the brand's text mark is shown.
// fill: Logo.dev returns a filled square icon, so it fills the card instead of floating on white.
const BRANDS: Record<BrandKey, { name: string; domain?: string; initials: string; fill?: boolean }> = {
  ethereum: { name: "Ethereum", domain: "ethereum.org", initials: "Ξ" },
  ens: { name: "ENS", domain: "ens.domains", initials: "ENS", fill: true },
  // Logo.dev has a page image, not a logo, for arkiv.network.
  arkiv: { name: "Arkiv", initials: "[A]" },
  claude: { name: "Claude", domain: "anthropic.com", initials: "C", fill: true },
  openai: { name: "OpenAI", domain: "openai.com", initials: "AI" },
  metamask: { name: "MetaMask", domain: "metamask.io", initials: "M" },
  viem: { name: "viem", domain: "viem.sh", initials: "V" },
  typescript: { name: "TypeScript", domain: "typescriptlang.org", initials: "TS" },
  node: { name: "Node.js", domain: "nodejs.org", initials: "JS" },
};

/** `px` is the displayed size; retina doubles it. */
function logoUrl(domain: string, px: number) {
  // Logo.dev publishable tokens are meant to be visible in the browser; the env var lets a deployment use its own.
  const token = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN || "pk_BZOhereATUe11DHE7ILvBg";
  const params = new URLSearchParams({ size: String(px), format: "webp", retina: "true", fallback: "monogram", token });
  return `https://img.logo.dev/${domain}?${params.toString()}`;
}

export function BrandSticker({ brand, compact = false }: { brand: BrandKey; compact?: boolean }) {
  const data = BRANDS[brand];
  const [failed, setFailed] = useState(!data.domain);

  return (
    <span className={`group inline-flex items-center gap-2 rounded-xl border border-white/70 bg-white/85 shadow-[0_5px_0_rgba(17,19,22,0.12)] backdrop-blur-sm transition-transform hover:-translate-y-1 ${compact ? "px-2 py-1.5" : "px-3 py-2"}`} title={data.name}>
      <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#E2DFD7] bg-[#FAF9F6] ${compact ? "h-6 w-6" : "h-8 w-8"}`}>
        {!failed && data.domain ? <img src={logoUrl(data.domain, 32)} alt={`${data.name} logo`} className="h-full w-full object-contain p-1" onError={() => setFailed(true)} /> : <span className="font-mono text-[9px] font-bold text-[#111316]">{data.initials}</span>}
      </span>
      {!compact && <span className="font-sans text-xs font-semibold text-[#111316]">{data.name}</span>}
    </span>
  );
}

/** A big tilted app-icon card peeking from a tile's corner, in the stickers' style. Decorative, so screen readers skip it. */
export function BrandLogo({ brand }: { brand: BrandKey }) {
  const data = BRANDS[brand];
  const [failed, setFailed] = useState(!data.domain);
  return (
    <span aria-hidden="true" className="flex h-32 w-32 rotate-[-8deg] items-center justify-center overflow-hidden rounded-[1.75rem] border border-[#E2DFD7] bg-white shadow-[0_10px_0_rgba(17,19,22,0.14)] sm:h-36 sm:w-36">
      {!failed && data.domain ? <img src={logoUrl(data.domain, 144)} alt="" className={`h-full w-full ${data.fill ? "object-cover" : "object-contain p-6"}`} onError={() => setFailed(true)} /> : <span className="font-mono text-4xl font-bold tracking-tight text-[#111316]">{data.initials}</span>}
    </span>
  );
}

export function BrandStickerRail({ brands }: { brands: BrandKey[] }) {
  return <div className="flex flex-wrap items-center justify-center gap-3">{brands.map((brand) => <BrandSticker key={brand} brand={brand} />)}</div>;
}

"use client";

import { useState } from "react";

export type BrandKey =
  | "ethereum"
  | "ens"
  | "arkiv"
  | "claude"
  | "openai"
  | "metamask"
  | "walletconnect"
  | "cursor"
  | "uniswap"
  | "viem"
  | "typescript"
  | "node";

const BRANDS: Record<BrandKey, { name: string; domain: string; initials: string }> = {
  ethereum: { name: "Ethereum", domain: "ethereum.org", initials: "Ξ" },
  ens: { name: "ENS", domain: "ens.domains", initials: "ENS" },
  arkiv: { name: "Arkiv", domain: "arkiv.network", initials: "A" },
  claude: { name: "Claude", domain: "anthropic.com", initials: "C" },
  openai: { name: "OpenAI", domain: "openai.com", initials: "AI" },
  metamask: { name: "MetaMask", domain: "metamask.io", initials: "M" },
  walletconnect: { name: "WalletConnect", domain: "walletconnect.com", initials: "W" },
  cursor: { name: "Cursor", domain: "cursor.com", initials: "C" },
  uniswap: { name: "Uniswap", domain: "uniswap.org", initials: "U" },
  viem: { name: "viem", domain: "viem.sh", initials: "V" },
  typescript: { name: "TypeScript", domain: "typescriptlang.org", initials: "TS" },
  node: { name: "Node.js", domain: "nodejs.org", initials: "JS" },
};

function logoUrl(domain: string) {
  const token = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN;
  const params = new URLSearchParams({ size: "96", format: "png", fallback: "monogram" });
  if (token) params.set("token", token);
  return `https://img.logo.dev/${domain}?${params.toString()}`;
}

export function BrandSticker({ brand, compact = false }: { brand: BrandKey; compact?: boolean }) {
  const [failed, setFailed] = useState(false);
  const data = BRANDS[brand];

  return (
    <span className={`group inline-flex items-center gap-2 rounded-xl border border-white/70 bg-white/85 shadow-[0_5px_0_rgba(17,19,22,0.12)] backdrop-blur-sm transition-transform hover:-translate-y-1 ${compact ? "px-2 py-1.5" : "px-3 py-2"}`} title={data.name}>
      <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#E2DFD7] bg-[#FAF9F6] ${compact ? "h-6 w-6" : "h-8 w-8"}`}>
        {!failed ? <img src={logoUrl(data.domain)} alt={`${data.name} logo`} className="h-full w-full object-contain p-1" onError={() => setFailed(true)} /> : <span className="font-sans text-[9px] font-bold text-[#5A5D64]">{data.initials}</span>}
      </span>
      {!compact && <span className="font-sans text-xs font-semibold text-[#111316]">{data.name}</span>}
    </span>
  );
}

export function BrandStickerRail({ brands }: { brands: BrandKey[] }) {
  return <div className="flex flex-wrap items-center justify-center gap-3">{brands.map((brand) => <BrandSticker key={brand} brand={brand} />)}</div>;
}

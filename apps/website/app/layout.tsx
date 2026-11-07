import type { Metadata, Viewport } from "next";
import { SHARE_IMAGE, SITE_URL } from "@/lib/data";
import "./globals.css";

const title = "Web3MCP — The Open Protocol Between Smart Contracts and AI Agents";
const description =
  "Smart contracts publish tool manifests under their own ENS name. One plugin for Claude Code and Codex discovers them, reads contracts, simulates writes, and routes signing to your wallet.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Pages set a short title, such as "Documentation", and get " — Web3MCP" appended.
  title: { default: title, template: "%s — Web3MCP" },
  description,
  applicationName: "Web3MCP",
  keywords: ["Web3MCP", "Ethereum", "ENS", "AI agents", "smart contracts", "Claude Code", "Codex", "plugin", "Arkiv", "Uniswap", "MCP", "ETHGlobal"],
  authors: [{ name: "Team-Managed", url: "https://github.com/Team-Managed/EVM-Web3MCP" }],
  creator: "Team-Managed",
  alternates: { canonical: "/" },
  icons: { icon: "/logo.svg", apple: "/apple-touch-icon.png" },
  openGraph: { type: "website", url: "/", siteName: "Web3MCP", locale: "en_US", title, description, images: [SHARE_IMAGE] },
  twitter: { card: "summary_large_image", title, description, images: [SHARE_IMAGE] },
};

export const viewport: Viewport = { themeColor: "#FAF9F6" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=Lora:ital,wght@0,400;0,500;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#EAE8E1] text-[#111316] antialiased selection:bg-[#E57E25] selection:text-white">
        {children}
      </body>
    </html>
  );
}

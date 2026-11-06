import React from "react";

export interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
  showText?: boolean;
}

/**
 * Web3MCP Official Logo Mark
 * - Architectural wireframe crest cut at the waist
 * - Hollow transparent centers with colored wireframe strokes
 * - 4 distinct facet colors:
 *    - Top Diamond Apex: Ethereum Indigo/Violet (#6366F1)
 *    - Left Wing Facet: Web3MCP Amber (#E57E25)
 *    - Right Wing Facet: Electric Teal/Cyan (#06B6D4)
 *    - Center Diamond Node: Adaptive currentColor (White on dark, Obsidian on light)
 */
export function Logo({
  size = 26,
  className = "",
  showText = false,
  ...props
}: LogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={Math.round(size * 0.85)}
        viewBox="0 0 100 85"
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200"
        aria-label="Web3MCP Logo"
        {...props}
      >
        {/* Top Ethereum Diamond Apex (Indigo / Violet) */}
        <polygon points="50,10 68,28 50,42 32,28" stroke="#6366F1" />

        {/* Left Wing Facet (Web3MCP Amber) */}
        <polygon points="28,32 14,54 42,68 50,48" stroke="#E57E25" />

        {/* Right Wing Facet (Electric Teal / Cyan) */}
        <polygon points="72,32 86,54 58,68 50,48" stroke="#06B6D4" />

        {/* Center Diamond Node (Adaptive currentColor) */}
        <polygon points="50,48 58,60 50,72 42,60" stroke="currentColor" />
      </svg>

      {showText && (
        <span className="font-sans font-bold tracking-tight text-base sm:text-lg">
          Web3MCP
        </span>
      )}
    </div>
  );
}

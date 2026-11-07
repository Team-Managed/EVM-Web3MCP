import React from "react";

export interface LogoProps extends React.SVGProps<SVGSVGElement> {
  /** Height in pixels; the mark is taller than it is wide. */
  size?: number;
  className?: string;
  showText?: boolean;
}

/**
 * Web3MCP logo mark: an Ethereum diamond as the head of a plug.
 * Any EVM contract, plugged into an AI agent. The diamond keeps its amber facets;
 * the plug uses currentColor, so it is light on dark backgrounds and ink on light ones.
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
        width={Math.round((size * 100) / 172)}
        height={size}
        viewBox="0 0 100 172"
        strokeWidth="4"
        strokeLinejoin="round"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200"
        role="img"
        aria-label="Web3MCP"
        {...props}
      >
        <polygon points="50,4 4,80 50,62" fill="#F4A25A" stroke="#F4A25A" />
        <polygon points="50,4 50,62 96,80" fill="#E57E25" stroke="#E57E25" />
        <polygon points="4,80 50,62 50,80" fill="#C96716" stroke="#C96716" />
        <polygon points="50,62 96,80 50,80" fill="#9E4F0E" stroke="#9E4F0E" />
        <polygon points="4,91 96,91 69,127 31,127" fill="currentColor" stroke="currentColor" />
        <rect x="31" y="118" width="12" height="50" rx="6" fill="currentColor" />
        <rect x="57" y="118" width="12" height="50" rx="6" fill="currentColor" />
      </svg>

      {showText && (
        <span className="font-sans font-bold tracking-tight text-base sm:text-lg">
          Web3MCP
        </span>
      )}
    </div>
  );
}

"use client";

import React, { useEffect, useRef } from "react";

export interface HeroRibbonWaveProps {
  /**
   * Animation speed multiplier:
   * - 0: completely static (renders once, no requestAnimationFrame loop)
   * - 0.12: slow, gentle drifting motion ("a bit moving in footer")
   * - 0.45: default dynamic hero wave speed
   */
  speed?: number;
  /**
   * If true, renders a single static frame snapshot and avoids running an animation loop.
   * Ideal for docs and editorial sections.
   */
  isStatic?: boolean;
  /**
   * Fixed time offset (in seconds) for the wave phase.
   * Defaults to 1.0 for static frames (where ribbons are broad and clearly unfurled), or 0 for animations.
   */
  timeOffset?: number;
  /**
   * Optional CSS classes for the canvas container.
   */
  className?: string;
  /**
   * Optional opacity (0 to 1).
   */
  opacity?: number;
}

/**
 * Broader, Full-Coverage 3D Ribbon Wave with Vivid ASCII Art & Bayer Dithering
 * Inspired by Handhold & 3D silk ribbon topology:
 * - Sweeping 3D ribbons covering the entire canvas (top, center, bottom, left to right)
 * - Vivid Electric Azure/Cobalt Blue front face & Warm Golden Amber back fold
 * - High-contrast 4x4 Bayer Matrix ordered dithering with full ASCII density scale:
 *   ["·", ":", "+", "x", "*", "#", "%", "@"]
 * - Rich ambient dither stipple field across 100% of the canvas
 * - Supports animated, slow drifting, and completely static modes
 */
export function HeroRibbonWave({
  speed = 0.45,
  isStatic = false,
  timeOffset,
  className = "",
  opacity = 1,
}: HeroRibbonWaveProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    const startTime = performance.now();
    const effectiveSpeed = isStatic ? 0 : speed;
    const baseTimeOffset = timeOffset ?? (isStatic ? 1.0 : 0);

    // 4x4 Bayer Dithering Matrix (standard threshold distribution)
    const BAYER_4X4 = [
      [ 0 / 16,  8 / 16,  2 / 16, 10 / 16],
      [12 / 16,  4 / 16, 14 / 16,  6 / 16],
      [ 3 / 16, 11 / 16,  1 / 16,  9 / 16],
      [15 / 16,  7 / 16, 13 / 16,  5 / 16],
    ];

    // Full ASCII Density Scale from light stipple to solid character fill
    const ASCII_CHARS = ["·", ":", "+", "x", "*", "#", "%", "@"];

    // Vibrant Electric Azure & Cobalt Palette (Front face)
    const BLUE_PEAK = "rgba(56, 189, 248, 0.98)";   // Vivid Ice Cyan highlight
    const BLUE_MID = "rgba(37, 99, 235, 0.96)";     // Electric Azure Blue
    const BLUE_SHADE = "rgba(30, 58, 138, 0.95)";   // Deep Cobalt Navy shadow

    // Rich Warm Golden Amber & Terracotta Palette (Back face / fold)
    const AMBER_PEAK = "rgba(251, 191, 36, 0.98)";  // Bright Sun Gold highlight
    const AMBER_MID = "rgba(217, 119, 6, 0.96)";    // Rich Golden Amber
    const AMBER_SHADE = "rgba(146, 64, 14, 0.95)";  // Deep Rust Terracotta shadow

    // Ambient Stipple Tint
    const AMBIENT_BLUE = "rgba(37, 99, 235, 0.22)";
    const AMBIENT_AMBER = "rgba(217, 119, 6, 0.22)";

    let currentW = 0;
    let currentH = 0;

    const resize = () => {
      if (!canvas || !canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      const w = Math.max(rect.width, 320);
      const h = Math.max(rect.height, 100);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        currentW = w;
        currentH = h;
      }
    };

    resize();

    const render = (now: number) => {
      const parent = canvas.parentElement;
      const w = parent ? parent.clientWidth : currentW || 1200;
      const h = parent ? parent.clientHeight : currentH || 600;

      if (w !== currentW || h !== currentH) {
        resize();
      }

      // Base canvas background: pristine gallery warm off-white
      ctx.fillStyle = "#FAF9F6";
      ctx.fillRect(0, 0, w, h);

      // Animation time counter
      const elapsed = isStatic || effectiveSpeed === 0 ? 0 : (now - startTime) * 0.001;
      const t = baseTimeOffset + elapsed * effectiveSpeed;

      // 11px cells: optimal balance between crisp ASCII glyph definition and full-screen density
      const cellSize = 11;
      const cols = Math.ceil(w / cellSize);
      const rows = Math.ceil(h / cellSize);

      ctx.font = "bold 11px 'JetBrains Mono', 'Courier New', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let c = 0; c < cols; c++) {
        const x = c * cellSize + cellSize / 2;
        const normX = x / w;

        // ==============================================================
        // 1. GRAND PRIMARY 3D RIBBON (Massive, broad, sweeping Mobius twist)
        // Spans across the center, arching up on left, twisting across center, swooping on right
        // ==============================================================
        const spine1Y =
          h * 0.50 +
          Math.sin(normX * Math.PI * 1.9 - t * 0.75) * (h * 0.22) +
          Math.cos(normX * Math.PI * 3.1 + t * 0.4) * (h * 0.08);

        // Ribbon thickness scales with container height
        const baseThickness1 = h * 0.44;
        const thickness1 =
          baseThickness1 * (0.85 + 0.3 * Math.sin(normX * Math.PI * 1.6 + t * 0.5));

        // 3D twist along ribbon spine
        const twist1 = normX * Math.PI * 2.2 - t * 0.65;
        const cosTwist = Math.cos(twist1);
        const sinTwist = Math.sin(twist1);
        // Apparent projected thickness as ribbon turns towards/away from camera
        const projThick1 = thickness1 * (0.35 + 0.65 * Math.abs(cosTwist));

        // ==============================================================
        // 2. UPPER SECONDARY WAVE (Azure & Ice Cyan flow covering upper area)
        // ==============================================================
        const spine2Y =
          h * 0.20 +
          Math.cos(normX * Math.PI * 1.8 + t * 0.6) * (h * 0.12) -
          Math.sin(normX * Math.PI * 3.0 - t * 0.35) * (h * 0.05);
        const thickness2 = (h * 0.26) * (0.8 + 0.25 * Math.cos(normX * Math.PI * 1.7 - t * 0.4));

        // ==============================================================
        // 3. LOWER SECONDARY WAVE (Warm Amber & Honey flow covering lower area)
        // ==============================================================
        const spine3Y =
          h * 0.78 +
          Math.sin(normX * Math.PI * 1.8 - t * 0.55) * (h * 0.14) +
          Math.cos(normX * Math.PI * 2.8 + t * 0.3) * (h * 0.05);
        const thickness3 = (h * 0.28) * (0.8 + 0.25 * Math.sin(normX * Math.PI * 2.1 + t * 0.4));

        for (let r = 0; r < rows; r++) {
          const y = r * cellSize + cellSize / 2;
          const normY = y / h;

          const bayerX = c % 4;
          const bayerY = r % 4;
          const bayerVal = BAYER_4X4[bayerY][bayerX];

          // Normalized distances from ribbon centers [-1, 1]
          const d1 = Math.abs(y - spine1Y) / (projThick1 / 2);
          const d2 = Math.abs(y - spine2Y) / (thickness2 / 2);
          const d3 = Math.abs(y - spine3Y) / (thickness3 / 2);

          if (d1 <= 1.0) {
            // -----------------------------------------------------------
            // PRIMARY 3D RIBBON SURFACE
            // -----------------------------------------------------------
            const v = (y - spine1Y) / (projThick1 / 2); // -1 (top edge) to +1 (bottom edge)
            const surfaceArch = Math.sqrt(Math.max(0, 1 - v * v));

            // Face determination: front (Azure) vs back fold (Amber)
            const face = sinTwist + v * 0.45 * cosTwist;

            if (face >= 0) {
              // --- FRONT FACE: VIBRANT COBALT & ELECTRIC AZURE ---
              const light = 0.52 + 0.48 * (surfaceArch * 0.75 - v * 0.35 * Math.sin(t * 0.5));
              const ditherScore = light + (bayerVal - 0.5) * 0.55;
              const charIdx = Math.max(1, Math.min(ASCII_CHARS.length - 1, Math.floor(ditherScore * ASCII_CHARS.length)));
              const char = ASCII_CHARS[charIdx];

              if (light > 0.72) {
                ctx.fillStyle = BLUE_PEAK;
              } else if (light > 0.44) {
                ctx.fillStyle = BLUE_MID;
              } else {
                ctx.fillStyle = BLUE_SHADE;
              }

              ctx.fillText(char, x, y);

            } else {
              // --- BACK FACE / FOLD: WARM GOLDEN AMBER & OCHRE ---
              const light = 0.52 + 0.48 * (surfaceArch * 0.75 + v * 0.35 * Math.cos(t * 0.5));
              const ditherScore = light + (bayerVal - 0.5) * 0.55;
              const charIdx = Math.max(1, Math.min(ASCII_CHARS.length - 1, Math.floor(ditherScore * ASCII_CHARS.length)));
              const char = ASCII_CHARS[charIdx];

              if (light > 0.72) {
                ctx.fillStyle = AMBER_PEAK;
              } else if (light > 0.44) {
                ctx.fillStyle = AMBER_MID;
              } else {
                ctx.fillStyle = AMBER_SHADE;
              }

              ctx.fillText(char, x, y);
            }

          } else if (d2 <= 1.0) {
            // -----------------------------------------------------------
            // UPPER AZURE & CYAN HARMONIC WAVE
            // -----------------------------------------------------------
            const v2 = (y - spine2Y) / (thickness2 / 2);
            const surfaceArch2 = Math.sqrt(Math.max(0, 1 - v2 * v2));
            const light2 = 0.5 + 0.5 * (surfaceArch2 * 0.8 + 0.2 * Math.sin(normX * 8 + t));
            const ditherScore2 = light2 + (bayerVal - 0.5) * 0.5;
            const charIdx = Math.max(1, Math.min(ASCII_CHARS.length - 1, Math.floor(ditherScore2 * ASCII_CHARS.length)));
            const char = ASCII_CHARS[charIdx];

            ctx.fillStyle = light2 > 0.65 ? BLUE_PEAK : BLUE_MID;
            ctx.fillText(char, x, y);

          } else if (d3 <= 1.0) {
            // -----------------------------------------------------------
            // LOWER GOLDEN AMBER & SAND HARMONIC WAVE
            // -----------------------------------------------------------
            const v3 = (y - spine3Y) / (thickness3 / 2);
            const surfaceArch3 = Math.sqrt(Math.max(0, 1 - v3 * v3));
            const light3 = 0.5 + 0.5 * (surfaceArch3 * 0.8 + 0.2 * Math.cos(normX * 7 - t));
            const ditherScore3 = light3 + (bayerVal - 0.5) * 0.5;
            const charIdx = Math.max(1, Math.min(ASCII_CHARS.length - 1, Math.floor(ditherScore3 * ASCII_CHARS.length)));
            const char = ASCII_CHARS[charIdx];

            ctx.fillStyle = light3 > 0.65 ? AMBER_PEAK : AMBER_MID;
            ctx.fillText(char, x, y);

          } else {
            // -----------------------------------------------------------
            // FULL-CANVAS AMBIENT STIPPLE DITHERING
            // Spans the entire screen with delicate, visible ASCII dots
            // -----------------------------------------------------------
            if (bayerVal > 0.40) {
              const char = bayerVal > 0.75 ? ":" : "·";
              ctx.fillStyle = normY < 0.5 ? AMBIENT_BLUE : AMBIENT_AMBER;
              ctx.fillText(char, x, y);
            }
          }
        }
      }
    };

    const handleResize = () => {
      resize();
      if (isStatic || effectiveSpeed === 0) {
        render(startTime);
      }
    };

    window.addEventListener("resize", handleResize);

    if (isStatic || effectiveSpeed === 0) {
      render(startTime);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }

    const loop = (now: number) => {
      render(now);
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [speed, isStatic, timeOffset]);

  return (
    <div
      className={`absolute inset-0 z-0 overflow-hidden pointer-events-none select-none ${className}`}
      style={{ opacity }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover block"
        aria-hidden="true"
      />
    </div>
  );
}

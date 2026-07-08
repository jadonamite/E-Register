"use client";

import { useId } from "react";

interface Point {
  date: string;
  count: number;
}

/** Catmull-Rom → cubic bezier for a smooth curve through every point. */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/**
 * Luminous area chart for the glow tiles — neon emerald curve, gradient wash,
 * white-core markers, pulsing latest point. Pure SVG, no chart library.
 */
export function TrendCurve({ data, compact = false }: { data: Point[]; compact?: boolean }) {
  const gradientId = useId();

  if (!data || data.length < 2) {
    return (
      <div className="w-full h-full min-h-[80px] flex items-center justify-center text-white/20 font-black tracking-widest text-[10px]">
        NOT ENOUGH DATA YET
      </div>
    );
  }

  // Wide viewBox for the full band keeps the rendered height cinematic-short.
  const W = compact ? 600 : 1300;
  const H = compact ? 130 : 260;
  const PAD_X = compact ? 16 : 40;
  const TOP = compact ? 30 : 52;
  const BOTTOM = compact ? 14 : 22;
  const max = Math.max(...data.map((d) => d.count), 1);

  const pts = data.map((d, i) => ({
    x: PAD_X + (i * (W - 2 * PAD_X)) / (data.length - 1),
    y: H - BOTTOM - (d.count / max) * (H - BOTTOM - TOP),
  }));

  const line = smoothPath(pts);
  const area = `${line} L ${pts[pts.length - 1].x} ${H - BOTTOM + 6} L ${pts[0].x} ${H - BOTTOM + 6} Z`;
  const last = pts[pts.length - 1];

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={area} fill={`url(#${gradientId})`} />
        {/* neon tube: soft halo stroke under the solid stroke */}
        <path d={line} fill="none" stroke="rgba(52,211,153,0.30)" strokeWidth={compact ? 9 : 12} strokeLinecap="round" />
        <path d={line} fill="none" stroke="#34d399" strokeWidth={compact ? 3 : 4} strokeLinecap="round" />

        {pts.map((p, i) => {
          const isLast = i === pts.length - 1;
          return (
            <g key={i}>
              {isLast && (
                <circle cx={p.x} cy={p.y} r={compact ? 6 : 9} fill="none" stroke="#34d399" strokeWidth="2" opacity="0.7">
                  <animate attributeName="r" values={compact ? "6;16" : "9;24"} dur="1.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.7;0" dur="1.8s" repeatCount="indefinite" />
                </circle>
              )}
              <circle cx={p.x} cy={p.y} r={compact ? (isLast ? 5.5 : 4.5) : isLast ? 7.5 : 6} fill="#fff" stroke="#34d399" strokeWidth={compact ? 2.5 : 3.5} />
              {(!compact || isLast) && (
                <text
                  x={p.x}
                  y={p.y - (compact ? 14 : 20)}
                  textAnchor="middle"
                  fill={isLast ? "#a7f3d0" : "rgba(255,255,255,0.45)"}
                  fontSize={compact ? (isLast ? 15 : 12) : isLast ? 22 : 17}
                  fontWeight="800"
                >
                  {data[i].count}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {!compact && (
        <div className="flex justify-between mt-1" style={{ paddingLeft: PAD_X / 6, paddingRight: PAD_X / 6 }}>
          {data.map((d, i) => (
            <span key={i} className="text-[10px] font-bold text-white/35 text-center flex-1">
              {new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

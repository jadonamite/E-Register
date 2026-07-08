"use client";

/**
 * Overlapping initial circles — puts faces on a count. The ring color should
 * match the card fill so the circles bite into each other cleanly.
 */
export function AvatarStack({
  names,
  max = 5,
  ringColor,
  inkClass,
}: {
  names: string[];
  max?: number;
  ringColor: string;
  inkClass: string;
}) {
  if (names.length === 0) return null;
  const shown = names.slice(0, max);
  const rest = names.length - shown.length;

  return (
    <div className="flex items-center">
      {shown.map((name, i) => (
        <div
          key={`${name}-${i}`}
          className={`w-8 h-8 rounded-full bg-white flex items-center justify-center text-[11px] font-black ${inkClass} ${
            i > 0 ? "-ml-2.5" : ""
          }`}
          style={{ boxShadow: `0 0 0 3px ${ringColor}`, zIndex: shown.length - i }}
          title={name}
        >
          {name.trim().charAt(0).toUpperCase()}
        </div>
      ))}
      {rest > 0 && (
        <div
          className={`h-8 px-2.5 -ml-2.5 rounded-full bg-white/70 backdrop-blur flex items-center text-[10px] font-black ${inkClass}`}
          style={{ boxShadow: `0 0 0 3px ${ringColor}` }}
        >
          +{rest}
        </div>
      )}
    </div>
  );
}

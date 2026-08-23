// Which weekday each regular service is held on (0 = Sunday … 3 = Wednesday).
// Programs (e.g. Love Expression) are not listed → never day-constrained.
export const SERVICE_DAY: Record<string, number> = {
  Sunday: 0,
  "Mid-Week": 3, // Wednesday
};

/** The human weekday name a service must fall on ("Mid-Week" → "Wednesday"). */
export function serviceDayName(service: string): string {
  const day = SERVICE_DAY[service];
  if (day === undefined) return service;
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day];
}

/**
 * Client check — the picked date's local weekday must match the service. Nigeria
 * is UTC+1, and the date picker yields a calendar day, so local weekday is right.
 */
export function serviceMatchesDate(service: string, date: Date): boolean {
  const day = SERVICE_DAY[service];
  if (day === undefined) return true;
  return date.getDay() === day;
}

/** Server check — the ISO the client sends is a UTC-midnight calendar day, so
 *  compare against its UTC weekday to stay tz-agnostic on the server. */
export function serviceMatchesISO(service: string, iso: string): boolean {
  const day = SERVICE_DAY[service];
  if (day === undefined) return true;
  return new Date(iso).getUTCDay() === day;
}

/** Team codes that participate in Sunday service-session scheduling. FUTA TWO
 *  is a separate location that configures its own service independently, so
 *  it deliberately has no code here. */
export type SundayTeamCode = "PS" | "BG";

export interface ServiceWindow {
  team: SundayTeamCode | "ALL";
  start: string; // "HH:mm"
  end: string | null; // null = "until service ends"
}

export interface ServiceSessionTemplate {
  mode: "combined" | "separate";
  windows: ServiceWindow[];
}

// Default Sunday shape: Pace Setters run first, Boundless Grace second.
// A marker can override this per-Sunday when they initialize the service.
export const DEFAULT_SUNDAY_TEMPLATE: ServiceSessionTemplate = {
  mode: "separate",
  windows: [
    { team: "PS", start: "07:30", end: "09:45" },
    { team: "BG", start: "10:00", end: null },
  ],
};

export interface ResolvedServiceWindow extends ServiceWindow {
  teamName: string | null;
}

export interface SundaySession {
  mode: "combined" | "separate";
  windows: ResolvedServiceWindow[];
}

export type MemberWindowBadge =
  | { kind: "home"; window: ResolvedServiceWindow }
  | { kind: "crossover"; memberTeam: string };

/**
 * Which window a member is being marked against, for the badge in the roster.
 * Combined mode (or no session yet) → no badge needed, everyone's in one window.
 * Separate mode → match the member's team name against each active window's
 * resolved teamName; no match means their home team isn't running today (or
 * is outside PS/BG, e.g. FUTA TWO), so they're crossing over into whichever
 * window they actually showed up for, by the marker's choice — still
 * markable, just visually flagged rather than assigned a specific window.
 */
export function resolveMemberWindow(
  member: { team?: string | null },
  session: SundaySession | null
): MemberWindowBadge | null {
  if (!session || session.mode === "combined") return null;
  const memberTeam = (member.team || "").trim();
  if (!memberTeam) return null;

  const match = session.windows.find(
    (w) => (w.teamName || "").trim().toLowerCase() === memberTeam.toLowerCase()
  );
  if (match) return { kind: "home", window: match };
  return { kind: "crossover", memberTeam };
}

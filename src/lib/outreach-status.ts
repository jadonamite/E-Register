/**
 * Server-side mirror of the CallCenter outreach domain (lib/outreach.ts).
 * Status and next-follow-up are DERIVED from a contact's logs so history stays
 * the single source of truth. Kept byte-for-byte equivalent to the client so
 * both ends agree on what a pile of logs means.
 */

export type CallOutcome =
  | "answered"
  | "no_answer"
  | "switched_off"
  | "busy"
  | "wrong_number"
  | "messaged";

export type Disposition = "coming" | "not_coming" | "call_back_later";

export type ContactStatus =
  | "pending"
  | "attempted"
  | "reached"
  | "confirmed"
  | "attended"
  | "wrong_number"
  | "do_not_contact";

/** Minimal log shape the derivation needs (a subset of OutreachLog). */
export interface LogLike {
  at: string; // ISO
  outcome: CallOutcome;
  disposition?: Disposition | null;
  callBackAt?: string | null;
}

/** Which outcomes mean we actually reached the person. */
const REACHED: Record<CallOutcome, boolean> = {
  answered: true,
  messaged: true,
  no_answer: false,
  busy: false,
  switched_off: false,
  wrong_number: false,
};

/** Auto follow-up offsets in days, keyed by the outcome that triggers them. */
const FOLLOWUP_DAYS: Partial<Record<CallOutcome, number>> = {
  no_answer: 2,
  busy: 2,
  switched_off: 2,
  messaged: 3,
};

/** How many distinct failed-attempt days before a contact goes to the cold list. */
export const COLD_AFTER_DISTINCT_DAYS = 3;

/**
 * Derive a contact's pipeline status from its logs. `attended` overrides
 * everything; the two exits (do_not_contact, wrong_number) win over the funnel;
 * latest disposition wins for the coming/not-coming distinction.
 */
export function deriveStatus(
  logs: LogLike[],
  opts: { attended?: boolean; doNotContact?: boolean } = {}
): ContactStatus {
  if (opts.attended) return "attended";
  if (opts.doNotContact) return "do_not_contact";
  if (logs.some((l) => l.outcome === "wrong_number")) return "wrong_number";
  if (logs.length === 0) return "pending";

  let reached = false;
  let confirmed = false;
  for (const l of logs) {
    if (REACHED[l.outcome]) reached = true;
    if (l.disposition === "coming") confirmed = true;
  }

  const latestDisposed = [...logs]
    .filter((l) => l.disposition)
    .sort((a, b) => a.at.localeCompare(b.at))
    .at(-1);
  if (latestDisposed?.disposition === "coming") return "confirmed";
  if (confirmed && latestDisposed?.disposition !== "not_coming") return "confirmed";
  if (reached) return "reached";
  return "attempted";
}

/**
 * Next scheduled follow-up date, or null. call_back_later uses the caller-given
 * date; a coming/not_coming disposition closes the loop; otherwise the newest
 * failed/messaged attempt sets the offset.
 */
export function nextFollowUp(logs: LogLike[]): Date | null {
  if (logs.length === 0) return null;
  const latest = [...logs].sort((a, b) => a.at.localeCompare(b.at)).at(-1)!;

  if (latest.disposition === "coming" || latest.disposition === "not_coming") return null;
  if (latest.disposition === "call_back_later" && latest.callBackAt) {
    return new Date(latest.callBackAt);
  }
  const offset = FOLLOWUP_DAYS[latest.outcome];
  if (offset == null) return null;
  const base = new Date(latest.at);
  base.setDate(base.getDate() + offset);
  return base;
}

/** A contact is "cold" once it has failed attempts on N distinct days, never reached. */
export function isCold(logs: LogLike[]): boolean {
  if (logs.some((l) => REACHED[l.outcome])) return false;
  const days = new Set(logs.map((l) => l.at.slice(0, 10)));
  return days.size >= COLD_AFTER_DISTINCT_DAYS;
}

/** Whether a given outcome reached the person (mirror of CALL_OUTCOMES[..].reached). */
export function outcomeReached(outcome: CallOutcome): boolean {
  return REACHED[outcome] ?? false;
}

/**
 * Derive an event's status from its dates: ended once past eventEnd, live once
 * the campaign window has opened, otherwise upcoming. Never stored.
 */
export function eventStatus(
  e: { campaignStart: string; eventEnd: string },
  now: Date = new Date()
): "live" | "upcoming" | "ended" {
  if (now > new Date(e.eventEnd)) return "ended";
  const campaignStart = new Date(`${e.campaignStart}T00:00:00+01:00`);
  return now >= campaignStart ? "live" : "upcoming";
}

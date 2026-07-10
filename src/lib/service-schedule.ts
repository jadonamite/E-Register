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

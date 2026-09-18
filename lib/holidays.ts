/** Major holidays + birthday scheduling helpers (America/Chicago default). */

export type Occasion = {
  key: string;
  label: string;
  /** MM-DD for fixed holidays; null for computed */
  mmdd?: string;
};

export const FIXED_HOLIDAYS: Occasion[] = [
  { key: 'new_year', label: "New Year's Day", mmdd: '01-01' },
  { key: 'valentines', label: "Valentine's Day", mmdd: '02-14' },
  { key: 'womens_day', label: "International Women's Day", mmdd: '03-08' },
  { key: 'april_fools', label: "April Fools' Day", mmdd: '04-01' },
  { key: 'mothers_day_us', label: "Mother's Day (US approx 2nd Sunday May — fixed window May 11)", mmdd: '05-11' },
  { key: 'fathers_day_us', label: "Father's Day (US approx 3rd Sunday June — fixed window Jun 15)", mmdd: '06-15' },
  { key: 'halloween', label: 'Halloween', mmdd: '10-31' },
  { key: 'thanksgiving_us', label: 'Thanksgiving (US approx late Nov — fixed window Nov 27)', mmdd: '11-27' },
  { key: 'christmas_eve', label: 'Christmas Eve', mmdd: '12-24' },
  { key: 'christmas', label: 'Christmas', mmdd: '12-25' },
  { key: 'new_year_eve', label: "New Year's Eve", mmdd: '12-31' },
];

export function dateInTimezone(timeZone: string, now = new Date()): {
  y: number;
  m: number;
  d: number;
  isoDate: string;
} {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const isoDate = fmt.format(now); // YYYY-MM-DD
  const [y, m, d] = isoDate.split('-').map(Number);
  return { y, m, d, isoDate };
}

export function occasionsForDate(
  isoDate: string,
  birthday?: string | null
): { key: string; label: string }[] {
  const mmdd = isoDate.slice(5);
  const out: { key: string; label: string }[] = [];

  for (const h of FIXED_HOLIDAYS) {
    if (h.mmdd === mmdd) out.push({ key: h.key, label: h.label });
  }

  if (birthday) {
    const bMmdd = birthday.slice(5);
    if (bMmdd === mmdd) {
      out.push({ key: 'birthday', label: 'Birthday' });
    }
  }

  return out;
}

export function upcomingDates(daysAhead: number, timeZone: string, from = new Date()): string[] {
  const dates: string[] = [];
  for (let i = 0; i <= daysAhead; i++) {
    const d = new Date(from.getTime() + i * 24 * 60 * 60 * 1000);
    dates.push(dateInTimezone(timeZone, d).isoDate);
  }
  return [...new Set(dates)];
}

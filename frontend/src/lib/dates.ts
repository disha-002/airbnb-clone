// All dates are handled as local "YYYY-MM-DD" strings (matches the API, avoids timezone bugs).
export const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const parseISO = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const todayISO = () => iso(new Date());

export const nightsBetween = (a: string, b: string) =>
  Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86_400_000);

export const fmtShort = (s: string) =>
  parseISO(s).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export interface BookedRange { check_in: string; check_out: string }

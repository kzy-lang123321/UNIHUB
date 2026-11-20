export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00`);
  return (
    Number.isFinite(d.getTime()) &&
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` ===
      value
  );
}
export function makePlan(
  unitCount: number,
  completed: number[],
  exam: string,
  now = new Date(),
): { days: number; daily: number; remaining: number } {
  const target = new Date(`${exam}T00:00:00`);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = validDate(exam)
    ? Math.max(0, Math.round((target.getTime() - today.getTime()) / 86400000))
    : 0;
  const remaining = Math.max(
    0,
    unitCount - new Set(completed.filter((n) => n >= 1 && n <= unitCount)).size,
  );
  return { days, daily: Math.ceil(remaining / Math.max(1, days)), remaining };
}

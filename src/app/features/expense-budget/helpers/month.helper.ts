export function getPreviousMonth(month: number, year: number): { month: number; year: number } {
  if (month === 1) {
    return { month: 12, year: year - 1 };
  }
  return { month: month - 1, year };
}

export function getNextMonth(month: number, year: number): { month: number; year: number } {
  if (month === 12) {
    return { month: 1, year: year + 1 };
  }
  return { month: month + 1, year };
}

export function isCurrentMonth(month: number, year: number): boolean {
  const now = new Date();
  return month === now.getMonth() + 1 && year === now.getFullYear();
}

export function isFutureMonth(month: number, year: number): boolean {
  const now = new Date();
  const current = now.getFullYear() * 12 + now.getMonth();
  const target = year * 12 + (month - 1);
  return target > current;
}

export function formatMonthLabel(month: number, year: number): string {
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
}

export function formatShortMonth(month: number): string {
  const date = new Date(2000, month - 1, 1);
  return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
}

export function getMonthRange(months: number): { month: number; year: number }[] {
  const now = new Date();
  const result: { month: number; year: number }[] = [];
  let m = now.getMonth() + 1;
  let y = now.getFullYear();

  for (let i = 0; i < months; i++) {
    result.unshift({ month: m, year: y });
    const prev = getPreviousMonth(m, y);
    m = prev.month;
    y = prev.year;
  }

  return result;
}

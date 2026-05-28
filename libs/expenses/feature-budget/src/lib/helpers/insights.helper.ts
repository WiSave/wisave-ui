import type { ICategorySpendingSummary, IExpenseMonthlyStats, IInsight } from '@wisave/shared/model';

import { formatShortMonth } from './month.helper';

export function computeOverspendInsights(summaries: ICategorySpendingSummary[]): IInsight[] {
  return summaries
    .filter((s) => s.limit !== null && s.spent > s.limit)
    .map((s) => {
      const overPercent = Math.round(((s.spent - s.limit!) / s.limit!) * 100);
      return {
        type: 'overspend' as const,
        categoryId: s.categoryId,
        categoryName: s.categoryName,
        message: `${s.categoryName} was ${overPercent}% over budget`,
        severity: 'warning' as const,
        value: overPercent,
      };
    });
}

export function computeSavingsInsights(summaries: ICategorySpendingSummary[]): IInsight[] {
  return summaries
    .filter((s) => s.limit !== null && s.spent <= s.limit && (s.limit - s.spent) / s.limit > 0.2)
    .map((s) => {
      const saved = s.limit! - s.spent;
      const percent = Math.round((saved / s.limit!) * 100);
      return {
        type: 'savings' as const,
        categoryId: s.categoryId,
        categoryName: s.categoryName,
        message: `${s.categoryName} saved ${saved.toLocaleString('en-US', { minimumFractionDigits: 0 })} (${percent}% under budget)`,
        severity: 'positive' as const,
        value: saved,
      };
    });
}

export function computeTotalDeltaInsight(currentTotal: number, previousTotal: number, previousMonth: number): IInsight | null {
  if (previousTotal === 0) return null;

  const diff = currentTotal - previousTotal;
  const percent = Math.round(Math.abs((diff / previousTotal) * 100));
  const direction = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat';
  const monthLabel = formatShortMonth(previousMonth);

  if (direction === 'flat') return null;

  return {
    type: 'total_delta',
    message: `Overall spending ${direction === 'up' ? 'up' : 'down'} ${percent}% from ${monthLabel}`,
    severity: 'info',
    value: percent,
  };
}

export function computeConsecutiveTrendInsights(monthlyStats: IExpenseMonthlyStats[]): IInsight[] {
  if (monthlyStats.length < 3) return [];

  const sorted = [...monthlyStats].sort((a, b) => a.year * 12 + a.month - (b.year * 12 + b.month));
  const deltas = sorted.slice(1).map((s, i) => s.total - sorted[i].total);

  let streakDir: 'up' | 'down' | null = null;
  let streak = 1;

  for (let i = deltas.length - 1; i >= 1; i--) {
    const currDir = deltas[i] > 0 ? 'up' : deltas[i] < 0 ? 'down' : null;
    const prevDir = deltas[i - 1] > 0 ? 'up' : deltas[i - 1] < 0 ? 'down' : null;

    if (currDir && currDir === prevDir) {
      streak++;
      streakDir = currDir;
    } else {
      break;
    }
  }

  if (streak >= 3 && streakDir) {
    return [
      {
        type: 'consecutive_trend',
        message: `Overall spending has ${streakDir === 'up' ? 'increased' : 'decreased'} ${streak} months in a row`,
        severity: 'info',
        value: streak,
      },
    ];
  }

  return [];
}

export function computeAllInsights(
  currentSummaries: ICategorySpendingSummary[],
  currentTotal: number,
  previousTotal: number,
  previousMonth: number,
  monthlyStats: IExpenseMonthlyStats[],
): IInsight[] {
  const insights: IInsight[] = [
    ...computeOverspendInsights(currentSummaries),
    ...computeSavingsInsights(currentSummaries),
    ...computeConsecutiveTrendInsights(monthlyStats),
  ];

  const totalDelta = computeTotalDeltaInsight(currentTotal, previousTotal, previousMonth);
  if (totalDelta) insights.push(totalDelta);

  const severityOrder: Record<string, number> = { warning: 0, info: 1, positive: 2 };
  insights.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return insights;
}

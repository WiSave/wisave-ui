/**
 * Shared chart color configuration.
 * All Chart.js colors should reference these constants to stay in sync with the theme.
 */

export interface ChartThemeColors {
  text: string;
  textMuted: string;
  grid: string;
  barFill: string;
  barBorder: string;
}

export function getChartThemeColors(isDark: boolean): ChartThemeColors {
  return isDark
    ? {
        text: 'hsl(210, 15%, 92%)',
        textMuted: 'hsl(210, 12%, 58%)',
        grid: 'hsla(215, 20%, 50%, 0.12)',
        barFill: 'hsl(215, 45%, 52%)',
        barBorder: 'hsl(215, 45%, 44%)',
      }
    : {
        text: 'hsl(220, 30%, 14%)',
        textMuted: 'hsl(215, 14%, 46%)',
        grid: 'hsla(215, 15%, 50%, 0.10)',
        barFill: 'hsl(210, 50%, 52%)',
        barBorder: 'hsl(210, 50%, 45%)',
      };
}

export function getIncomeChartColors(isDark: boolean) {
  return isDark
    ? {
        recurring: 'hsl(215, 45%, 52%)',
        recurringBorder: 'hsl(215, 45%, 44%)',
        nonRecurring: 'hsl(215, 15%, 35%)',
        nonRecurringBorder: 'hsl(215, 15%, 28%)',
        average: 'hsl(38, 80%, 52%)',
      }
    : {
        recurring: 'hsl(210, 50%, 52%)',
        recurringBorder: 'hsl(210, 50%, 45%)',
        nonRecurring: 'hsl(213, 14%, 82%)',
        nonRecurringBorder: 'hsl(213, 14%, 72%)',
        average: 'hsl(36, 90%, 45%)',
      };
}

/** Category palette for doughnut / pie charts. */
export const CATEGORY_CHART_PALETTE = [
  'hsl(210, 50%, 58%)',
  'hsl(160, 50%, 55%)',
  'hsl(38, 85%, 58%)',
  'hsl(345, 55%, 58%)',
  'hsl(270, 45%, 60%)',
  'hsl(185, 50%, 50%)',
  'hsl(15, 65%, 58%)',
  'hsl(95, 45%, 55%)',
  'hsl(250, 50%, 62%)',
  'hsl(55, 65%, 55%)',
];

/** Tooltip styling shared across all charts. */
export const CHART_TOOLTIP_STYLE = {
  backgroundColor: 'hsl(220, 20%, 18%)',
  titleColor: 'hsl(210, 15%, 92%)',
  bodyColor: 'hsl(210, 15%, 80%)',
  borderColor: 'hsla(215, 20%, 50%, 0.2)',
  borderWidth: 1,
  padding: 10,
  cornerRadius: 8,
  bodyFont: { size: 12 },
} as const;

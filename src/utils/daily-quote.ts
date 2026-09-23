import dailyQuotes from '@/data/daily-quotes.json';

export type DailyQuote = {
  id: number;
  text: string;
  author: string | null;
};

const quotes = dailyQuotes as DailyQuote[];

/** Day of year 1–365 (or 366 in leap years). */
export function getDayOfYear(date: Date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/** Returns the quote for the given calendar day (stable for the whole day). */
export function getDailyQuote(date: Date = new Date()): DailyQuote {
  const dayOfYear = getDayOfYear(date);
  const index = (dayOfYear - 1 + quotes.length) % quotes.length;
  return quotes[index] ?? quotes[0];
}

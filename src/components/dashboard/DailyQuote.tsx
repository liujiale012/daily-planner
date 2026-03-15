import { getDailyQuote } from '../../lib/dailyQuote';
import { Quote } from 'lucide-react';

export function DailyQuote() {
  const quote = getDailyQuote();
  return (
    <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white px-4 py-3 dark:border-indigo-900/30 dark:from-indigo-950/30 dark:to-gray-800">
      <p className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
        <Quote
          className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500 dark:text-indigo-400"
          aria-hidden
        />
        <span className="italic">「{quote}」</span>
      </p>
    </div>
  );
}

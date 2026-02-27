import { cn } from "@/lib/utils";

/**
 * Semantic colored badge used across all pages.
 * Maps a "tone" to consistent colors for light & dark mode.
 */

const toneClasses: Record<string, string> = {
  success:  "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800",
  danger:   "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-400 dark:border-red-800",
  warning:  "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800",
  info:     "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/40 dark:text-sky-400 dark:border-sky-800",
  neutral:  "bg-muted text-muted-foreground border-border",
  purple:   "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/40 dark:text-violet-400 dark:border-violet-800",
};

export type StatusTone = keyof typeof toneClasses;

interface StatusBadgeProps {
  tone: StatusTone;
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({ tone, children, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        toneClasses[tone] ?? toneClasses.neutral,
        className,
      )}
    >
      {children}
    </span>
  );
}

import { cn } from "@/lib/utils"

export function LiveBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-bold uppercase tracking-widest text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-400",
        className
      )}
    >
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-500 opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-green-500" />
      </span>
      Live Updates
    </span>
  )
}

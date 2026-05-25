import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type StatusIndicator =
  | { type: "badge"; text: string; className?: string }
  | {
      type: "dot";
      color: "green" | "yellow" | "red" | "gray";
      label: string;
    };

export interface StatusCardProps {
  label: string;
  Icon?: LucideIcon;
  headerAction?: React.ReactNode;
  mainValue: React.ReactNode;
  statusIndicator?: StatusIndicator;
  footerLeft: string;
  footerRight: string;
  children?: React.ReactNode;
}

export function StatusCard({
  label,
  Icon,
  headerAction,
  mainValue,
  statusIndicator,
  footerLeft,
  footerRight,
  children,
}: StatusCardProps) {
  return (
    <Card className="gap-0 rounded-lg p-0">
      <CardHeader className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between">
          <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            {label}
          </span>
          {headerAction ??
            (Icon && <Icon className="size-4 text-muted-foreground" />)}
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-2 px-4 pb-0">
        {statusIndicator?.type === "badge" && (
          <Badge
            variant="secondary"
            className={cn(
              "w-fit rounded-sm font-mono text-[11px]",
              statusIndicator.className,
            )}
          >
            {statusIndicator.text}
          </Badge>
        )}
        {statusIndicator?.type === "dot" && (
          <div className="flex items-center gap-1.5">
            <span
              className={cn("size-2 rounded-full", {
                "bg-green-500": statusIndicator.color === "green",
                "bg-yellow-500": statusIndicator.color === "yellow",
                "bg-red-500": statusIndicator.color === "red",
                "bg-slate-400": statusIndicator.color === "gray",
              })}
            />
            <span
              className={cn("text-[11px] font-bold uppercase tracking-widest", {
                "text-green-700 dark:text-green-400":
                  statusIndicator.color === "green",
                "text-yellow-700 dark:text-yellow-400":
                  statusIndicator.color === "yellow",
                "text-red-700 dark:text-red-400":
                  statusIndicator.color === "red",
                "text-muted-foreground": statusIndicator.color === "gray",
              })}
            >
              {statusIndicator.label}
            </span>
          </div>
        )}

        {children ? (
          <div className="space-y-2">{children}</div>
        ) : (
          <p className="text-3xl font-bold tracking-tight text-foreground">
            {mainValue}
          </p>
        )}
      </CardContent>

      <div className="mt-auto flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
        <span>{footerLeft}</span>
        <span className="font-mono">{footerRight}</span>
      </div>
    </Card>
  );
}

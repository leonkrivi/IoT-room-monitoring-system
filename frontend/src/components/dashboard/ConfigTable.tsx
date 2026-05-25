import type { ConfigParamView, ParamStatus } from "@/hooks/useLiveConfig";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfigPresetPopover } from "./ConfigPresetPopover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_STYLES: Record<ParamStatus, string> = {
  applied:
    "rounded-sm bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  pending:
    "rounded-sm bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  rejected:
    "rounded-sm bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

interface ConfigTableProps {
  loading?: boolean;
  rows?: ConfigParamView[];
  onRequestChange?: (id: string, valueMs: number) => void;
}

export function ConfigTable({
  loading = false,
  rows = [],
  onRequestChange,
}: ConfigTableProps) {
  return (
    <>
      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-base font-semibold text-foreground">
            Device Configuration
          </h2>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Parameter
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Value
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Requested Value
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Last Updated
              </TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? [0, 1, 2].map((i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-36" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16 rounded-sm" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="ml-auto h-8 w-14 rounded-md" />
                    </TableCell>
                  </TableRow>
                ))
              : rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium text-foreground">
                      {row.parameter}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {row.value}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {row.requestedValue}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "text-[11px] font-bold uppercase tracking-widest",
                          STATUS_STYLES[row.status],
                        )}
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.lastUpdated}
                    </TableCell>
                    <TableCell className="text-right">
                      <ConfigPresetPopover
                        paramId={row.id}
                        onSelect={(ms) => onRequestChange?.(row.id, ms)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </section>
    </>
  );
}

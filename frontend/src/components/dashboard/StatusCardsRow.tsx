import {
  DoorOpenIcon,
  ThermometerIcon,
  NetworkIcon,
  RefreshCwIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusCard } from "@/components/dashboard/StatusCard";

interface StatusCardsRowProps {
  loading?: boolean;
  onForceCheck?: () => void;
}

export function StatusCardsRow({
  loading = false,
  onForceCheck,
}: StatusCardsRowProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="overflow-hidden rounded-lg border border-border bg-card p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="size-5 rounded-md" />
            </div>
            <Skeleton className="mb-3 h-7 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* Room State */}
      <StatusCard
        label="Room State"
        Icon={DoorOpenIcon}
        mainValue="In Use"
        statusIndicator={{
          type: "badge",
          text: "OCCUPIED_ACTIVE",
          className: "bg-primary text-primary-foreground",
        }}
        footerLeft="Last update"
        footerRight="2026-05-27 12:00:30"
      />

      {/* Sensor Status */}
      <StatusCard
        label="Sensor status"
        Icon={ThermometerIcon}
        mainValue="Alive"
        statusIndicator={{ type: "dot", color: "green", label: "OK" }}
        footerLeft="Last seen"
        action={
          <Button
            variant="ghost"
            size="xs"
            className="h-auto gap-1 px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={onForceCheck}
          >
            <RefreshCwIcon className="size-3" />
            Force check
          </Button>
        }
      />

      {/* Connection State */}
      <StatusCard
        label="Connection State"
        Icon={NetworkIcon}
        mainValue={null}
        footerLeft="Heartbeat"
        footerRight="2 seconds ago"
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">WebSocket</span>
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-green-700 dark:text-green-400">
              <span className="size-1.5 rounded-full bg-green-500" />
              Connected
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Device Status</span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-foreground">
              Online
            </span>
          </div>
        </div>
      </StatusCard>
    </div>
  );
}

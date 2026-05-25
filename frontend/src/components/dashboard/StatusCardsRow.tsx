import {
  DoorOpenIcon,
  ThermometerIcon,
  NetworkIcon,
  RefreshCwIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusCard } from "@/components/dashboard/StatusCard";
import type { IndicatorColor, LiveStatusView } from "@/hooks/useLiveStatus";

interface StatusCardsRowProps {
  loading?: boolean;
  onForceCheck?: () => void;
  liveStatus?: LiveStatusView;
}

const DEFAULT_LIVE_STATUS: LiveStatusView = {
  roomState: {
    label: "Unknown",
    badgeText: "UNKNOWN",
    badgeClass: "bg-muted text-muted-foreground",
    lastUpdate: "Unknown",
  },
  sensor: {
    label: "Unknown",
    indicatorColor: "gray",
    indicatorLabel: "Unknown",
    lastSeen: "Unknown",
  },
  connection: {
    ws: { label: "Disconnected", color: "gray" },
    device: { label: "Unknown", color: "gray" },
    heartbeat: "Unknown",
  },
};

function getToneClasses(color: IndicatorColor) {
  return {
    dot: cn("size-1.5 rounded-full", {
      "bg-green-500": color === "green",
      "bg-yellow-500": color === "yellow",
      "bg-red-500": color === "red",
      "bg-slate-400": color === "gray",
    }),
    text: cn("text-[11px] font-bold uppercase tracking-widest", {
      "text-green-700 dark:text-green-400": color === "green",
      "text-yellow-700 dark:text-yellow-400": color === "yellow",
      "text-red-700 dark:text-red-400": color === "red",
      "text-muted-foreground": color === "gray",
    }),
  };
}

export function StatusCardsRow({
  loading = false,
  onForceCheck,
  liveStatus,
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

  const status = liveStatus ?? DEFAULT_LIVE_STATUS;
  const wsTone = getToneClasses(status.connection.ws.color);
  const deviceTone = getToneClasses(status.connection.device.color);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* Room State */}
      <StatusCard
        label="Room State"
        Icon={DoorOpenIcon}
        mainValue={status.roomState.label}
        statusIndicator={{
          type: "badge",
          text: status.roomState.badgeText,
          className: status.roomState.badgeClass,
        }}
        footerLeft="Last update"
        footerRight={status.roomState.lastUpdate}
      />

      {/* Sensor Status */}
      <StatusCard
        label="Sensor status"
        Icon={ThermometerIcon}
        mainValue={status.sensor.label}
        statusIndicator={{
          type: "dot",
          color: status.sensor.indicatorColor,
          label: status.sensor.indicatorLabel,
        }}
        footerLeft="Last seen"
        footerRight={status.sensor.lastSeen}
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
        footerRight={status.connection.heartbeat}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">WebSocket</span>
            <span className={cn("flex items-center gap-1.5", wsTone.text)}>
              <span className={wsTone.dot} />
              {status.connection.ws.label}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Device Status</span>
            <span className={deviceTone.text}>
              {status.connection.device.label}
            </span>
          </div>
        </div>
      </StatusCard>
    </div>
  );
}

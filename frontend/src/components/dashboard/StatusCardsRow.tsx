import { Skeleton } from "@/components/ui/skeleton";
import { RoomStateCard } from "@/components/dashboard/cards/RoomStateCard";
import { SensorStatusCard } from "@/components/dashboard/cards/SensorStatusCard";
import { ConnectionStateCard } from "@/components/dashboard/cards/ConnectionStateCard";
import type { LiveStatusView } from "@/hooks/useLiveStatus";

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
    lastHeartbeat: "Unknown",
  },
  connection: {
    ws: { label: "Disconnected", color: "gray" },
    device: { label: "Unknown", color: "gray" },
    lastUpdate: "Unknown",
  },
};

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

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <RoomStateCard roomState={status.roomState} />
      <SensorStatusCard sensor={status.sensor} onForceCheck={onForceCheck} />
      <ConnectionStateCard connection={status.connection} />
    </div>
  );
}

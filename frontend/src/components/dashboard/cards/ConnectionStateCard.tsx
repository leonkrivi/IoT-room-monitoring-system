import { NetworkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusCard } from "@/components/dashboard/cards/statusCardLayout";
import type { IndicatorColor, LiveStatusView } from "@/types/LiveStatus";

interface ConnectionStateCardProps {
  connection: LiveStatusView["connection"];
}

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

export function ConnectionStateCard({ connection }: ConnectionStateCardProps) {
  const wsTone = getToneClasses(connection.ws.color);
  const deviceTone = getToneClasses(connection.device.color);

  return (
    <StatusCard
      label="Connection State"
      Icon={NetworkIcon}
      mainValue={null}
      footerLeft="Last update"
      footerRight={connection.lastUpdate}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground">WebSocket</span>
          <span className={cn("flex items-center gap-1.5", wsTone.text)}>
            <span className={wsTone.dot} />
            {connection.ws.label}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground">Device Status</span>
          <span className={deviceTone.text}>{connection.device.label}</span>
        </div>
      </div>
    </StatusCard>
  );
}

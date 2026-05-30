import { RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusCard } from "@/components/dashboard/cards/statusCardLayout";
import type { LiveStatusView } from "@/types/LiveStatus";

interface SensorStatusCardProps {
  sensor: LiveStatusView["sensor"];
  onForceCheck?: () => void;
}

export function SensorStatusCard({
  sensor,
  onForceCheck,
}: SensorStatusCardProps) {
  return (
    <StatusCard
      label="Sensor status"
      headerAction={
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
      mainValue={sensor.label}
      statusIndicator={{
        type: "dot",
        color: sensor.indicatorColor,
        label: sensor.indicatorLabel,
      }}
      footerLeft="Last seen"
      footerRight={sensor.lastHeartbeat}
    />
  );
}

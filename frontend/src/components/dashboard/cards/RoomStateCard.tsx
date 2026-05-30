import { DoorOpenIcon } from "lucide-react";
import { StatusCard } from "@/components/dashboard/cards/statusCardLayout";
import type { LiveStatusView } from "@/types/LiveStatus";

interface RoomStateCardProps {
  roomState: LiveStatusView["roomState"];
}

export function RoomStateCard({ roomState }: RoomStateCardProps) {
  return (
    <StatusCard
      label="Room State"
      Icon={DoorOpenIcon}
      mainValue={roomState.label}
      statusIndicator={{
        type: "badge",
        text: roomState.badgeText,
        className: roomState.badgeClass,
      }}
      footerLeft="Last update"
      footerRight={roomState.lastUpdate}
    />
  );
}

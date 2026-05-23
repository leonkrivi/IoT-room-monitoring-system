import { RouterIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { IdPair } from "@/types/IdPair";

interface DeviceSelectorProps {
  devices: IdPair[];
  selected: IdPair | null;
  onSelectionChange: (value: IdPair) => void;
}

export function DeviceSelector({
  devices,
  selected,
  onSelectionChange,
}: DeviceSelectorProps) {
  const selectedKey = selected
    ? `${selected.roomId}::${selected.deviceId}`
    : "";

  function handleChange(key: string) {
    const pair = devices.find((d) => `${d.roomId}::${d.deviceId}` === key);
    if (pair) onSelectionChange(pair);
  }

  return (
    <Select value={selectedKey} onValueChange={handleChange}>
      <SelectTrigger className="hidden md:flex h-9 gap-2 rounded-lg border-border bg-muted/40 px-3 text-sm">
        <RouterIcon className="size-4 shrink-0 text-foreground" />
        <SelectValue placeholder="Select device" />
      </SelectTrigger>
      <SelectContent>
        {devices.map((d) => {
          const key = `${d.roomId}::${d.deviceId}`;
          return (
            <SelectItem key={key} value={key}>
              Room {d.roomId} / Device {d.deviceId}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

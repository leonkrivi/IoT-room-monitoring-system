import { PencilIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Must match backend ALLOWED_HB_INTERVAL_MS and ALLOWED_SENSOR_RATE_MS in constants.js
// TODO: fetch from backend (e.g. GET /devices/config-presets) to avoid duplication
const PRESET_VALUES: Record<string, number[]> = {
  "hb-interval": [5000, 10000, 15000, 30000, 60000],
  "sensor-rate": [500, 1000, 2000, 5000, 10000],
};

interface ConfigPresetPopoverProps {
  paramId: string;
  onSelect: (valueMs: number) => void;
}

export function ConfigPresetPopover({
  paramId,
  onSelect,
}: ConfigPresetPopoverProps) {
  const presets = PRESET_VALUES[paramId] ?? [];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary" size="default">
          <PencilIcon className="size-3.5" />
          edit
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 p-2">
        <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Set value
        </p>
        <div className="flex flex-col gap-1">
          {presets.map((ms) => (
            <button
              key={ms}
              className="rounded px-3 py-1.5 text-left font-mono text-sm hover:bg-muted"
              onClick={() => onSelect(ms)}
            >
              {ms}ms
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

import { useEffect, useState } from "react";
import { PencilIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { api } from "@/lib/api";

function formatMsLabel(value: number) {
  return `${value}ms`;
}

interface ConfigPresetPopoverProps {
  paramId: string;
  onSelect: (valueMs: number) => void;
}

export function ConfigPresetPopover({
  paramId,
  onSelect,
}: ConfigPresetPopoverProps) {
  const [configPresets, setConfigPresets] = useState({
    hbIntervalMs: [] as number[],
    sensorRateMs: [] as number[],
  });

  useEffect(() => {
    let active = true;
    api.presets
      .get()
      .then(({ configPresets }) => {
        if (active) setConfigPresets(configPresets);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const presets =
    paramId === "hb-interval"
      ? configPresets.hbIntervalMs
      : paramId === "sensor-rate"
        ? configPresets.sensorRateMs
        : [];

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
          {presets.map((value) => (
            <button
              key={value}
              className="rounded px-3 py-1.5 text-left font-mono text-sm hover:bg-muted"
              onClick={() => onSelect(value)}
            >
              {formatMsLabel(value)}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

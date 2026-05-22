import { RouterIcon } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const DEVICES = [
  { id: "lr-01", label: "Living Room — LR-01" },
  { id: "br-01", label: "Bedroom — BR-01" },
  { id: "kt-01", label: "Kitchen — KT-01" },
]

interface DeviceSelectorProps {
  value?: string
  onValueChange?: (value: string) => void
}

export function DeviceSelector({ value = "lr-01", onValueChange }: DeviceSelectorProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="hidden md:flex h-9 gap-2 rounded-lg border-border bg-muted/40 px-3 text-sm">
        <RouterIcon className="size-4 shrink-0 text-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {DEVICES.map((d) => (
          <SelectItem key={d.id} value={d.id}>
            {d.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

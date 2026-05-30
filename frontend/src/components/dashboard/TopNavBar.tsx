import { RefreshCwIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DeviceSelector } from "@/components/dashboard/DeviceSelector";
import type { IdPair } from "@/types/IdPair";

interface TopNavBarProps {
  title?: string;
  devices: IdPair[];
  selected: IdPair | null;
  onSelectionChange: (value: IdPair) => void;
  onRefreshDevices: () => void;
  refreshingDevices?: boolean;
  loggingOut: boolean;
  onLogout: () => void;
}

export function TopNavBar({
  title = "IoT Room Monitoring System",
  devices,
  selected,
  onSelectionChange,
  onRefreshDevices,
  refreshingDevices = false,
  loggingOut,
  onLogout,
}: TopNavBarProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-3 items-center px-6">
        <span className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </span>

        <div className="flex items-center justify-center gap-2">
          <DeviceSelector
            devices={devices}
            selected={selected}
            onSelectionChange={onSelectionChange}
          />
          <button
            className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
            onClick={onRefreshDevices}
            disabled={refreshingDevices}
            title="Refresh device list"
          >
            {refreshingDevices ? (
              <Spinner className="size-4" />
            ) : (
              <RefreshCwIcon className="size-4" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-end gap-4">
          <button
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            onClick={onLogout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <span className="flex items-center gap-1.5">
                <Spinner className="size-4" />
                Signing out…
              </span>
            ) : (
              "Logout"
            )}
          </button>
          <Avatar size="default">
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}

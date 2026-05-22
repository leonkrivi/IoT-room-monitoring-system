import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DeviceSelector } from "@/components/dashboard/DeviceSelector";

interface TopNavBarProps {
  title?: string;
  device: string;
  onDeviceChange: (value: string) => void;
  loggingOut: boolean;
  onLogout: () => void;
}

export function TopNavBar({
  title = "IoT Room Monitoring System",
  device,
  onDeviceChange,
  loggingOut,
  onLogout,
}: TopNavBarProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-3 items-center px-6">
        <span className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </span>

        <div className="flex justify-center">
          <DeviceSelector value={device} onValueChange={onDeviceChange} />
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

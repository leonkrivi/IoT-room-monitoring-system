import { RouterIcon } from "lucide-react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";

interface NoDevicesEmptyProps {
  refreshing: boolean;
  onRefresh: () => void;
}

export function NoDevicesEmpty({ refreshing, onRefresh }: NoDevicesEmptyProps) {
  return (
    <Empty className="border border-dashed border-border bg-card/30">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <RouterIcon className="size-5" />
        </EmptyMedia>
        <EmptyTitle>No devices yet</EmptyTitle>
        <EmptyDescription>
          Waiting for device events. The first device will be selected
          automatically.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing devices..." : "Refresh device list"}
        </Button>
      </EmptyContent>
    </Empty>
  );
}

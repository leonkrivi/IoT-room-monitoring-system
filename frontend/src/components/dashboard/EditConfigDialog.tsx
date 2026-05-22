import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export interface ConfigRow {
  id: string;
  parameter: string;
  value: string;
}

interface EditConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: ConfigRow | null;
}

export function EditConfigDialog({
  open,
  onOpenChange,
  row,
}: EditConfigDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-lg">
        <DialogHeader>
          <DialogTitle>Update Configuration</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Parameter
            </Label>
            <Input
              readOnly
              value={row?.parameter ?? ""}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Value
            </Label>
            <Input
              defaultValue={row?.value ?? ""}
              className="font-mono text-sm"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button className="flex-1">Save Changes</Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

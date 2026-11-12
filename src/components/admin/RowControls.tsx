import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useReorder, useSaveRecord, type ContentTable } from "@/lib/cms/admin";
import { friendlyError } from "@/lib/cms/errors";
import { computeReorder } from "@/lib/cms/utils";

type Orderable = { id: string; sort_order: number };

/** Move a row up/down within the saved display order. */
// eslint-disable-next-line react-refresh/only-export-components
export function useReorderHandler(table: ContentTable, orderedRows: Orderable[]) {
  const reorder = useReorder(table);
  const move = (id: string, direction: "up" | "down") => {
    const index = orderedRows.findIndex((r) => r.id === id);
    const updates = computeReorder(orderedRows, index, direction);
    if (!updates.length) return;
    reorder.mutate(updates, {
      onError: (err) => toast.error(friendlyError(err, "Couldn't change the order.")),
    });
  };
  return { move, pending: reorder.isPending };
}

export function ReorderButtons({
  id,
  index,
  count,
  enabled,
  pending,
  onMove,
}: {
  id: string;
  index: number;
  count: number;
  enabled: boolean;
  pending: boolean;
  onMove: (id: string, dir: "up" | "down") => void;
}) {
  if (!enabled) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-xs text-muted-foreground tabular-nums cursor-help">#{index + 1}</span>
        </TooltipTrigger>
        <TooltipContent>Clear search/filters and sort by Order to rearrange</TooltipContent>
      </Tooltip>
    );
  }
  return (
    <div className="flex items-center gap-0.5">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        aria-label="Move up"
        disabled={pending || index === 0}
        onClick={(e) => {
          e.stopPropagation();
          onMove(id, "up");
        }}
      >
        <ArrowUp className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        aria-label="Move down"
        disabled={pending || index === count - 1}
        onClick={(e) => {
          e.stopPropagation();
          onMove(id, "down");
        }}
      >
        <ArrowDown className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

/** Inline Published/Draft toggle that saves immediately. */
export function PublishToggle({ table, id, published, label }: { table: ContentTable; id: string; published: boolean; label: string }) {
  const save = useSaveRecord(table);
  const value = save.isPending ? !published : published;
  return (
    <Switch
      checked={value}
      disabled={save.isPending}
      aria-label={`${published ? "Unpublish" : "Publish"} ${label}`}
      onClick={(e) => e.stopPropagation()}
      onCheckedChange={(checked) =>
        save.mutate(
          { id, values: { published: checked } },
          {
            onSuccess: () => toast.success(checked ? `"${label}" is now published` : `"${label}" moved to drafts`),
            onError: (err) => toast.error(friendlyError(err, "Couldn't change the status.")),
          },
        )
      }
    />
  );
}

export function RowActions({ label, onEdit, onDelete }: { label: string; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        aria-label={`Edit ${label}`}
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        aria-label={`Delete ${label}`}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

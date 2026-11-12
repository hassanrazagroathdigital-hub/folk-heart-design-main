import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "./ConfirmDialog";
import { Spinner } from "./ui";

interface EditorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  dirty: boolean;
  saving: boolean;
  /** Disable save while e.g. an image upload is in progress. */
  busy?: boolean;
  submitLabel?: string;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
}

/**
 * Side panel for create/edit forms. Asks before discarding unsaved changes
 * (closing the panel, pressing Esc, or leaving the page).
 */
export function EditorSheet({
  open,
  onOpenChange,
  title,
  description,
  dirty,
  saving,
  busy = false,
  submitLabel = "Save",
  onSubmit,
  children,
}: EditorSheetProps) {
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  useEffect(() => {
    if (!open || !dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [open, dirty]);

  const requestClose = () => {
    if (saving) return;
    if (dirty) setConfirmDiscard(true);
    else onOpenChange(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => (o ? onOpenChange(true) : requestClose())}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col gap-0">
          <SheetHeader className="px-6 py-5 border-b text-left">
            <SheetTitle className="font-body text-lg">{title}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
          <form onSubmit={onSubmit} className="flex flex-1 flex-col min-h-0" noValidate>
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">{children}</div>
            <div className="border-t px-6 py-4 flex items-center justify-between gap-3 bg-muted/40">
              <span className="text-xs text-muted-foreground">{dirty ? "Unsaved changes" : " "}</span>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={requestClose} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving || busy}>
                  {saving && <Spinner className="mr-2" />}
                  {submitLabel}
                </Button>
              </div>
            </div>
          </form>
        </SheetContent>
      </Sheet>
      <ConfirmDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title="Discard unsaved changes?"
        description="You have changes that haven't been saved. If you close now they'll be lost."
        confirmLabel="Discard changes"
        onConfirm={() => {
          setConfirmDiscard(false);
          onOpenChange(false);
        }}
      />
    </>
  );
}

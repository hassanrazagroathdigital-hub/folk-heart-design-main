import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DownloadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ConfirmDialog } from "./ConfirmDialog";
import { Panel } from "./ui";
import { friendlyError } from "@/lib/cms/errors";
import { runSeed, type SeedProgress } from "@/lib/cms/seed";
import { DEFAULT_CATEGORIES, DEFAULT_FAQS, DEFAULT_PRODUCTS } from "@/lib/cms/defaults";

/** Non-destructive import of the site's original content (see lib/cms/seed.ts). */
export function StarterContentImport({ variant, onFinished }: { variant: "empty" | "maintenance"; onFinished?: () => void }) {
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const [progress, setProgress] = useState<SeedProgress | null>(null);

  const start = async () => {
    setConfirm(false);
    setProgress({ done: 0, total: 1, label: "Checking existing content…" });
    try {
      const report = await runSeed(setProgress);
      const added = report.categories + report.products + report.faqs;
      if (report.errors.length) {
        toast.warning(`Imported ${added} items; ${report.errors.length} failed. Run the import again to retry them.`, {
          description: report.errors.slice(0, 3).join(" · "),
          duration: 10000,
        });
      } else if (added === 0) {
        toast.info("Nothing to import — all starter content already exists.");
      } else {
        toast.success(`Imported ${report.categories} collections, ${report.products} products and ${report.faqs} FAQs.`);
      }
    } catch (err) {
      toast.error(friendlyError(err, "The import couldn't be completed."));
    } finally {
      setProgress(null);
      await qc.invalidateQueries();
      onFinished?.();
    }
  };

  return (
    <Panel className="p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">
            {variant === "empty" ? "Your database is empty" : "Import missing starter content"}
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            {variant === "empty"
              ? "The website is currently showing its original built-in content. Import it to start editing it here: "
              : "Re-adds any of the website's original items that aren't in the database: "}
            {DEFAULT_CATEGORIES.length} collections, {DEFAULT_PRODUCTS.length} products and {DEFAULT_FAQS.length} FAQs,
            with photos copied to the media library. Existing items are never changed or deleted.
          </p>
        </div>
        <Button onClick={() => setConfirm(true)} disabled={!!progress} className="shrink-0" variant={variant === "empty" ? "default" : "outline"}>
          <DownloadCloud className="mr-2 h-4 w-4" />
          Import starter content
        </Button>
      </div>
      {progress && (
        <div className="mt-5 space-y-2" role="status" aria-live="polite">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="truncate">{progress.label}</span>
            <span className="tabular-nums">
              {progress.done}/{progress.total}
            </span>
          </div>
          <Progress value={(progress.done / Math.max(1, progress.total)) * 100} className="h-1.5" />
          <p className="text-xs text-muted-foreground">Keep this tab open until the import finishes.</p>
        </div>
      )}
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Import starter content?"
        destructive={false}
        confirmLabel="Start import"
        onConfirm={start}
        description={
          <>
            <p>
              This copies the website's original collections, products and FAQs into your database and uploads their
              photos to the media library. It can take a few minutes.
            </p>
            <p>
              Only items that don't exist yet are added (matched by URL slug, or question text for FAQs). Nothing is
              deleted or overwritten. Items you deleted on purpose will come back, so you may want to unpublish rather
              than delete things you don't need.
            </p>
          </>
        }
      />
    </Panel>
  );
}

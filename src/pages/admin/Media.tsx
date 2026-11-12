import { useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Image as ImageIcon, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { EmptyState, ErrorState, PageHeader, Panel, Pill } from "@/components/admin/ui";
import { adminKeys, fetchMediaUsage, useMediaFiles, useMediaUsage } from "@/lib/cms/admin";
import { friendlyError } from "@/lib/cms/errors";
import {
  ALLOWED_IMAGE_TYPES,
  deleteMedia,
  formatBytes,
  MEDIA_FOLDERS,
  UploadError,
  uploadImage,
  validateImageFile,
  type MediaFile,
} from "@/lib/cms/storage";
import { formatDate } from "@/lib/cms/utils";

type UsageFilter = "all" | "used" | "unused";

export default function Media() {
  const files = useMediaFiles();
  const usage = useMediaUsage();
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [folder, setFolder] = useState<string>("all");
  const [usageFilter, setUsageFilter] = useState<UsageFilter>("all");
  const [deleting, setDeleting] = useState<MediaFile[] | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const usageMap = useMemo(() => usage.data ?? {}, [usage.data]);
  const usageReady = !!usage.data;

  const visible = useMemo(
    () =>
      (files.data ?? []).filter(
        (f) =>
          (folder === "all" || f.folder === folder) &&
          (usageFilter === "all" || !usageReady || (usageFilter === "used") === !!usageMap[f.path]?.length),
      ),
    [files.data, folder, usageFilter, usageMap, usageReady],
  );
  const unused = useMemo(() => (files.data ?? []).filter((f) => usageReady && !usageMap[f.path]?.length), [files.data, usageMap, usageReady]);
  const totalSize = (files.data ?? []).reduce((s, f) => s + f.size, 0);

  const refresh = () =>
    Promise.all([qc.invalidateQueries({ queryKey: adminKeys.media }), qc.invalidateQueries({ queryKey: adminKeys.mediaUsage })]);

  const onUpload = async (list: FileList | null) => {
    if (!list?.length) return;
    const valid = Array.from(list).filter((f) => {
      const problem = validateImageFile(f);
      if (problem) toast.error(problem);
      return !problem;
    });
    if (!valid.length) return;
    setProgress(0);
    let ok = 0;
    for (let i = 0; i < valid.length; i++) {
      try {
        await uploadImage(valid[i], "uploads", (p) => setProgress((i + p) / valid.length));
        ok++;
      } catch (err) {
        toast.error(err instanceof UploadError ? err.message : friendlyError(err, `Couldn't upload "${valid[i].name}".`));
      }
    }
    setProgress(null);
    if (ok) toast.success(`${ok} image${ok === 1 ? "" : "s"} uploaded`);
    await refresh();
  };

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied((c) => (c === url ? null : c)), 1500);
    } catch {
      toast.error("Couldn't copy to clipboard.");
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeletePending(true);
    try {
      // Re-check usage right before deleting, in case content changed meanwhile.
      const fresh = await qc.fetchQuery({ queryKey: adminKeys.mediaUsage, queryFn: fetchMediaUsage, staleTime: 0 });
      const safe = deleting.filter((f) => !fresh[f.path]?.length);
      const blocked = deleting.length - safe.length;
      await deleteMedia(safe.map((f) => f.path));
      if (safe.length) toast.success(`Deleted ${safe.length} file${safe.length === 1 ? "" : "s"}`);
      if (blocked) toast.warning(`${blocked} file${blocked === 1 ? " is" : "s are"} now in use and ${blocked === 1 ? "was" : "were"} kept.`);
      setDeleting(null);
    } catch (err) {
      toast.error(friendlyError(err, "Couldn't delete the file(s)."));
    } finally {
      setDeletePending(false);
      await refresh();
    }
  };

  return (
    <>
      <PageHeader
        title="Media Library"
        description="All images stored for the website. Files that are in use can't be deleted until nothing references them."
        actions={
          <>
            {unused.length > 0 && (
              <Button variant="outline" onClick={() => setDeleting(unused)}>
                <Trash2 className="mr-1.5 h-4 w-4" /> Clean up {unused.length} unused
              </Button>
            )}
            <Button onClick={() => inputRef.current?.click()} disabled={progress !== null}>
              <Upload className="mr-1.5 h-4 w-4" /> Upload images
            </Button>
          </>
        }
      />
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(",")}
        multiple
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          void onUpload(e.target.files);
          e.target.value = "";
        }}
      />

      {progress !== null && (
        <Panel className="mb-4 p-4">
          <div className="mb-2 text-sm">Uploading… {Math.round(progress * 100)}%</div>
          <Progress value={progress * 100} className="h-1.5" />
        </Panel>
      )}

      {files.error ? (
        <ErrorState message={friendlyError(files.error)} onRetry={() => void files.refetch()} />
      ) : (
        <Panel>
          <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <Select value={folder} onValueChange={setFolder}>
                <SelectTrigger className="h-9 w-[150px]" aria-label="Filter by folder">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All folders</SelectItem>
                  {MEDIA_FOLDERS.map((f) => (
                    <SelectItem key={f} value={f} className="capitalize">
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={usageFilter} onValueChange={(v) => setUsageFilter(v as UsageFilter)}>
                <SelectTrigger className="h-9 w-[140px]" aria-label="Filter by usage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any usage</SelectItem>
                  <SelectItem value="used">In use</SelectItem>
                  <SelectItem value="unused">Unused</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {files.data && (
              <span className="text-xs text-muted-foreground">
                {files.data.length} files · {formatBytes(totalSize)}
              </span>
            )}
          </div>

          {files.isLoading ? (
            <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : (files.data ?? []).length === 0 ? (
            <EmptyState
              icon={ImageIcon}
              title="No images yet"
              description="Images you upload for products, collections and settings will be stored here."
              action={
                <Button onClick={() => inputRef.current?.click()}>
                  <Upload className="mr-1.5 h-4 w-4" /> Upload images
                </Button>
              }
            />
          ) : visible.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">No files match these filters.</div>
          ) : (
            <ul className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-4">
              {visible.map((f) => {
                const usedBy = usageMap[f.path] ?? [];
                const inUse = usedBy.length > 0;
                return (
                  <li key={f.path} className="overflow-hidden rounded-lg border bg-card">
                    <a href={f.url} target="_blank" rel="noopener noreferrer" className="block aspect-square bg-muted">
                      <img src={f.url} alt={f.name} loading="lazy" className="h-full w-full object-cover" />
                    </a>
                    <div className="space-y-2 p-3">
                      <p className="truncate text-xs font-medium" title={f.name}>
                        {f.name}
                      </p>
                      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                        <span>{formatBytes(f.size)}</span>
                        <span>{formatDate(f.created_at)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        {!usageReady ? (
                          <Skeleton className="h-5 w-14" />
                        ) : inUse ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span tabIndex={0} className="cursor-help">
                                <Pill tone="green">In use</Pill>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <ul className="text-xs space-y-0.5">
                                {usedBy.slice(0, 6).map((u) => (
                                  <li key={u}>{u}</li>
                                ))}
                                {usedBy.length > 6 && <li>+{usedBy.length - 6} more</li>}
                              </ul>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Pill>Unused</Pill>
                        )}
                        <div className="flex">
                          <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Copy URL of ${f.name}`} onClick={() => void copy(f.url)}>
                            {copied === f.url ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            aria-label={`Delete ${f.name}`}
                            disabled={!usageReady || inUse}
                            title={inUse ? "In use — remove it from content first" : undefined}
                            onClick={() => setDeleting([f])}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={deleting && deleting.length > 1 ? `Delete ${deleting.length} unused files?` : "Delete this file?"}
        loading={deletePending}
        description={
          <>
            {deleting?.length === 1 ? (
              <p>
                <strong className="text-foreground break-all">{deleting[0].name}</strong> will be permanently deleted from storage.
              </p>
            ) : (
              <p>These files aren't used by any product, collection or setting and will be permanently deleted from storage.</p>
            )}
            <p>Usage is checked again right before deleting; anything that's in use is kept.</p>
          </>
        }
        onConfirm={confirmDelete}
      />
    </>
  );
}

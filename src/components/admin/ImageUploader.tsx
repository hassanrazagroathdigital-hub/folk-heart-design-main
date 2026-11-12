import { useId, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, RefreshCw, Star, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ALLOWED_IMAGE_TYPES, UploadError, uploadImage, validateImageFile, type MediaFolder } from "@/lib/cms/storage";
import { friendlyError } from "@/lib/cms/errors";

const ACCEPT = ALLOWED_IMAGE_TYPES.join(",");

function useUploader(folder: MediaFolder, onBusyChange?: (busy: boolean) => void) {
  const [progress, setProgress] = useState<number | null>(null);
  const upload = async (files: File[]): Promise<string[]> => {
    const valid: File[] = [];
    for (const f of files) {
      const problem = validateImageFile(f);
      if (problem) toast.error(problem);
      else valid.push(f);
    }
    if (!valid.length) return [];
    onBusyChange?.(true);
    setProgress(0);
    const urls: string[] = [];
    try {
      for (let i = 0; i < valid.length; i++) {
        try {
          const res = await uploadImage(valid[i], folder, (p) => setProgress((i + p) / valid.length));
          urls.push(res.url);
        } catch (err) {
          toast.error(err instanceof UploadError ? err.message : friendlyError(err, `Couldn't upload "${valid[i].name}".`));
        }
      }
    } finally {
      setProgress(null);
      onBusyChange?.(false);
    }
    if (urls.length) toast.success(urls.length === 1 ? "Image uploaded" : `${urls.length} images uploaded`);
    return urls;
  };
  return { progress, upload };
}

interface ImageUploaderProps {
  id?: string;
  value: string | null | undefined;
  onChange: (url: string) => void;
  folder: MediaFolder;
  /** Shown when value is empty — e.g. the built-in image that will be used. */
  fallbackPreview?: string;
  fallbackLabel?: string;
  aspect?: "square" | "portrait" | "wide";
  onBusyChange?: (busy: boolean) => void;
}

/**
 * Single image field. Replacing uploads the new file first and only then swaps
 * the URL — the previous file is never deleted here (clean up in Media Library).
 */
export function ImageUploader({
  id,
  value,
  onChange,
  folder,
  fallbackPreview,
  fallbackLabel = "Using the site's built-in image",
  aspect = "wide",
  onBusyChange,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autoId = useId();
  const inputId = id ?? autoId;
  const { progress, upload } = useUploader(folder, onBusyChange);
  const [dragOver, setDragOver] = useState(false);
  const preview = value || fallbackPreview;
  const aspectCls = aspect === "square" ? "aspect-square" : aspect === "portrait" ? "aspect-[3/4]" : "aspect-[16/9]";

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const [url] = await upload([files[0]]);
    if (url) onChange(url);
  };

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "relative overflow-hidden rounded-lg border border-dashed bg-muted/40 transition-colors",
          aspectCls,
          "max-w-sm",
          dragOver && "border-primary bg-primary/5",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handleFiles(e.dataTransfer.files);
        }}
      >
        {preview ? (
          <img src={preview} alt="" className="h-full w-full object-cover [image-orientation:from-image]" />
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <UploadCloud className="h-6 w-6" aria-hidden="true" />
            <span>Click or drop an image</span>
            <span className="text-xs">JPG, PNG or WebP</span>
          </button>
        )}
        {!value && fallbackPreview && (
          <span className="absolute bottom-2 left-2 rounded bg-background/90 px-2 py-0.5 text-[11px] text-muted-foreground">
            {fallbackLabel}
          </span>
        )}
        {progress !== null && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 px-8">
            <span className="text-xs font-medium">Uploading… {Math.round(progress * 100)}%</span>
            <Progress value={progress * 100} className="h-1.5" />
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={progress !== null}>
          {value ? <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> : <ImagePlus className="mr-1.5 h-3.5 w-3.5" />}
          {value ? "Replace" : "Upload image"}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")} disabled={progress !== null}>
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Remove
          </Button>
        )}
      </div>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

interface GalleryUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  folder: MediaFolder;
  max?: number;
  onBusyChange?: (busy: boolean) => void;
}

/** Ordered list of images. The first image is the cover shown in listings. */
export function GalleryUploader({ value, onChange, folder, max = 12, onBusyChange }: GalleryUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { progress, upload } = useUploader(folder, onBusyChange);

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = max - value.length;
    const list = Array.from(files).slice(0, room);
    if (files.length > room) toast.warning(`Only ${max} images are allowed per product.`);
    const urls = await upload(list);
    if (urls.length) onChange([...value, ...urls]);
  };
  const move = (i: number, dir: -1 | 1) => {
    const next = [...value];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <ul className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {value.map((url, i) => (
            <li key={`${url}-${i}`} className="group relative aspect-[3/4] overflow-hidden rounded-md border bg-muted">
              <img src={url} alt={`Image ${i + 1}`} className="h-full w-full object-cover [image-orientation:from-image]" />
              {i === 0 && (
                <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                  <Star className="h-2.5 w-2.5" aria-hidden="true" /> Cover
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
                <div className="flex gap-1">
                  <IconBtn label="Move earlier" onClick={() => move(i, -1)} disabled={i === 0}>
                    <ArrowLeft className="h-3 w-3" />
                  </IconBtn>
                  <IconBtn label="Move later" onClick={() => move(i, 1)} disabled={i === value.length - 1}>
                    <ArrowRight className="h-3 w-3" />
                  </IconBtn>
                </div>
                <IconBtn label="Remove image" onClick={() => onChange(value.filter((_, k) => k !== i))}>
                  <Trash2 className="h-3 w-3" />
                </IconBtn>
              </div>
            </li>
          ))}
        </ul>
      )}
      {progress !== null && (
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Uploading… {Math.round(progress * 100)}%</span>
          <Progress value={progress * 100} className="h-1.5" />
        </div>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={progress !== null || value.length >= max}
      >
        <ImagePlus className="mr-1.5 h-3.5 w-3.5" />
        Add images
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          void add(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="rounded bg-white/90 p-1 text-foreground shadow-sm hover:bg-white disabled:opacity-40"
    >
      {children}
    </button>
  );
}

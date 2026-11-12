import { requireSupabase, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/client";
import { slugify } from "./utils";

export const MEDIA_BUCKET = "cms-media";
export const MEDIA_FOLDERS = ["products", "collections", "settings", "uploads"] as const;
export type MediaFolder = (typeof MEDIA_FOLDERS)[number];

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
/** Largest file accepted from the user's device (it's resized before upload). */
export const MAX_INPUT_BYTES = 25 * 1024 * 1024;
/** Must match the bucket's file_size_limit in supabase/schema.sql. */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
/** Images larger than this (either side) are scaled down before upload. */
export const MAX_DIMENSION = 2400;
const OPTIMIZE_ABOVE_BYTES = 1.5 * 1024 * 1024;

export class UploadError extends Error {}

export function validateImageFile(file: { type: string; size: number; name: string }): string | null {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return `"${file.name}" isn't a supported image. Use JPG, PNG or WebP.`;
  }
  if (file.size === 0) return `"${file.name}" is empty.`;
  if (file.size > MAX_INPUT_BYTES) {
    return `"${file.name}" is too large (${formatBytes(file.size)}). The maximum is ${formatBytes(MAX_INPUT_BYTES)}.`;
  }
  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Scale large photos down and re-encode as WebP. Respects EXIF orientation.
 * Returns the original file if it's already small, or if optimizing doesn't help.
 */
export async function optimizeImage(file: Blob): Promise<Blob> {
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file; // can't decode in this browser; let the server-side checks decide
  }
  const { width, height } = bitmap;
  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  if (scale === 1 && file.size <= OPTIMIZE_ABOVE_BYTES) {
    bitmap.close();
    return file;
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
  if (!blob || blob.type !== "image/webp") return file; // browser can't encode WebP
  return blob.size < file.size ? blob : file;
}

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export function buildStoragePath(folder: MediaFolder, originalName: string, mime: string): string {
  const base = slugify(originalName.replace(/\.[^.]+$/, "")) || "image";
  const rand = Math.random().toString(36).slice(2, 8);
  return `${folder}/${Date.now()}-${rand}-${base.slice(0, 40)}.${EXT[mime] ?? "bin"}`;
}

export function publicUrlFor(path: string): string {
  return requireSupabase().storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Extract "folder/file.ext" from one of our bucket's public URLs, else null. */
export function storagePathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${MEDIA_BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  return decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
}

export interface UploadResult {
  url: string;
  path: string;
  size: number;
}

/**
 * Validate → optimize → upload. Uses XHR (not fetch) so we can report progress.
 * Never overwrites: every upload gets a unique path, so replacing an image can't
 * destroy the old one before the new one is safely stored.
 */
export async function uploadImage(
  file: Blob & { name?: string },
  folder: MediaFolder,
  onProgress?: (fraction: number) => void,
): Promise<UploadResult> {
  const name = file.name ?? "image";
  const problem = validateImageFile({ type: file.type, size: file.size, name });
  if (problem) throw new UploadError(problem);

  const client = requireSupabase();
  const { data } = await client.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new UploadError("Your session has expired. Please sign in again.");

  const body = await optimizeImage(file);
  if (body.size > MAX_UPLOAD_BYTES) {
    throw new UploadError(
      `"${name}" is still ${formatBytes(body.size)} after optimizing. Please use an image under ${formatBytes(MAX_UPLOAD_BYTES)}.`,
    );
  }
  const path = buildStoragePath(folder, name, body.type);
  const endpoint = `${SUPABASE_URL}/storage/v1/object/${MEDIA_BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", SUPABASE_ANON_KEY);
    xhr.setRequestHeader("Content-Type", body.type);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("cache-control", "max-age=31536000");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let message = "";
      try {
        message = JSON.parse(xhr.responseText)?.message ?? "";
      } catch {
        /* ignore */
      }
      if (xhr.status === 413 || /size/i.test(message)) {
        reject(new UploadError(`"${name}" is too large. Images must be ${formatBytes(MAX_UPLOAD_BYTES)} or smaller.`));
      } else if (/mime/i.test(message)) {
        reject(new UploadError(`"${name}" isn't an allowed file type. Use JPG, PNG or WebP.`));
      } else if (xhr.status === 401 || xhr.status === 403 || /security|unauthori/i.test(message)) {
        reject(new UploadError("You don't have permission to upload files, or your session expired."));
      } else {
        reject(new UploadError(`Upload of "${name}" failed. Please try again.`));
      }
    };
    xhr.onerror = () => reject(new UploadError("Network error while uploading. Check your connection and try again."));
    xhr.send(body);
  });

  onProgress?.(1);
  return { url: publicUrlFor(path), path, size: body.size };
}

export interface MediaFile {
  path: string;
  name: string;
  folder: MediaFolder;
  size: number;
  mimetype: string | null;
  created_at: string | null;
  url: string;
}

export async function listMedia(): Promise<MediaFile[]> {
  const client = requireSupabase();
  const results = await Promise.all(
    MEDIA_FOLDERS.map(async (folder) => {
      const out: MediaFile[] = [];
      for (let offset = 0; ; offset += 1000) {
        const { data, error } = await client.storage
          .from(MEDIA_BUCKET)
          .list(folder, { limit: 1000, offset, sortBy: { column: "created_at", order: "desc" } });
        if (error) throw error;
        for (const f of data ?? []) {
          if (!f.id) continue; // sub-folder placeholder
          const path = `${folder}/${f.name}`;
          out.push({
            path,
            name: f.name,
            folder,
            size: Number((f.metadata as { size?: number } | null)?.size ?? 0),
            mimetype: (f.metadata as { mimetype?: string } | null)?.mimetype ?? null,
            created_at: f.created_at ?? null,
            url: publicUrlFor(path),
          });
        }
        if (!data || data.length < 1000) break;
      }
      return out;
    }),
  );
  return results.flat().sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
}

export async function deleteMedia(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await requireSupabase().storage.from(MEDIA_BUCKET).remove(paths);
  if (error) throw error;
}

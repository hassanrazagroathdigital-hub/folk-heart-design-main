import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ImageOff, LayoutGrid, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { EditorSheet } from "@/components/admin/EditorSheet";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { PublishToggle, ReorderButtons, RowActions, useReorderHandler } from "@/components/admin/RowControls";
import { EmptyState, ErrorState, Field, PageHeader, Panel, TableSkeleton } from "@/components/admin/ui";
import { useAdminList, useDeleteRecord, useSaveRecord } from "@/lib/cms/admin";
import { friendlyError } from "@/lib/cms/errors";
import type { Category } from "@/lib/cms/types";
import { formatDate, nextSortOrder, SLUG_PATTERN, slugify } from "@/lib/cms/utils";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120, "Keep the name under 120 characters"),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(80)
    .regex(SLUG_PATTERN, "Use lowercase letters, numbers and single hyphens only"),
  description: z.string().max(2000, "Keep the description under 2000 characters"),
  image_url: z.string(),
  published: z.boolean(),
  sort_order: z.string().trim().regex(/^-?\d{1,6}$/, "Enter a whole number"),
});
type FormValues = z.infer<typeof schema>;

const toForm = (c: Category | null, sort: number): FormValues => ({
  name: c?.name ?? "",
  slug: c?.slug ?? "",
  description: c?.description ?? "",
  image_url: c?.image_url ?? "",
  published: c?.published ?? true,
  sort_order: String(c?.sort_order ?? sort),
});

export default function Collections() {
  const list = useAdminList("product_categories");
  const products = useAdminList("products");
  const save = useSaveRecord("product_categories");
  const remove = useDeleteRecord("product_categories");
  const [editing, setEditing] = useState<Category | null>(null);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const rows = useMemo(() => list.data ?? [], [list.data]);
  const orderIndex = useMemo(() => new Map(rows.map((r, i) => [r.id, i])), [rows]);
  const { move, pending } = useReorderHandler("product_categories", rows);
  const productCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of products.data ?? []) if (p.category_id) m.set(p.category_id, (m.get(p.category_id) ?? 0) + 1);
    return m;
  }, [products.data]);

  const openEditor = (c: Category | null) => {
    setEditing(c);
    setOpen(true);
  };

  const columns: Column<Category>[] = [
    {
      key: "name",
      header: "Collection",
      sortValue: (c) => c.name,
      cell: (c) => (
        <div className="flex items-center gap-3 min-w-[180px]">
          <div className="h-12 w-10 shrink-0 overflow-hidden rounded-md border bg-muted">
            {c.image_url ? (
              <img src={c.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <ImageOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium">{c.name}</div>
            <div className="truncate text-xs text-muted-foreground">/shop?category={c.name}</div>
          </div>
        </div>
      ),
    },
    {
      key: "count",
      header: "Products",
      hideBelow: "sm",
      sortValue: (c) => productCount.get(c.id) ?? 0,
      cell: (c) => <span className="tabular-nums text-sm">{productCount.get(c.id) ?? 0}</span>,
    },
    {
      key: "published",
      header: "Published",
      sortValue: (c) => (c.published ? 1 : 0),
      cell: (c) => <PublishToggle table="product_categories" id={c.id} published={c.published} label={c.name} />,
    },
    {
      key: "sort_order",
      header: "Order",
      sortValue: (c) => orderIndex.get(c.id) ?? 0,
      cell: (c, ctx) => (
        <ReorderButtons id={c.id} index={orderIndex.get(c.id) ?? 0} count={rows.length} enabled={ctx.inDisplayOrder} pending={pending} onMove={move} />
      ),
    },
    {
      key: "updated",
      header: "Updated",
      hideBelow: "lg",
      sortValue: (c) => c.updated_at,
      cell: (c) => <span className="text-xs text-muted-foreground">{formatDate(c.updated_at)}</span>,
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      cell: (c) => <RowActions label={c.name} onEdit={() => openEditor(c)} onDelete={() => setDeleting(c)} />,
    },
  ];

  const deletingCount = deleting ? productCount.get(deleting.id) ?? 0 : 0;

  return (
    <>
      <PageHeader
        title="Collections"
        description="Product categories: shown as cards on the homepage and as filters on the Shop page."
        actions={
          <Button onClick={() => openEditor(null)}>
            <Plus className="mr-1.5 h-4 w-4" /> Add collection
          </Button>
        }
      />
      {list.error ? (
        <ErrorState message={friendlyError(list.error)} onRetry={() => void list.refetch()} />
      ) : (
        <Panel>
          {list.isLoading ? (
            <TableSkeleton rows={5} />
          ) : (
            <DataTable
              rows={rows}
              columns={columns}
              getRowId={(c) => c.id}
              searchText={(c) => `${c.name} ${c.slug} ${c.description}`}
              searchPlaceholder="Search collections…"
              orderKey="sort_order"
              onRowClick={openEditor}
              empty={
                <EmptyState
                  icon={LayoutGrid}
                  title="No collections yet"
                  description="Create collections like Quilts or Aprons to group your products."
                  action={
                    <Button onClick={() => openEditor(null)}>
                      <Plus className="mr-1.5 h-4 w-4" /> Add collection
                    </Button>
                  }
                />
              }
            />
          )}
        </Panel>
      )}

      <CollectionEditor
        open={open}
        onOpenChange={setOpen}
        category={editing}
        defaultSortOrder={nextSortOrder(rows)}
        saving={save.isPending}
        onSave={async (values) => {
          try {
            await save.mutateAsync({ id: editing?.id, values });
            toast.success(editing ? "Collection updated" : "Collection created");
            setOpen(false);
          } catch (err) {
            toast.error(friendlyError(err, "Couldn't save the collection."));
          }
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this collection?"
        loading={remove.isPending}
        description={
          <>
            <p>
              <strong className="text-foreground">{deleting?.name}</strong> will be permanently deleted.
            </p>
            {deletingCount > 0 ? (
              <p>
                {deletingCount} product{deletingCount === 1 ? "" : "s"} in this collection will{" "}
                <strong className="text-foreground">not</strong> be deleted. They'll become uncategorized and still appear
                under "All" on the Shop page.
              </p>
            ) : (
              <p>No products are in this collection.</p>
            )}
          </>
        }
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await remove.mutateAsync(deleting.id);
            toast.success(`"${deleting.name}" deleted`);
            setDeleting(null);
          } catch (err) {
            toast.error(friendlyError(err, "Couldn't delete the collection."));
          }
        }}
      />
    </>
  );
}

function CollectionEditor({
  open,
  onOpenChange,
  category,
  defaultSortOrder,
  saving,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  category: Category | null;
  defaultSortOrder: number;
  saving: boolean;
  onSave: (values: Partial<Category>) => Promise<void>;
}) {
  const { register, control, handleSubmit, formState, setValue, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toForm(category, defaultSortOrder),
  });
  // A ref (not state) so input handlers always read the live value.
  const slugTouched = useRef(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      reset(toForm(category, defaultSortOrder));
      slugTouched.current = !!category;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, category]);

  const e = formState.errors;

  return (
    <EditorSheet
      open={open}
      onOpenChange={onOpenChange}
      title={category ? "Edit collection" : "New collection"}
      description={category?.name}
      dirty={formState.isDirty}
      saving={saving}
      busy={uploading}
      submitLabel={category ? "Save changes" : "Create collection"}
      onSubmit={handleSubmit((v) =>
        onSave({
          name: v.name.trim(),
          slug: v.slug.trim(),
          description: v.description.trim(),
          image_url: v.image_url || null,
          published: v.published,
          sort_order: Number(v.sort_order),
        }),
      )}
    >
      <Field id="c-name" label="Name" required error={e.name?.message} hint="Also used for the Shop filter button and link.">
        <Input
          id="c-name"
          {...register("name", {
            onChange: (ev) => {
              if (!slugTouched.current) setValue("slug", slugify(ev.target.value), { shouldDirty: true });
            },
          })}
          aria-invalid={!!e.name}
        />
      </Field>
      <Field id="c-slug" label="URL slug" required error={e.slug?.message}>
        <Input id="c-slug" {...register("slug", { onChange: () => { slugTouched.current = true; } })} aria-invalid={!!e.slug} />
      </Field>
      <Field id="c-desc" label="Description" error={e.description?.message} hint="Shown under the card on the homepage.">
        <Textarea id="c-desc" rows={3} {...register("description")} />
      </Field>
      <Field id="c-image" label="Cover image">
        <Controller
          control={control}
          name="image_url"
          render={({ field }) => (
            <ImageUploader id="c-image" value={field.value} onChange={field.onChange} folder="collections" aspect="portrait" onBusyChange={setUploading} />
          )}
        />
      </Field>
      <Field id="c-order" label="Display order" error={e.sort_order?.message} hint="Lower numbers appear first">
        <Input id="c-order" inputMode="numeric" className="max-w-[140px]" {...register("sort_order")} />
      </Field>
      <Controller
        control={control}
        name="published"
        render={({ field }) => (
          <label className="flex items-center justify-between gap-4 rounded-lg border p-4 cursor-pointer">
            <span>
              <span className="block text-sm font-medium">Published</span>
              <span className="block text-xs text-muted-foreground">Show this collection on the homepage and Shop filters.</span>
            </span>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </label>
        )}
      />
    </EditorSheet>
  );
}

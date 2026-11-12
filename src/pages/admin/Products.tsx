import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ImageOff, Plus, ShoppingBag, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { EditorSheet } from "@/components/admin/EditorSheet";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { GalleryUploader } from "@/components/admin/ImageUploader";
import { PublishToggle, ReorderButtons, RowActions, useReorderHandler } from "@/components/admin/RowControls";
import { EmptyState, ErrorState, Field, PageHeader, Panel, Pill, TableSkeleton } from "@/components/admin/ui";
import { useAdminList, useDeleteRecord, useSaveRecord } from "@/lib/cms/admin";
import { friendlyError } from "@/lib/cms/errors";
import { STOCK_STATUS_LABELS, type Category, type Product, type StockStatus } from "@/lib/cms/types";
import { formatDate, nextSortOrder, SLUG_PATTERN, slugify } from "@/lib/cms/utils";

const money = /^\d{1,8}(\.\d{1,2})?$/;
const optionalMoney = z.string().trim().refine((v) => v === "" || money.test(v), "Enter an amount like 45 or 45.00");
const optionalInt = z.string().trim().refine((v) => v === "" || /^\d{1,6}$/.test(v), "Enter a whole number");

const schema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(160, "Keep the name under 160 characters"),
    slug: z
      .string()
      .trim()
      .min(1, "Slug is required")
      .max(80, "Keep the slug under 80 characters")
      .regex(SLUG_PATTERN, "Use lowercase letters, numbers and single hyphens only"),
    description: z.string().max(5000, "Keep the description under 5000 characters"),
    category_id: z.string(),
    images: z.array(z.string()).max(12),
    stock_status: z.enum(["available", "sample", "coming_soon", "sold_out", "none"]),
    quantity: optionalInt,
    price: optionalMoney,
    sale_price: optionalMoney,
    sku: z.string().trim().max(64, "Keep the SKU under 64 characters"),
    featured: z.boolean(),
    published: z.boolean(),
    sort_order: z.string().trim().regex(/^-?\d{1,6}$/, "Enter a whole number"),
  })
  .refine((v) => !(v.sale_price && !v.price), { path: ["sale_price"], message: "Set a regular price before a sale price" })
  .refine((v) => !(v.sale_price && v.price && Number(v.sale_price) >= Number(v.price)), {
    path: ["sale_price"],
    message: "Sale price should be lower than the regular price",
  });

type FormValues = z.infer<typeof schema>;
const NO_CATEGORY = "__none__";

function toForm(p: Product | null, sortOrder: number): FormValues {
  return {
    name: p?.name ?? "",
    slug: p?.slug ?? "",
    description: p?.description ?? "",
    category_id: p?.category_id ?? NO_CATEGORY,
    images: p ? (p.gallery_images?.length ? p.gallery_images : p.featured_image ? [p.featured_image] : []) : [],
    stock_status: p?.stock_status ?? "available",
    quantity: p?.quantity != null ? String(p.quantity) : p ? "" : "1",
    price: p?.price != null ? String(p.price) : "",
    sale_price: p?.sale_price != null ? String(p.sale_price) : "",
    sku: p?.sku ?? "",
    featured: p?.featured ?? false,
    published: p?.published ?? true,
    sort_order: String(p?.sort_order ?? sortOrder),
  };
}

function fromForm(v: FormValues): Partial<Product> {
  return {
    name: v.name.trim(),
    slug: v.slug.trim(),
    description: v.description.trim(),
    category_id: v.category_id === NO_CATEGORY ? null : v.category_id,
    featured_image: v.images[0] ?? null,
    gallery_images: v.images,
    stock_status: v.stock_status as StockStatus,
    quantity: v.quantity === "" ? null : Number(v.quantity),
    price: v.price === "" ? null : Number(v.price),
    sale_price: v.sale_price === "" ? null : Number(v.sale_price),
    sku: v.sku.trim() || null,
    featured: v.featured,
    published: v.published,
    sort_order: Number(v.sort_order),
  };
}

const stockTone: Record<StockStatus, "green" | "neutral" | "blue" | "red" | "amber"> = {
  available: "green",
  sample: "neutral",
  coming_soon: "blue",
  sold_out: "red",
  none: "neutral",
};

export default function Products() {
  const products = useAdminList("products");
  const categories = useAdminList("product_categories");
  const save = useSaveRecord("products");
  const remove = useDeleteRecord("products");

  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const rows = useMemo(() => products.data ?? [], [products.data]);
  const catById = useMemo(() => new Map((categories.data ?? []).map((c) => [c.id, c])), [categories.data]);
  const { move, pending: reordering } = useReorderHandler("products", rows);
  const orderIndex = useMemo(() => new Map(rows.map((r, i) => [r.id, i])), [rows]);

  const filteredRows = useMemo(
    () =>
      rows.filter(
        (p) =>
          (categoryFilter === "all" ||
            (categoryFilter === NO_CATEGORY ? !p.category_id : p.category_id === categoryFilter)) &&
          (statusFilter === "all" || (statusFilter === "published" ? p.published : !p.published)),
      ),
    [rows, categoryFilter, statusFilter],
  );

  const openEditor = (p: Product | null) => {
    setEditing(p);
    setOpen(true);
  };

  const columns: Column<Product>[] = [
    {
      key: "name",
      header: "Product",
      sortValue: (p) => p.name,
      cell: (p) => (
        <div className="flex items-center gap-3 min-w-[200px]">
          <div className="h-12 w-10 shrink-0 overflow-hidden rounded-md border bg-muted">
            {p.featured_image ? (
              <img src={p.featured_image} alt="" className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <ImageOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-medium">{p.name}</span>
              {p.featured && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" aria-label="Featured" />}
            </div>
            <div className="truncate text-xs text-muted-foreground">/{p.slug}</div>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Collection",
      hideBelow: "md",
      sortValue: (p) => (p.category_id ? catById.get(p.category_id)?.name ?? "" : ""),
      cell: (p) =>
        p.category_id && catById.get(p.category_id) ? (
          <span className="text-sm">{catById.get(p.category_id)!.name}</span>
        ) : (
          <span className="text-xs text-muted-foreground">Uncategorized</span>
        ),
    },
    {
      key: "stock",
      header: "Badge",
      hideBelow: "lg",
      sortValue: (p) => p.stock_status,
      cell: (p) => (
        <Pill tone={stockTone[p.stock_status]}>
          {p.stock_status === "available" ? `${p.quantity ?? 1} available` : STOCK_STATUS_LABELS[p.stock_status]}
        </Pill>
      ),
    },
    {
      key: "published",
      header: "Published",
      sortValue: (p) => (p.published ? 1 : 0),
      cell: (p) => <PublishToggle table="products" id={p.id} published={p.published} label={p.name} />,
    },
    {
      key: "sort_order",
      header: "Order",
      hideBelow: "sm",
      sortValue: (p) => orderIndex.get(p.id) ?? 0,
      cell: (p, ctx) => (
        <ReorderButtons
          id={p.id}
          index={orderIndex.get(p.id) ?? 0}
          count={rows.length}
          enabled={ctx.inDisplayOrder}
          pending={reordering}
          onMove={move}
        />
      ),
    },
    {
      key: "updated",
      header: "Updated",
      hideBelow: "lg",
      sortValue: (p) => p.updated_at,
      cell: (p) => <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(p.updated_at)}</span>,
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      cell: (p) => <RowActions label={p.name} onEdit={() => openEditor(p)} onDelete={() => setDeleting(p)} />,
    },
  ];

  const loadError = products.error || categories.error;

  return (
    <>
      <PageHeader
        title="Products"
        description="Everything shown on the Shop page. Drafts are hidden from the website."
        actions={
          <Button onClick={() => openEditor(null)}>
            <Plus className="mr-1.5 h-4 w-4" /> Add product
          </Button>
        }
      />

      {loadError ? (
        <ErrorState message={friendlyError(loadError)} onRetry={() => void products.refetch()} />
      ) : (
        <Panel>
          {products.isLoading ? (
            <TableSkeleton />
          ) : (
            <DataTable
              rows={filteredRows}
              columns={columns}
              getRowId={(p) => p.id}
              searchText={(p) => `${p.name} ${p.slug} ${p.sku ?? ""} ${p.description}`}
              searchPlaceholder="Search products…"
              orderKey="sort_order"
              filtered={categoryFilter !== "all" || statusFilter !== "all"}
              onRowClick={openEditor}
              toolbar={
                <>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-9 w-[170px]" aria-label="Filter by collection">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All collections</SelectItem>
                      {(categories.data ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                      <SelectItem value={NO_CATEGORY}>Uncategorized</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-9 w-[140px]" aria-label="Filter by status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Drafts</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              }
              empty={
                rows.length === 0 ? (
                  <EmptyState
                    icon={ShoppingBag}
                    title="No products yet"
                    description="Add your first product, or import the site's original products from the Dashboard."
                    action={
                      <Button onClick={() => openEditor(null)}>
                        <Plus className="mr-1.5 h-4 w-4" /> Add product
                      </Button>
                    }
                  />
                ) : (
                  <div className="px-6 py-12 text-center text-sm text-muted-foreground">No products match these filters.</div>
                )
              }
            />
          )}
        </Panel>
      )}

      <ProductEditor
        open={open}
        onOpenChange={setOpen}
        product={editing}
        categories={categories.data ?? []}
        defaultSortOrder={nextSortOrder(rows)}
        saving={save.isPending}
        onSave={async (values) => {
          try {
            await save.mutateAsync({ id: editing?.id, values });
            toast.success(editing ? "Product updated" : "Product created");
            setOpen(false);
          } catch (err) {
            toast.error(friendlyError(err, "Couldn't save the product."));
          }
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this product?"
        loading={remove.isPending}
        description={
          <>
            <p>
              <strong className="text-foreground">{deleting?.name}</strong> will be permanently removed from the website
              and the dashboard. This can't be undone.
            </p>
            <p>Its images stay in the Media Library, where unused files can be cleaned up.</p>
          </>
        }
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await remove.mutateAsync(deleting.id);
            toast.success(`"${deleting.name}" deleted`);
            setDeleting(null);
          } catch (err) {
            toast.error(friendlyError(err, "Couldn't delete the product."));
          }
        }}
      />
    </>
  );
}

function ProductEditor({
  open,
  onOpenChange,
  product,
  categories,
  defaultSortOrder,
  saving,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  product: Product | null;
  categories: Category[];
  defaultSortOrder: number;
  saving: boolean;
  onSave: (values: Partial<Product>) => Promise<void>;
}) {
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: toForm(product, defaultSortOrder) });
  const { register, control, handleSubmit, formState, watch, setValue, reset } = form;
  // A ref (not state) so input handlers always read the live value.
  const slugTouched = useRef(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      reset(toForm(product, defaultSortOrder));
      slugTouched.current = !!product;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product]);

  const stock = watch("stock_status");
  const e = formState.errors;

  return (
    <EditorSheet
      open={open}
      onOpenChange={onOpenChange}
      title={product ? "Edit product" : "New product"}
      description={product ? product.name : "Add a product to the Shop page."}
      dirty={formState.isDirty}
      saving={saving}
      busy={uploading}
      submitLabel={product ? "Save changes" : "Create product"}
      onSubmit={handleSubmit((v) => onSave(fromForm(v)))}
    >
      <Field id="p-name" label="Name" required error={e.name?.message}>
        <Input
          id="p-name"
          {...register("name", {
            onChange: (ev) => {
              if (!slugTouched.current) setValue("slug", slugify(ev.target.value), { shouldDirty: true });
            },
          })}
          aria-invalid={!!e.name}
        />
      </Field>
      <Field id="p-slug" label="URL slug" required error={e.slug?.message} hint="Unique identifier, e.g. blue-floral-quilt">
        <Input id="p-slug" {...register("slug", { onChange: () => { slugTouched.current = true; } })} aria-invalid={!!e.slug} />
      </Field>
      <Field id="p-category" label="Collection">
        <Controller
          control={control}
          name="category_id"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="p-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CATEGORY}>No collection</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                    {!c.published && " (draft)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>
      <Field id="p-desc" label="Description" error={e.description?.message}>
        <Textarea id="p-desc" rows={5} {...register("description")} />
      </Field>
      <Field id="p-images" label="Images" hint="The first image is the cover. Add more to show a swipeable gallery.">
        <Controller
          control={control}
          name="images"
          render={({ field }) => (
            <GalleryUploader value={field.value} onChange={field.onChange} folder="products" onBusyChange={setUploading} />
          )}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="p-stock" label="Badge / availability">
          <Controller
            control={control}
            name="stock_status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="p-stock">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STOCK_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        {stock === "available" && (
          <Field id="p-qty" label="Quantity available" error={e.quantity?.message} hint='Shown as "1 Available"'>
            <Input id="p-qty" inputMode="numeric" {...register("quantity")} />
          </Field>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="p-price" label="Price ($)" error={e.price?.message} hint="Optional">
          <Input id="p-price" inputMode="decimal" placeholder="—" {...register("price")} />
        </Field>
        <Field id="p-sale" label="Sale price ($)" error={e.sale_price?.message} hint="Optional">
          <Input id="p-sale" inputMode="decimal" placeholder="—" {...register("sale_price")} />
        </Field>
        <Field id="p-sku" label="SKU" error={e.sku?.message} hint="Optional">
          <Input id="p-sku" {...register("sku")} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="p-order" label="Display order" error={e.sort_order?.message} hint="Lower numbers appear first">
          <Input id="p-order" inputMode="numeric" {...register("sort_order")} />
        </Field>
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <Controller
          control={control}
          name="published"
          render={({ field }) => (
            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <span>
                <span className="block text-sm font-medium">Published</span>
                <span className="block text-xs text-muted-foreground">Visible on the website. Turn off to save as a draft.</span>
              </span>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </label>
          )}
        />
        <Controller
          control={control}
          name="featured"
          render={({ field }) => (
            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <span>
                <span className="block text-sm font-medium">Featured</span>
                <span className="block text-xs text-muted-foreground">Highlight this product (shown first in "All").</span>
              </span>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </label>
          )}
        />
      </div>
    </EditorSheet>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { HelpCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { EditorSheet } from "@/components/admin/EditorSheet";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { PublishToggle, ReorderButtons, RowActions, useReorderHandler } from "@/components/admin/RowControls";
import { EmptyState, ErrorState, Field, PageHeader, Panel, TableSkeleton } from "@/components/admin/ui";
import { useAdminList, useDeleteRecord, useSaveRecord } from "@/lib/cms/admin";
import { friendlyError } from "@/lib/cms/errors";
import type { Faq } from "@/lib/cms/types";
import { formatDate, nextSortOrder } from "@/lib/cms/utils";

const schema = z.object({
  question: z.string().trim().min(1, "Question is required").max(500, "Keep the question under 500 characters"),
  answer: z.string().trim().min(1, "Answer is required").max(5000, "Keep the answer under 5000 characters"),
  published: z.boolean(),
  sort_order: z.string().trim().regex(/^-?\d{1,6}$/, "Enter a whole number"),
});
type FormValues = z.infer<typeof schema>;

const toForm = (f: Faq | null, sort: number): FormValues => ({
  question: f?.question ?? "",
  answer: f?.answer ?? "",
  published: f?.published ?? true,
  sort_order: String(f?.sort_order ?? sort),
});

export default function Faqs() {
  const list = useAdminList("faqs");
  const save = useSaveRecord("faqs");
  const remove = useDeleteRecord("faqs");
  const [editing, setEditing] = useState<Faq | null>(null);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<Faq | null>(null);

  const rows = useMemo(() => list.data ?? [], [list.data]);
  const orderIndex = useMemo(() => new Map(rows.map((r, i) => [r.id, i])), [rows]);
  const { move, pending } = useReorderHandler("faqs", rows);

  const openEditor = (f: Faq | null) => {
    setEditing(f);
    setOpen(true);
  };

  const columns: Column<Faq>[] = [
    {
      key: "question",
      header: "Question",
      sortValue: (f) => f.question,
      cell: (f) => (
        <div className="min-w-[220px] max-w-xl">
          <div className="font-medium">{f.question}</div>
          <div className="line-clamp-1 text-xs text-muted-foreground">{f.answer}</div>
        </div>
      ),
    },
    {
      key: "published",
      header: "Published",
      sortValue: (f) => (f.published ? 1 : 0),
      cell: (f) => <PublishToggle table="faqs" id={f.id} published={f.published} label={f.question} />,
    },
    {
      key: "sort_order",
      header: "Order",
      sortValue: (f) => orderIndex.get(f.id) ?? 0,
      cell: (f, ctx) => (
        <ReorderButtons id={f.id} index={orderIndex.get(f.id) ?? 0} count={rows.length} enabled={ctx.inDisplayOrder} pending={pending} onMove={move} />
      ),
    },
    {
      key: "updated",
      header: "Updated",
      hideBelow: "md",
      sortValue: (f) => f.updated_at,
      cell: (f) => <span className="text-xs text-muted-foreground">{formatDate(f.updated_at)}</span>,
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      cell: (f) => <RowActions label={f.question} onEdit={() => openEditor(f)} onDelete={() => setDeleting(f)} />,
    },
  ];

  return (
    <>
      <PageHeader
        title="FAQs"
        description="Questions and answers shown on the Custom Order page."
        actions={
          <Button onClick={() => openEditor(null)}>
            <Plus className="mr-1.5 h-4 w-4" /> Add FAQ
          </Button>
        }
      />
      {list.error ? (
        <ErrorState message={friendlyError(list.error)} onRetry={() => void list.refetch()} />
      ) : (
        <Panel>
          {list.isLoading ? (
            <TableSkeleton rows={4} cols={3} />
          ) : (
            <DataTable
              rows={rows}
              columns={columns}
              getRowId={(f) => f.id}
              searchText={(f) => `${f.question} ${f.answer}`}
              searchPlaceholder="Search FAQs…"
              orderKey="sort_order"
              onRowClick={openEditor}
              empty={
                <EmptyState
                  icon={HelpCircle}
                  title="No FAQs yet"
                  description="Add common questions customers ask about custom orders, shipping and returns."
                  action={
                    <Button onClick={() => openEditor(null)}>
                      <Plus className="mr-1.5 h-4 w-4" /> Add FAQ
                    </Button>
                  }
                />
              }
            />
          )}
        </Panel>
      )}

      <FaqEditor
        open={open}
        onOpenChange={setOpen}
        faq={editing}
        defaultSortOrder={nextSortOrder(rows)}
        saving={save.isPending}
        onSave={async (values) => {
          try {
            await save.mutateAsync({ id: editing?.id, values });
            toast.success(editing ? "FAQ updated" : "FAQ created");
            setOpen(false);
          } catch (err) {
            toast.error(friendlyError(err, "Couldn't save the FAQ."));
          }
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this FAQ?"
        loading={remove.isPending}
        description={
          <p>
            "<strong className="text-foreground">{deleting?.question}</strong>" will be permanently removed. This can't be undone.
          </p>
        }
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await remove.mutateAsync(deleting.id);
            toast.success("FAQ deleted");
            setDeleting(null);
          } catch (err) {
            toast.error(friendlyError(err, "Couldn't delete the FAQ."));
          }
        }}
      />
    </>
  );
}

function FaqEditor({
  open,
  onOpenChange,
  faq,
  defaultSortOrder,
  saving,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  faq: Faq | null;
  defaultSortOrder: number;
  saving: boolean;
  onSave: (values: Partial<Faq>) => Promise<void>;
}) {
  const { register, control, handleSubmit, formState, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toForm(faq, defaultSortOrder),
  });
  useEffect(() => {
    if (open) reset(toForm(faq, defaultSortOrder));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, faq]);
  const e = formState.errors;

  return (
    <EditorSheet
      open={open}
      onOpenChange={onOpenChange}
      title={faq ? "Edit FAQ" : "New FAQ"}
      dirty={formState.isDirty}
      saving={saving}
      submitLabel={faq ? "Save changes" : "Create FAQ"}
      onSubmit={handleSubmit((v) =>
        onSave({ question: v.question.trim(), answer: v.answer.trim(), published: v.published, sort_order: Number(v.sort_order) }),
      )}
    >
      <Field id="f-q" label="Question" required error={e.question?.message}>
        <Input id="f-q" {...register("question")} aria-invalid={!!e.question} />
      </Field>
      <Field id="f-a" label="Answer" required error={e.answer?.message}>
        <Textarea id="f-a" rows={6} {...register("answer")} aria-invalid={!!e.answer} />
      </Field>
      <Field id="f-order" label="Display order" error={e.sort_order?.message} hint="Lower numbers appear first">
        <Input id="f-order" inputMode="numeric" className="max-w-[140px]" {...register("sort_order")} />
      </Field>
      <Controller
        control={control}
        name="published"
        render={({ field }) => (
          <label className="flex items-center justify-between gap-4 rounded-lg border p-4 cursor-pointer">
            <span>
              <span className="block text-sm font-medium">Published</span>
              <span className="block text-xs text-muted-foreground">Show this FAQ on the website.</span>
            </span>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </label>
        )}
      />
    </EditorSheet>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Inbox, Mail, MailOpen, Phone, Reply, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pager } from "@/components/admin/DataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { EmptyState, ErrorState, PageHeader, Panel, Pill, Spinner, TableSkeleton } from "@/components/admin/ui";
import { useDeleteInquiry, useInquiries, useUpdateInquiry, type InquiryListParams } from "@/lib/cms/admin";
import { friendlyError } from "@/lib/cms/errors";
import { requireSupabase } from "@/lib/supabase/client";
import {
  INQUIRY_STATUS_LABELS,
  INQUIRY_TYPE_LABELS,
  type Inquiry,
  type InquiryStatus,
} from "@/lib/cms/types";
import { formatDate, isPersistedId } from "@/lib/cms/utils";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 25;

const statusTone: Record<InquiryStatus, "blue" | "amber" | "green" | "neutral" | "red"> = {
  new: "blue",
  in_progress: "amber",
  replied: "green",
  closed: "neutral",
  spam: "red",
};

function humanize(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function Inquiries() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const debounced = useDebounced(search);
  const [filters, setFilters] = useState<Omit<InquiryListParams, "search" | "page" | "pageSize">>({
    status: "all",
    read: "all",
    type: "all",
  });
  const [page, setPage] = useState(1);
  const params: InquiryListParams = { ...filters, search: debounced, page, pageSize: PAGE_SIZE };
  const { data, isLoading, isFetching, error, refetch } = useInquiries(params);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Inquiry | null>(null);
  const update = useUpdateInquiry();
  const remove = useDeleteInquiry();

  // Deep link from the dashboard: /admin/inquiries?open=<id>
  useEffect(() => {
    const id = searchParams.get("open");
    if (id && isPersistedId(id)) setSelectedId(id);
  }, [searchParams]);

  useEffect(() => setPage(1), [debounced, filters]);

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const hasFilters = !!debounced || filters.status !== "all" || filters.read !== "all" || filters.type !== "all";

  const setStatus = (i: Inquiry, status: InquiryStatus) =>
    update.mutate(
      { id: i.id, patch: { status, is_read: true } },
      {
        onSuccess: () => toast.success(`Marked as ${INQUIRY_STATUS_LABELS[status].toLowerCase()}`),
        onError: (err) => toast.error(friendlyError(err, "Couldn't update the inquiry.")),
      },
    );

  const toggleRead = (i: Inquiry) =>
    update.mutate(
      { id: i.id, patch: { is_read: !i.is_read } },
      { onError: (err) => toast.error(friendlyError(err, "Couldn't update the inquiry.")) },
    );

  const closeDetail = () => {
    setSelectedId(null);
    if (searchParams.has("open")) {
      searchParams.delete("open");
      setSearchParams(searchParams, { replace: true });
    }
  };

  return (
    <>
      <PageHeader
        title="Inquiries"
        description="Messages sent from the Contact and Custom Order forms."
        actions={isFetching && !isLoading ? <Spinner className="text-muted-foreground" /> : null}
      />

      <Panel>
        <div className="flex flex-col gap-3 border-b p-3 lg:flex-row lg:items-center">
          <div className="relative w-full lg:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, message…"
              aria-label="Search inquiries"
              className="h-9 pl-8"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={filters.status} onValueChange={(v) => setFilters((f) => ({ ...f, status: v as InquiryListParams["status"] }))}>
              <SelectTrigger className="h-9 w-[150px]" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="open">Open (new + in progress)</SelectItem>
                {Object.entries(INQUIRY_STATUS_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.read} onValueChange={(v) => setFilters((f) => ({ ...f, read: v as InquiryListParams["read"] }))}>
              <SelectTrigger className="h-9 w-[120px]" aria-label="Filter by read state">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Read & unread</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.type} onValueChange={(v) => setFilters((f) => ({ ...f, type: v as InquiryListParams["type"] }))}>
              <SelectTrigger className="h-9 w-[160px]" aria-label="Filter by form">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All forms</SelectItem>
                {Object.entries(INQUIRY_TYPE_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error ? (
          <div className="p-4">
            <ErrorState message={friendlyError(error)} onRetry={() => void refetch()} />
          </div>
        ) : isLoading ? (
          <TableSkeleton rows={6} cols={4} />
        ) : rows.length === 0 ? (
          hasFilters ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">No inquiries match your search or filters.</div>
          ) : (
            <EmptyState icon={Inbox} title="No inquiries yet" description="When visitors use the Contact or Custom Order forms, their messages will appear here." />
          )
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-6"><span className="sr-only">Unread</span></TableHead>
                    <TableHead className="text-xs">From</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Message</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">Status</TableHead>
                    <TableHead className="text-xs text-right">Received</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((i) => (
                    <TableRow
                      key={i.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedId(i.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedId(i.id);
                        }
                      }}
                      tabIndex={0}
                      aria-label={`Open inquiry from ${i.name}`}
                    >
                      <TableCell className="py-3 pr-0">
                        {!i.is_read && <span className="block h-2 w-2 rounded-full bg-primary" aria-label="Unread" />}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className={cn("text-sm", !i.is_read && "font-semibold")}>{i.name}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{i.email}</div>
                      </TableCell>
                      <TableCell className="py-3 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <Pill>{INQUIRY_TYPE_LABELS[i.type]}</Pill>
                          <span className={cn("truncate max-w-[340px] text-sm", !i.is_read ? "text-foreground" : "text-muted-foreground")}>
                            {i.subject || i.message || "(no message)"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 hidden sm:table-cell">
                        <Pill tone={statusTone[i.status]}>{INQUIRY_STATUS_LABELS[i.status]}</Pill>
                      </TableCell>
                      <TableCell className="py-3 text-right text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(i.created_at, true)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {total > PAGE_SIZE && (
              <Pager page={page} pageCount={Math.max(1, Math.ceil(total / PAGE_SIZE))} total={total} pageSize={PAGE_SIZE} onPage={setPage} />
            )}
          </>
        )}
      </Panel>

      <InquiryDetail
        id={selectedId}
        listRow={rows.find((r) => r.id === selectedId)}
        onClose={closeDetail}
        onStatus={setStatus}
        onToggleRead={toggleRead}
        onDelete={(i) => setDeleting(i)}
        updating={update.isPending}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this inquiry?"
        loading={remove.isPending}
        description={
          <p>
            The message from <strong className="text-foreground">{deleting?.name}</strong> ({deleting?.email}) will be
            permanently deleted. Consider marking it "Closed" or "Spam" instead if you may need it later.
          </p>
        }
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await remove.mutateAsync(deleting.id);
            toast.success("Inquiry deleted");
            setDeleting(null);
            closeDetail();
          } catch (err) {
            toast.error(friendlyError(err, "Couldn't delete the inquiry."));
          }
        }}
      />
    </>
  );
}

function InquiryDetail({
  id,
  listRow,
  onClose,
  onStatus,
  onToggleRead,
  onDelete,
  updating,
}: {
  id: string | null;
  listRow?: Inquiry;
  onClose: () => void;
  onStatus: (i: Inquiry, s: InquiryStatus) => void;
  onToggleRead: (i: Inquiry) => void;
  onDelete: (i: Inquiry) => void;
  updating: boolean;
}) {
  // Load by id so deep links work even when the row isn't on the current page.
  const { data: fetched, isLoading, error } = useQuery({
    queryKey: ["admin", "inquiries", "one", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await requireSupabase().from("inquiries").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data as Inquiry | null;
    },
  });
  const inquiry = fetched ?? listRow ?? null;
  const update = useUpdateInquiry();
  const markedRef = useRef<string | null>(null);

  // Opening an unread inquiry marks it as read.
  useEffect(() => {
    if (inquiry && !inquiry.is_read && markedRef.current !== inquiry.id) {
      markedRef.current = inquiry.id;
      update.mutate({ id: inquiry.id, patch: { is_read: true } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inquiry?.id, inquiry?.is_read]);

  const details = useMemo(
    () => Object.entries(inquiry?.details ?? {}).filter(([, v]) => v !== "" && v !== null && v !== undefined),
    [inquiry],
  );
  const replySubject = encodeURIComponent(`Re: ${inquiry?.subject || "Your inquiry to Matka & Me Threads"}`);

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col gap-0">
        <SheetHeader className="border-b px-6 py-5 text-left">
          <SheetTitle className="font-body text-lg">{inquiry?.name ?? "Inquiry"}</SheetTitle>
          <SheetDescription>
            {inquiry ? `${INQUIRY_TYPE_LABELS[inquiry.type]} · ${formatDate(inquiry.created_at, true)}` : " "}
          </SheetDescription>
        </SheetHeader>

        {isLoading && !inquiry ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner />
          </div>
        ) : error || !inquiry ? (
          <div className="p-6">
            <ErrorState message={error ? friendlyError(error) : "This inquiry no longer exists."} />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="min-w-0 break-all">
                  <a href={`mailto:${inquiry.email}`} className="text-primary hover:underline">
                    {inquiry.email}
                  </a>
                </dd>
                {inquiry.phone && (
                  <>
                    <dt className="text-muted-foreground">Phone</dt>
                    <dd>
                      <a href={`tel:${inquiry.phone.replace(/[^\d+]/g, "")}`} className="text-primary hover:underline">
                        {inquiry.phone}
                      </a>
                    </dd>
                  </>
                )}
                {inquiry.subject && (
                  <>
                    <dt className="text-muted-foreground">Subject</dt>
                    <dd>{inquiry.subject}</dd>
                  </>
                )}
                {details.map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-muted-foreground">{humanize(k)}</dt>
                    <dd className="whitespace-pre-wrap break-words">{String(v)}</dd>
                  </div>
                ))}
              </dl>

              <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Message</h3>
                <div className="whitespace-pre-wrap break-words rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed">
                  {inquiry.message || <span className="text-muted-foreground">(no message)</span>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="inq-status" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Status
                </label>
                <Select value={inquiry.status} onValueChange={(v) => onStatus(inquiry, v as InquiryStatus)} disabled={updating}>
                  <SelectTrigger id="inq-status" className="max-w-[220px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(INQUIRY_STATUS_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t bg-muted/40 px-6 py-4">
              <Button asChild>
                <a href={`mailto:${inquiry.email}?subject=${replySubject}`}>
                  <Reply className="mr-1.5 h-4 w-4" /> Reply by email
                </a>
              </Button>
              {inquiry.phone && (
                <Button variant="outline" asChild>
                  <a href={`tel:${inquiry.phone.replace(/[^\d+]/g, "")}`}>
                    <Phone className="mr-1.5 h-4 w-4" /> Call
                  </a>
                </Button>
              )}
              <Button variant="outline" onClick={() => onToggleRead(inquiry)} disabled={updating}>
                {inquiry.is_read ? <Mail className="mr-1.5 h-4 w-4" /> : <MailOpen className="mr-1.5 h-4 w-4" />}
                Mark {inquiry.is_read ? "unread" : "read"}
              </Button>
              <Button variant="ghost" className="ml-auto text-destructive hover:text-destructive" onClick={() => onDelete(inquiry)}>
                <Trash2 className="mr-1.5 h-4 w-4" /> Delete
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

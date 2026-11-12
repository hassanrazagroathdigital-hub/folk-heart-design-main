import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, HelpCircle, Inbox, LayoutGrid, Mail, ShoppingBag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StarterContentImport } from "@/components/admin/StarterContentImport";
import { EmptyState, ErrorState, PageHeader, Panel, Pill, StatusPill } from "@/components/admin/ui";
import { useDashboardStats } from "@/lib/cms/admin";
import { friendlyError } from "@/lib/cms/errors";
import { INQUIRY_TYPE_LABELS } from "@/lib/cms/types";
import { formatDate } from "@/lib/cms/utils";
import { cn } from "@/lib/utils";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  to,
  highlight,
}: {
  label: string;
  value: number | undefined;
  sub?: string;
  icon: typeof ShoppingBag;
  to: string;
  highlight?: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "group rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        highlight && "border-primary/40",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </div>
      {value === undefined ? (
        <Skeleton className="mt-3 h-8 w-16" />
      ) : (
        <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
      )}
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </Link>
  );
}

export default function Dashboard() {
  const { data, isLoading, error, refetch } = useDashboardStats();
  const isEmpty = !!data && data.products.total === 0 && data.categories.total === 0 && data.faqs.total === 0;
  // Once shown, keep the import panel mounted so a background refetch can't hide it mid-import.
  const [showImport, setShowImport] = useState(false);
  useEffect(() => {
    if (isEmpty && !showImport) setShowImport(true);
  }, [isEmpty, showImport]);

  return (
    <>
      <PageHeader title="Dashboard" description="An overview of your website content and messages." />

      {error ? (
        <ErrorState message={friendlyError(error)} onRetry={() => void refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 [&>*]:min-w-0">
            <StatCard
              label="Products"
              value={data?.products.total}
              sub={data ? `${data.products.published} published · ${data.products.drafts} drafts` : undefined}
              icon={ShoppingBag}
              to="/admin/products"
            />
            <StatCard
              label="Collections"
              value={data?.categories.total}
              sub={data ? `${data.categories.published} published` : undefined}
              icon={LayoutGrid}
              to="/admin/collections"
            />
            <StatCard
              label="FAQs"
              value={data?.faqs.total}
              sub={data ? `${data.faqs.published} published` : undefined}
              icon={HelpCircle}
              to="/admin/faqs"
            />
            <StatCard
              label="Unread inquiries"
              value={data?.inquiries.unread}
              sub={data ? `${data.inquiries.total} total · ${data.inquiries.open} open` : undefined}
              icon={Inbox}
              to="/admin/inquiries"
              highlight={!!data?.inquiries.unread}
            />
          </div>

          {showImport && (
            <div className="mt-6">
              <StarterContentImport variant="empty" onFinished={() => setShowImport(false)} />
            </div>
          )}

          <div className="mt-6 grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
            <Panel>
              <div className="flex items-center justify-between border-b px-5 py-4">
                <h2 className="text-sm font-semibold">Latest inquiries</h2>
                <Link to="/admin/inquiries" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {isLoading ? (
                <ListSkeleton />
              ) : data?.recentInquiries.length ? (
                <ul className="divide-y">
                  {data.recentInquiries.map((i) => (
                    <li key={i.id}>
                      <Link to={`/admin/inquiries?open=${i.id}`} className="flex items-start gap-3 px-5 py-3 hover:bg-muted/50">
                        <span
                          className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", i.is_read ? "bg-transparent" : "bg-primary")}
                          aria-label={i.is_read ? undefined : "Unread"}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className={cn("truncate text-sm", !i.is_read && "font-semibold")}>{i.name}</span>
                            <span className="shrink-0 text-xs text-muted-foreground">{formatDate(i.created_at)}</span>
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {INQUIRY_TYPE_LABELS[i.type]} · {i.subject || i.message || "(no message)"}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState icon={Mail} title="No inquiries yet" description="Messages from your website forms will appear here." />
              )}
            </Panel>

            <Panel>
              <div className="border-b px-5 py-4">
                <h2 className="text-sm font-semibold">Recently updated content</h2>
              </div>
              {isLoading ? (
                <ListSkeleton />
              ) : data?.recentContent.length ? (
                <ul className="divide-y">
                  {data.recentContent.map((c) => (
                    <li key={`${c.kind}-${c.id}`}>
                      <Link to={c.href} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50">
                        <Pill>{c.kind}</Pill>
                        <span className="min-w-0 flex-1 truncate text-sm">{c.title}</span>
                        <span className="hidden sm:inline"><StatusPill published={c.published} /></span>
                        <span className="shrink-0 text-xs text-muted-foreground">{formatDate(c.updated_at)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState icon={ShoppingBag} title="No content yet" description="Products, collections and FAQs you add will show up here." />
              )}
            </Panel>
          </div>
        </>
      )}

    </>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3 p-5" aria-busy="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </div>
  );
}

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface TableContext {
  /** True when rows are in their saved display order (so reorder buttons make sense). */
  inDisplayOrder: boolean;
}

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T, ctx: TableContext) => ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
  /** Hide on small screens to keep the table usable on phones. */
  hideBelow?: "sm" | "md" | "lg";
}

interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string;
  searchText?: (row: T) => string;
  searchPlaceholder?: string;
  /** Extra filter controls rendered next to search. */
  toolbar?: ReactNode;
  /** Column key that represents the saved display order. */
  orderKey?: string;
  initialSort?: { key: string; dir: "asc" | "desc" };
  pageSize?: number;
  /** Shown when there are no rows at all. */
  empty: ReactNode;
  /** Whether page-level filters are active (disables reordering). */
  filtered?: boolean;
  onRowClick?: (row: T) => void;
}

const hideCls = { sm: "hidden sm:table-cell", md: "hidden md:table-cell", lg: "hidden lg:table-cell" } as const;

export function DataTable<T>({
  rows,
  columns,
  getRowId,
  searchText,
  searchPlaceholder = "Search…",
  toolbar,
  orderKey,
  initialSort,
  pageSize = 20,
  empty,
  filtered = false,
  onRowClick,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState(initialSort ?? (orderKey ? { key: orderKey, dir: "asc" as const } : null));
  const [page, setPage] = useState(1);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = q && searchText ? rows.filter((r) => searchText(r).toLowerCase().includes(q)) : rows;
    const col = sort && columns.find((c) => c.key === sort.key);
    if (col?.sortValue) {
      const dir = sort!.dir === "asc" ? 1 : -1;
      out = [...out].sort((a, b) => {
        const av = col.sortValue!(a);
        const bv = col.sortValue!(b);
        if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
        return String(av).localeCompare(String(bv), undefined, { sensitivity: "base", numeric: true }) * dir;
      });
    }
    return out;
  }, [rows, query, sort, columns, searchText]);

  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);
  const pageRows = visible.slice((page - 1) * pageSize, page * pageSize);

  const ctx: TableContext = {
    inDisplayOrder: !!orderKey && sort?.key === orderKey && sort.dir === "asc" && !query.trim() && !filtered,
  };

  const toggleSort = (key: string) => {
    setPage(1);
    setSort((s) => (s?.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  };

  return (
    <div>
      {(searchText || toolbar) && (
        <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center">
          {searchText && (
            <div className="relative sm:max-w-xs w-full">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="pl-8 h-9"
              />
            </div>
          )}
          {toolbar && <div className="flex flex-wrap gap-2">{toolbar}</div>}
        </div>
      )}

      {rows.length === 0 ? (
        empty
      ) : visible.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-muted-foreground">No results match your search or filters.</div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {columns.map((c) => (
                  <TableHead key={c.key} className={cn("whitespace-nowrap h-10 text-xs", c.hideBelow && hideCls[c.hideBelow], c.className)}>
                    {c.sortValue ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(c.key)}
                        className="inline-flex items-center gap-1 font-medium hover:text-foreground"
                        aria-label={`Sort by ${typeof c.header === "string" ? c.header : c.key}`}
                      >
                        {c.header}
                        {sort?.key === c.key ? (
                          sort.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-40" />
                        )}
                      </button>
                    ) : (
                      c.header
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((row) => (
                <TableRow
                  key={getRowId(row)}
                  className={cn(onRowClick && "cursor-pointer")}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((c) => (
                    <TableCell key={c.key} className={cn("py-2.5", c.hideBelow && hideCls[c.hideBelow], c.className)}>
                      {c.cell(row, ctx)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {visible.length > pageSize && (
        <Pager page={page} pageCount={pageCount} total={visible.length} pageSize={pageSize} onPage={setPage} />
      )}
    </div>
  );
}

export function Pager({
  page,
  pageCount,
  total,
  pageSize,
  onPage,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
}) {
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="flex items-center justify-between gap-3 border-t px-4 py-3 text-sm">
      <span className="text-muted-foreground">
        {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="tabular-nums text-muted-foreground">
          {page} / {pageCount}
        </span>
        <Button variant="outline" size="sm" onClick={() => onPage(page + 1)} disabled={page >= pageCount} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

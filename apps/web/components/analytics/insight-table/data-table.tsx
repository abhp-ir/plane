/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  Table as TanstackTable,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/blocks/empty-state";
import { CloseOutline, SearchOutline } from "@makeplane/propel/icons";
// plane package imports
import { Table, TableBody, TableHeader, TableRow } from "@makeplane/propel/components/table";
import { TableCell, TableHead } from "@makeplane/propel/elements/table";
import { cn } from "@plane/utils";
// plane web components

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder: string;
  actions?: (table: TanstackTable<TData>) => React.ReactNode;
}

export function DataTable<TData, TValue>({ columns, data, searchPlaceholder, actions }: DataTableProps<TData, TValue>) {
  const [rowSelection, _setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, _setSorting] = React.useState<SortingState>([]);
  const { t } = useTranslation();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const searchTriggerRef = React.useRef<HTMLButtonElement>(null);
  const wasSearchOpen = React.useRef(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  React.useEffect(() => {
    if (isSearchOpen) inputRef.current?.focus();
    else if (wasSearchOpen.current) searchTriggerRef.current?.focus();
    wasSearchOpen.current = isSearchOpen;
  }, [isSearchOpen]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const closeSearch = () => {
    const columnId = table.getHeaderGroups()?.[0]?.headers?.[0]?.id;
    if (columnId) table.getColumn(columnId)?.setFilterValue("");
    setIsSearchOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex w-full flex-wrap items-center justify-between gap-3">
        <div className="relative flex max-w-[300px] items-center gap-4">
          {table.getHeaderGroups()?.[0]?.headers?.[0]?.id && (
            <div className="flex items-center gap-2 text-13 whitespace-nowrap text-placeholder">
              {searchPlaceholder}
            </div>
          )}
          {!isSearchOpen && (
            <button
              type="button"
              ref={searchTriggerRef}
              aria-label={t("common.search.label")}
              className="-me-5 grid place-items-center rounded-sm p-2 text-placeholder hover:bg-layer-1"
              onClick={() => {
                setIsSearchOpen(true);
              }}
            >
              <SearchOutline className="h-3.5 w-3.5" />
            </button>
          )}
          <div
            className={cn(
              "me-auto flex w-0 items-center justify-start gap-1 overflow-hidden rounded-md border border-transparent bg-surface-1 text-placeholder opacity-0 transition-[width] ease-linear",
              {
                "w-64 border-subtle px-2.5 py-1.5 opacity-100": isSearchOpen,
              }
            )}
          >
            <SearchOutline className="h-3.5 w-3.5" />
            <input
              ref={inputRef}
              className="w-full max-w-[234px] border-none bg-transparent text-13 text-primary placeholder:text-placeholder focus:outline-none"
              placeholder={t("common.search.label")}
              aria-label={t("common.search.label")}
              tabIndex={isSearchOpen ? 0 : -1}
              value={
                (table.getColumn(table.getHeaderGroups()?.[0]?.headers?.[0]?.id)?.getFilterValue() as
                  | string
                  | undefined) ?? ""
              }
              onChange={(e) => {
                const columnId = table.getHeaderGroups()?.[0]?.headers?.[0]?.id;
                if (columnId) table.getColumn(columnId)?.setFilterValue(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setIsSearchOpen(true);
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  e.stopPropagation();
                  closeSearch();
                }
              }}
            />
            {isSearchOpen && (
              <button type="button" aria-label={t("close")} className="grid place-items-center" onClick={closeSearch}>
                <CloseOutline className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
        {actions && <div>{actions(table)}</div>}
      </div>

      <div className="rounded-md">
        <Table variant="table">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    variant="table"
                    pinned="none"
                    render={<th className="whitespace-nowrap" />}
                  >
                    {header.isPlaceholder
                      ? null
                      : (flexRender(header.column.columnDef.header, header.getContext()) as any)}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} variant="table" pinned="none" padding="cell">
                      {flexRender(cell.column.columnDef.cell, cell.getContext()) as any}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} variant="table" pinned="none" padding="trigger">
                  <EmptyStateCompact
                    assetKey="unknown"
                    assetClassName="size-20"
                    rootClassName="border border-subtle px-5 py-10 md:py-20 md:px-20"
                    title={t("workspace_empty_state.analytics_work_items.title")}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

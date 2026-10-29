/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
// icons
import { CloseOutline, FilterOutline, SearchOutline } from "@makeplane/propel/icons";
import { useOutsideClickDetector } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
// plane helpers
// helpers
import { cn } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useProjectView } from "@/hooks/store/use-project-view";
import { FiltersDropdown } from "../issues/issue-layouts/filters";
import { ViewFiltersSelection } from "./filters/filter-selection";
import { ViewOrderByDropdown } from "./filters/order-by";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Icon } from "@makeplane/propel/components/icon";

export const ViewListHeader = observer(function ViewListHeader() {
  // translation
  const { t } = useTranslation();
  // states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // refs
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTriggerRef = useRef<HTMLButtonElement>(null);
  const wasSearchOpen = useRef(isSearchOpen);
  const restoreSearchFocus = useRef(false);
  useEffect(() => {
    if (isSearchOpen && !wasSearchOpen.current) inputRef.current?.focus();
    else if (!isSearchOpen && restoreSearchFocus.current) searchTriggerRef.current?.focus();
    wasSearchOpen.current = isSearchOpen;
    restoreSearchFocus.current = false;
  }, [isSearchOpen]);
  const closeSearch = () => {
    restoreSearchFocus.current = true;
    setIsSearchOpen(false);
  };
  // store hooks
  const { filters, updateFilters } = useProjectView();
  const {
    project: { projectMemberIds },
  } = useMember();

  // handlers
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (filters?.searchQuery && filters?.searchQuery.trim() !== "") {
        updateFilters("searchQuery", "");
      } else {
        closeSearch();
      }
    }
  };

  // outside click detector hook
  useOutsideClickDetector(inputRef, () => {
    if (isSearchOpen && filters?.searchQuery.trim() === "") setIsSearchOpen(false);
  });

  useEffect(() => {
    if (filters?.searchQuery.trim() !== "") setIsSearchOpen(true);
  }, [filters?.searchQuery]);

  return (
    <div className="flex h-full items-center gap-2">
      <div className="flex items-center">
        {!isSearchOpen && (
          <IconButton
            ref={searchTriggerRef}
            variant="ghost"
            size="md"
            render={<button type="button" className="-me-1" />}
            onClick={() => {
              setIsSearchOpen(true);
            }}
            icon={<Icon icon={SearchOutline} />}
            aria-label={t("common.search.label")}
          />
        )}
        <div
          className={cn(
            "ms-auto flex w-0 items-center justify-start gap-1 overflow-hidden rounded-md border border-transparent bg-surface-1 text-placeholder opacity-0 transition-[width] ease-linear",
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
            value={filters?.searchQuery ?? ""}
            onChange={(e) => updateFilters("searchQuery", e.target.value)}
            onKeyDown={handleInputKeyDown}
          />
          {isSearchOpen && (
            <button
              type="button"
              aria-label={t("close")}
              className="grid place-items-center"
              onClick={() => {
                updateFilters("searchQuery", "");
                closeSearch();
              }}
            >
              <CloseOutline className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      <div className="hidden items-center gap-2 md:flex">
        <ViewOrderByDropdown
          sortBy={filters.sortBy}
          sortKey={filters.sortKey}
          onChange={(val) => {
            if (val.key) updateFilters("sortKey", val.key);
            if (val.order) updateFilters("sortBy", val.order);
          }}
        />
        <FiltersDropdown
          icon={<FilterOutline className="h-3 w-3" />}
          title={t("common.filters")}
          placement="bottom-end"
          isFiltersApplied={false}
        >
          <ViewFiltersSelection
            filters={filters}
            handleFiltersUpdate={updateFilters}
            memberIds={projectMemberIds ?? undefined}
          />
        </FiltersDropdown>
      </div>
    </div>
  );
});

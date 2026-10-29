/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { CloseOutline, FilterOutline, SearchOutline } from "@makeplane/propel/icons";
// plane imports
import { useOutsideClickDetector } from "@plane/hooks";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Icon } from "@makeplane/propel/components/icon";
import { useTranslation } from "@plane/i18n";
import type { TCycleFilters } from "@plane/types";
import { cn, calculateTotalFilters } from "@plane/utils";
// components
import { FiltersDropdown } from "@/components/issues/issue-layouts/filters";
// hooks
import { useCycleFilter } from "@/hooks/store/use-cycle-filter";
// local imports
import { CycleFiltersSelection } from "./dropdowns";

type Props = {
  projectId: string;
};

export const CyclesViewHeader = observer(function CyclesViewHeader(props: Props) {
  const { projectId } = props;
  // refs
  const inputRef = useRef<HTMLInputElement>(null);
  // hooks
  const { currentProjectFilters, searchQuery, updateFilters, updateSearchQuery } = useCycleFilter();
  const { t } = useTranslation();
  // states
  const [isSearchOpen, setIsSearchOpen] = useState(searchQuery !== "");
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
  // outside click detector hook
  useOutsideClickDetector(inputRef, () => {
    if (isSearchOpen && searchQuery.trim() === "") setIsSearchOpen(false);
  });

  const handleFilters = useCallback(
    (key: keyof TCycleFilters, value: string | string[]) => {
      if (!projectId) return;
      const newValues = currentProjectFilters?.[key] ?? [];

      if (Array.isArray(value))
        value.forEach((val) => {
          if (!newValues.includes(val)) newValues.push(val);
          else newValues.splice(newValues.indexOf(val), 1);
        });
      else {
        if (currentProjectFilters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
        else newValues.push(value);
      }

      updateFilters(projectId, { [key]: newValues });
    },
    [currentProjectFilters, projectId, updateFilters]
  );

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (searchQuery && searchQuery.trim() !== "") updateSearchQuery("");
      else {
        closeSearch();
      }
    }
  };

  const isFiltersApplied = calculateTotalFilters(currentProjectFilters ?? {}) !== 0;

  useEffect(() => {
    if (searchQuery.trim() !== "") setIsSearchOpen(true);
  }, [searchQuery]);

  return (
    <div className="flex items-center gap-2">
      {!isSearchOpen ? (
        <IconButton
          ref={searchTriggerRef}
          variant="ghost"
          size="md"
          onClick={() => {
            setIsSearchOpen(true);
          }}
          icon={<Icon icon={SearchOutline} />}
          aria-label={t("common.search.label")}
        />
      ) : (
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
            value={searchQuery}
            onChange={(e) => updateSearchQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
          />
          {isSearchOpen && (
            <button
              type="button"
              aria-label={t("close")}
              className="grid place-items-center"
              onClick={() => {
                updateSearchQuery("");
                closeSearch();
              }}
            >
              <CloseOutline className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      <FiltersDropdown
        icon={<FilterOutline className="h-3 w-3" />}
        title={t("common.filters")}
        placement="bottom-end"
        isFiltersApplied={isFiltersApplied}
      >
        <CycleFiltersSelection filters={currentProjectFilters ?? {}} handleFiltersUpdate={handleFilters} />
      </FiltersDropdown>
    </div>
  );
});

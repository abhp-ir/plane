/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { CloseOutline, SearchOutline } from "@makeplane/propel/icons";
// hooks
import { useLabel } from "@/hooks/store/use-label";
import { useMember } from "@/hooks/store/use-member";
import { usePlatformOS } from "@/hooks/use-platform-os";
// local imports
import { FilterDate } from "./date";
import { FilterLabels } from "./labels";
import { FilterMember } from "./members";
import { FilterPriority } from "./priority";
import { FilterStatus } from "./status";

export const InboxIssueFilterSelection = observer(function InboxIssueFilterSelection() {
  // hooks
  const { isMobile } = usePlatformOS();
  const {
    project: { projectMemberIds },
  } = useMember();
  const { projectLabels } = useLabel();
  // states
  const [filtersSearchQuery, setFiltersSearchQuery] = useState("");
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!isMobile) inputRef.current?.focus();
  }, [isMobile]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="bg-surface-1 p-2.5 pb-0">
        <div className="flex items-center gap-1.5 rounded-sm border-[0.5px] border-subtle bg-surface-2 px-1.5 py-1 text-11">
          <SearchOutline className="text-placeholder" width={12} height={12} />
          <input
            type="text"
            className="w-full bg-surface-2 outline-none placeholder:text-placeholder"
            ref={inputRef}
            placeholder={t("common.search.label")}
            aria-label={t("common.search.label")}
            value={filtersSearchQuery}
            onChange={(e) => setFiltersSearchQuery(e.target.value)}
          />
          {filtersSearchQuery !== "" && (
            <button
              type="button"
              aria-label={t("power_k.search_menu.clear_search")}
              className="grid place-items-center"
              onClick={() => {
                setFiltersSearchQuery("");
                inputRef.current?.focus();
              }}
            >
              <CloseOutline className="text-tertiary" height={12} width={12} />
            </button>
          )}
        </div>
      </div>

      <div className="vertical-scrollbar scrollbar-sm h-full w-full divide-y divide-subtle-1 overflow-y-auto px-2.5">
        {/* status */}
        <div className="py-2">
          <FilterStatus searchQuery={filtersSearchQuery} />
        </div>
        {/* Priority */}
        <div className="py-2">
          <FilterPriority searchQuery={filtersSearchQuery} />
        </div>
        {/* assignees */}
        <div className="py-2">
          <FilterMember
            filterKey="assignees"
            label={t("common.assignees")}
            searchQuery={filtersSearchQuery}
            memberIds={projectMemberIds ?? []}
          />
        </div>
        {/* Created By */}
        <div className="py-2">
          <FilterMember
            filterKey="created_by"
            label={t("common.created_by")}
            searchQuery={filtersSearchQuery}
            memberIds={projectMemberIds ?? []}
          />
        </div>
        {/* Labels */}
        <div className="py-2">
          <FilterLabels searchQuery={filtersSearchQuery} labels={projectLabels ?? []} />
        </div>
        {/* Created at */}
        <div className="py-2">
          <FilterDate
            filterKey="created_at"
            label={t("project_modules.order_by.created_at")}
            searchQuery={filtersSearchQuery}
          />
        </div>
        {/* Updated at */}
        <div className="py-2">
          <FilterDate filterKey="updated_at" label={t("common.updated_at")} searchQuery={filtersSearchQuery} />
        </div>
      </div>
    </div>
  );
});

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { ISSUE_PRIORITIES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { PriorityIcon } from "@plane/blocks/icons";
import type { TIssuePriorities } from "@plane/types";
// plane constants
// components
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters";
import { formatFilterCount } from "@/helpers/filter-labels";
// hooks
import { useProjectInbox } from "@/hooks/store/use-project-inbox";

type Props = {
  searchQuery: string;
};

export const FilterPriority = observer(function FilterPriority(props: Props) {
  const { searchQuery } = props;
  // hooks
  const { t, currentLocale } = useTranslation();
  const { inboxFilters, handleInboxIssueFilters } = useProjectInbox();
  // states
  const [previewEnabled, setPreviewEnabled] = useState(true);
  // derived values
  const filterValue = inboxFilters?.priority || [];
  const appliedFiltersCount = filterValue?.length ?? 0;
  const priorityLabel = (key: TIssuePriorities) => t(key === "none" ? "common.none" : `issue.priority.${key}`);
  const filteredOptions = ISSUE_PRIORITIES.filter((priority) =>
    [priorityLabel(priority.key), priority.title].some((label) =>
      label.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleFilterValue = (value: TIssuePriorities): TIssuePriorities[] =>
    filterValue?.includes(value) ? filterValue.filter((v) => v !== value) : [...filterValue, value];

  return (
    <>
      <FilterHeader
        title={`${t("common.priority")}${appliedFiltersCount > 0 ? ` (${formatFilterCount(appliedFiltersCount, currentLocale)})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((priority) => (
              <FilterOption
                key={priority.key}
                isChecked={filterValue?.includes(priority.key) ?? false}
                onClick={() => handleInboxIssueFilters("priority", handleFilterValue(priority.key))}
                icon={<PriorityIcon priority={priority.key} className="h-3.5 w-3.5" />}
                title={priorityLabel(priority.key)}
              />
            ))
          ) : (
            <p className="text-11 text-placeholder italic">{t("common.search.no_matches_found")}</p>
          )}
        </div>
      )}
    </>
  );
});

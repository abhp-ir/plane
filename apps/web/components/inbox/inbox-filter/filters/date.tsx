/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { concat, uniq } from "lodash-es";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { PAST_DURATION_FILTER_OPTIONS } from "@plane/constants";
import type { TInboxIssueFilterDateKeys } from "@plane/types";
// components
import { DateFilterModal } from "@/components/core/filters/date-filter-modal";
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters";
import { formatFilterCount, getDateFilterOptionLabel } from "@/helpers/filter-labels";
// constants
// hooks
import { useProjectInbox } from "@/hooks/store/use-project-inbox";

type Props = {
  filterKey: TInboxIssueFilterDateKeys;
  label?: string;
  searchQuery: string;
};

const isDate = (date: string) => {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  return datePattern.test(date);
};

export const FilterDate = observer(function FilterDate(props: Props) {
  const { filterKey, label, searchQuery } = props;
  // hooks
  const { inboxFilters, handleInboxIssueFilters } = useProjectInbox();
  // state
  const [previewEnabled, setPreviewEnabled] = useState(true);
  const [isDateFilterModalOpen, setIsDateFilterModalOpen] = useState(false);
  // derived values
  const filterValue: string[] = inboxFilters?.[filterKey] || [];
  const { t, currentLocale } = useTranslation();
  const appliedFiltersCount = filterValue?.length ?? 0;
  const showCustom = [t("date_filters.custom"), "Custom"].some((optionLabel) =>
    optionLabel.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredOptions = PAST_DURATION_FILTER_OPTIONS.filter((d) =>
    [d.name, getDateFilterOptionLabel(d, currentLocale, t)].some((name) =>
      name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleFilterValue = (value: string): string[] => (filterValue?.includes(value) ? [] : uniq(concat(value)));

  const isCustomDateSelected = () => {
    const isValidDateSelected = filterValue?.filter((f) => isDate(f.split(";")[0])) || [];
    return isValidDateSelected.length > 0;
  };

  const handleCustomDate = () => {
    if (isCustomDateSelected()) {
      const updateAppliedFilters = filterValue?.filter((f) => !isDate(f.split(";")[0])) || [];
      handleInboxIssueFilters(filterKey, updateAppliedFilters);
    } else {
      setIsDateFilterModalOpen(true);
    }
  };

  return (
    <>
      {isDateFilterModalOpen && (
        <DateFilterModal
          handleClose={() => setIsDateFilterModalOpen(false)}
          isOpen={isDateFilterModalOpen}
          onSelect={(val) => handleInboxIssueFilters(filterKey, val)}
          title={label || t("project_modules.order_by.created_at")}
        />
      )}
      <FilterHeader
        title={`${label || t("project_modules.order_by.created_at")}${appliedFiltersCount > 0 ? ` (${formatFilterCount(appliedFiltersCount, currentLocale)})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {filteredOptions.length > 0 || showCustom ? (
            <>
              {filteredOptions.map((option) => (
                <FilterOption
                  key={option.value}
                  isChecked={filterValue?.includes(option.value) ?? false}
                  onClick={() => handleInboxIssueFilters(filterKey, handleFilterValue(option.value))}
                  title={getDateFilterOptionLabel(option, currentLocale, t)}
                  multiple={false}
                />
              ))}
              {showCustom && (
                <FilterOption
                  isChecked={isCustomDateSelected()}
                  onClick={handleCustomDate}
                  title={t("date_filters.custom")}
                  multiple={false}
                />
              )}
            </>
          ) : (
            <p className="text-11 text-placeholder italic">{t("common.search.no_matches_found")}</p>
          )}
        </div>
      )}
    </>
  );
});

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { GROUP_CHOICES, STATE_GROUPS } from "@plane/constants";
import { StateGroupIcon } from "@plane/blocks/icons";
import { useTranslation } from "@plane/i18n";
import { normalizeSearchQuery } from "@plane/utils";
// components
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  searchQuery: string;
};

export const FilterStateGroup = observer(function FilterStateGroup(props: Props) {
  const { appliedFilters, handleUpdate, searchQuery } = props;
  const { t, currentLocale } = useTranslation();

  const [itemsToRender, setItemsToRender] = useState(5);
  const [previewEnabled, setPreviewEnabled] = useState(true);

  const appliedFiltersCount = appliedFilters?.length ?? 0;

  const query = normalizeSearchQuery(searchQuery);
  const filteredOptions = Object.values(STATE_GROUPS).filter((state) =>
    [state.key, state.label, t(GROUP_CHOICES[state.key].i18n_label)].some((value) =>
      normalizeSearchQuery(value).includes(query)
    )
  );

  const handleViewToggle = () => {
    if (!filteredOptions) return;

    if (itemsToRender === filteredOptions.length) setItemsToRender(5);
    else setItemsToRender(filteredOptions.length);
  };

  return (
    <>
      <FilterHeader
        title={`${t("common.state_group")}${appliedFiltersCount > 0 ? ` (${new Intl.NumberFormat(currentLocale).format(appliedFiltersCount)})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {filteredOptions.length > 0 ? (
            <>
              {filteredOptions.slice(0, itemsToRender).map((stateGroup) => (
                <FilterOption
                  key={stateGroup.key}
                  isChecked={!!appliedFilters?.includes(stateGroup.key)}
                  onClick={() => handleUpdate(stateGroup.key)}
                  icon={<StateGroupIcon stateGroup={stateGroup.key} />}
                  title={t(GROUP_CHOICES[stateGroup.key].i18n_label)}
                />
              ))}
              {filteredOptions.length > 5 && (
                <button
                  type="button"
                  className="ms-8 text-11 font-medium text-accent-primary"
                  onClick={handleViewToggle}
                >
                  {t(itemsToRender === filteredOptions.length ? "show_less" : "show_all")}
                </button>
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

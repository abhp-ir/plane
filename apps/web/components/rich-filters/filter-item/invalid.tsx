/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import { WarningCircleOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
// plane imports
import type { TExternalFilter, TFilterProperty } from "@plane/types";
// local imports
import { FilterItemCloseButton } from "./close-button";
import { FilterItemContainer } from "./container";
import { FilterItemProperty } from "./property";
import type { IFilterItemProps } from "./root";

export const InvalidFilterItem = observer(function InvalidFilterItem<
  P extends TFilterProperty,
  E extends TExternalFilter,
>(props: IFilterItemProps<P, E>) {
  const { condition, filter, isDisabled = false, showTransition = true } = props;
  const { t } = useTranslation();

  return (
    <FilterItemContainer
      conditionValue={condition.value}
      showTransition={showTransition}
      variant="error"
      tooltipContent={t("common.filter_feedback.invalid_description")}
    >
      {/* Property section */}
      <FilterItemProperty
        conditionId={condition.id}
        icon={WarningCircleOutline}
        label={t("common.filter_feedback.invalid")}
        filter={filter}
        isDisabled={isDisabled}
      />
      {/* Remove button */}
      {!isDisabled && <FilterItemCloseButton conditionId={condition.id} filter={filter} />}
    </FilterItemContainer>
  );
});

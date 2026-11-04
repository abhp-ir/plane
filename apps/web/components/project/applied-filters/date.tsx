/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { PROJECT_CREATED_AT_FILTER_OPTIONS } from "@plane/constants";
import { CloseOutline } from "@makeplane/propel/icons";
// helpers
import { getAppliedDateFilterLabel } from "@/helpers/filter-labels";
// constants

type Props = {
  editable: boolean | undefined;
  handleRemove: (val: string) => void;
  values: string[];
};

export const AppliedDateFilters = observer(function AppliedDateFilters(props: Props) {
  const { editable, handleRemove, values } = props;
  const { t, currentLocale } = useTranslation();
  const getDateLabel = (value: string) =>
    getAppliedDateFilterLabel(value, PROJECT_CREATED_AT_FILTER_OPTIONS, currentLocale, t);

  return (
    <>
      {values.map((date) => (
        <div key={date} className="flex items-center gap-1 rounded-sm bg-layer-1 px-1.5 py-1 text-11">
          <span className="normal-case">{getDateLabel(date)}</span>
          {editable && (
            <button
              type="button"
              aria-label={`${t("aria_labels.common.remove")}: ${getDateLabel(date)}`}
              className="grid place-items-center text-tertiary hover:text-secondary"
              onClick={() => handleRemove(date)}
            >
              <CloseOutline height={10} width={10} />
            </button>
          )}
        </div>
      ))}
    </>
  );
});

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { DueDateOutline } from "@makeplane/propel/icons";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { useTranslation } from "@plane/i18n";
import { cn, renderFormattedDate } from "@plane/utils";
// helpers
import { shouldHighlightIssueDueDate } from "@/helpers/issue.helper";
// hooks
import { useStates } from "@/hooks/store/use-state";

type Props = {
  due_date: string | undefined;
  stateId: string | undefined;
  shouldHighLight?: boolean;
  shouldShowBorder?: boolean;
  dateLabel?: "start_date" | "due_date";
};

export const IssueBlockDate = observer(function IssueBlockDate(props: Props) {
  const { due_date, stateId, shouldHighLight = true, shouldShowBorder = true, dateLabel = "due_date" } = props;
  const { getStateById } = useStates();
  const { t, currentLocale } = useTranslation();

  const state = getStateById(stateId);

  const formattedDate = renderFormattedDate(due_date, undefined, currentLocale);

  return (
    <Tooltip label={`${t(dateLabel)}: ${formattedDate ?? t("common.none")}`}>
      <div
        className={cn("flex h-full items-center gap-1 rounded-sm px-2.5 py-1 text-11 text-primary", {
          "text-danger-primary": shouldHighLight && due_date && shouldHighlightIssueDueDate(due_date, state?.group),
          "border-[0.5px] border-strong": shouldShowBorder,
        })}
      >
        <DueDateOutline className="size-3 flex-shrink-0" />
        {formattedDate ?? t("common.none")}
      </div>
    </Tooltip>
  );
});

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import { AddOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
// plane imports
import type { TIssueServiceType } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";

type Props = {
  /** Custom triggers must forward native button props to their button. */
  customButton?: React.ReactElement<React.ComponentPropsWithRef<"button">>;
  disabled?: boolean;
  issueServiceType: TIssueServiceType;
};

export const IssueLinksActionButton = observer(function IssueLinksActionButton(props: Props) {
  const { customButton, disabled = false, issueServiceType } = props;
  const { t } = useTranslation();
  // store hooks
  const { toggleIssueLinkModal } = useIssueDetail(issueServiceType);

  // handlers
  const handleOnClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
    toggleIssueLinkModal(true);
  };

  return customButton ? (
    React.cloneElement(customButton, { type: "button", onClick: handleOnClick, disabled })
  ) : (
    <button type="button" onClick={handleOnClick} disabled={disabled} aria-label={t("issue.add.link")}>
      <AddOutline className="h-4 w-4" />
    </button>
  );
});

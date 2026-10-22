/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
// plane-i18n
import { i18nInstance, Trans, useTranslation } from "@plane/i18n";
// types
import type { TIssueServiceType } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
// ui
import { ConfirmDialog } from "@plane/blocks/dialog";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// types
import type { TAttachmentOperations } from "../issue-detail-widgets/attachments/helper";

export type TAttachmentOperationsRemoveModal = Pick<TAttachmentOperations, "remove">;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  attachmentId: string;
  attachmentOperations: TAttachmentOperationsRemoveModal;
  issueServiceType?: TIssueServiceType;
};

export const IssueAttachmentDeleteModal = observer(function IssueAttachmentDeleteModal(props: Props) {
  const { t, currentLocale } = useTranslation();
  const { isOpen, onClose, attachmentId, attachmentOperations, issueServiceType = EIssueServiceType.ISSUES } = props;
  // states
  const [loader, setLoader] = useState(false);

  // store hooks
  const {
    attachment: { getAttachmentById },
  } = useIssueDetail(issueServiceType);

  // derived values
  const attachment = attachmentId ? getAttachmentById(attachmentId) : undefined;

  // handlers
  const handleClose = () => {
    onClose();
    setLoader(false);
  };

  const handleDeletion = async (assetId: string) => {
    setLoader(true);
    try {
      await attachmentOperations.remove(assetId);
    } catch (error) {
      // the operation reports its own failures; never leave the rejection unhandled
      console.error(error);
    } finally {
      handleClose();
    }
  };

  if (!attachment) return <></>;
  return (
    <ConfirmDialog
      handleClose={handleClose}
      handleSubmit={() => handleDeletion(attachment.id)}
      isSubmitting={loader}
      isOpen={isOpen}
      title={t("attachment.delete")}
      content={
        <Trans
          i18n={i18nInstance}
          t={i18nInstance.getFixedT(currentLocale)}
          i18nKey="attachment.delete_confirmation"
          components={{ file: <bdi className="font-bold">{attachment.attributes.name}</bdi> }}
        />
      }
    />
  );
});

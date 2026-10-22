/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { CloseOutline, WarningCircleOutline } from "@makeplane/propel/icons";
// ui
import { Tooltip } from "@makeplane/propel/components/tooltip";
import {
  convertBytesToSize,
  getFileExtension,
  getFileName,
  getFileURL,
  renderFormattedDate,
  truncateText,
} from "@plane/utils";
// icons
//
import { getFileIcon } from "@/components/icons";
// components
import { IssueAttachmentDeleteModal } from "@/components/issues/attachment/delete-attachment-modal";
// helpers
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useMember } from "@/hooks/store/use-member";
import { usePlatformOS } from "@/hooks/use-platform-os";
// types
import type { TAttachmentHelpers } from "../issue-detail-widgets/attachments/helper";

type TAttachmentOperationsRemoveModal = Exclude<TAttachmentHelpers, "create">;

type TIssueAttachmentsDetail = {
  attachmentId: string;
  attachmentHelpers: TAttachmentOperationsRemoveModal;
  disabled?: boolean;
};

export const IssueAttachmentsDetail = observer(function IssueAttachmentsDetail(props: TIssueAttachmentsDetail) {
  const { t, currentLocale } = useTranslation();
  // props
  const { attachmentId, attachmentHelpers, disabled } = props;
  // store hooks
  const { getUserDetails } = useMember();
  const {
    attachment: { getAttachmentById },
  } = useIssueDetail();
  // state
  const [isDeleteIssueAttachmentModalOpen, setIsDeleteIssueAttachmentModalOpen] = useState(false);
  // derived values
  const attachment = attachmentId ? getAttachmentById(attachmentId) : undefined;
  const fileName = getFileName(attachment?.attributes.name ?? "");
  const fileExtension = getFileExtension(attachment?.attributes.name ?? "");
  const fileIcon = getFileIcon(fileExtension, 28);
  const fileURL = getFileURL(attachment?.asset_url ?? "");
  // hooks
  const { isMobile } = usePlatformOS();

  if (!attachment) return <></>;

  return (
    <>
      {isDeleteIssueAttachmentModalOpen && (
        <IssueAttachmentDeleteModal
          isOpen={isDeleteIssueAttachmentModalOpen}
          onClose={() => setIsDeleteIssueAttachmentModalOpen(false)}
          attachmentOperations={attachmentHelpers.operations}
          attachmentId={attachmentId}
        />
      )}
      <div className="flex h-[60px] items-center justify-between gap-1 rounded-md border-[2px] border-subtle bg-surface-1 px-4 py-2 text-13">
        <a href={fileURL ?? ""} target="_blank" rel="noopener noreferrer">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7">{fileIcon}</div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Tooltip label={attachment.attributes.name} layout="stacked" disabled={isMobile}>
                  <span className="text-13">
                    <bdi>{truncateText(`${fileName}`, 10)}</bdi>
                  </span>
                </Tooltip>
                <Tooltip
                  label={t("attachment.uploaded_by_on", {
                    actor: `\u2068${getUserDetails(attachment.created_by)?.display_name ?? t("unknown_user")}\u2069`,
                    date: `\u2068${renderFormattedDate(attachment.created_at, undefined, currentLocale)}\u2069`,
                  })}
                  layout="stacked"
                  disabled={isMobile}
                >
                  <span>
                    <WarningCircleOutline className="h-3 w-3" />
                  </span>
                </Tooltip>
              </div>

              <div className="flex items-center gap-3 text-11 text-secondary">
                <span>{fileExtension.toUpperCase()}</span>
                <span>{convertBytesToSize(attachment.attributes.size, currentLocale)}</span>
              </div>
            </div>
          </div>
        </a>

        {!disabled && (
          <button
            type="button"
            aria-label={t("attachment.delete")}
            onClick={() => setIsDeleteIssueAttachmentModalOpen(true)}
          >
            <CloseOutline className="h-4 w-4 text-secondary hover:text-primary" />
          </button>
        )}
      </div>
    </>
  );
});

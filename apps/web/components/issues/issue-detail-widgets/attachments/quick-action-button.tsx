/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useCallback, useState } from "react";
import { observer } from "mobx-react";
import type { FileRejection } from "react-dropzone";
import { useDropzone } from "react-dropzone";
import { AddOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
// plane imports
import { setToast } from "@plane/blocks/toast";
import type { TIssueServiceType } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// plane web hooks
import { useFileSize } from "@/hooks/use-file-size";
// local imports
import { useAttachmentOperations } from "./helper";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  /** Custom triggers must forward native button props and ref to their button. */
  customButton?: React.ReactElement<React.ComponentPropsWithRef<"button">>;
  disabled?: boolean;
  issueServiceType: TIssueServiceType;
};

export const IssueAttachmentActionButton = observer(function IssueAttachmentActionButton(props: Props) {
  const { workspaceSlug, projectId, issueId, customButton, disabled = false, issueServiceType } = props;
  const { t, currentLocale } = useTranslation();
  // state
  const [isLoading, setIsLoading] = useState(false);
  // store hooks
  const { setLastWidgetAction, fetchActivities } = useIssueDetail(issueServiceType);
  // file size
  const { maxFileSize } = useFileSize();
  // operations
  const { operations: attachmentOperations } = useAttachmentOperations(
    workspaceSlug,
    projectId,
    issueId,
    issueServiceType
  );
  // handlers
  const handleFetchPropertyActivities = useCallback(() => {
    fetchActivities(workspaceSlug, projectId, issueId);
  }, [fetchActivities, workspaceSlug, projectId, issueId]);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      const totalAttachedFiles = acceptedFiles.length + rejectedFiles.length;

      if (rejectedFiles.length === 0) {
        const currentFile: File = acceptedFiles[0];
        if (!currentFile || !workspaceSlug) return;

        setIsLoading(true);
        attachmentOperations
          .create(currentFile)
          .catch(() => {
            setToast({
              type: "error",
              title: t("toast.error"),
              message: t("attachment.error"),
            });
          })
          .finally(() => {
            handleFetchPropertyActivities();
            setLastWidgetAction("attachments");
            setIsLoading(false);
          });
        return;
      }

      setToast({
        type: "error",
        title: t("toast.error"),
        message:
          totalAttachedFiles > 1
            ? t("attachment.only_one_file_allowed")
            : t("attachment.file_size_limit", {
                size: new Intl.NumberFormat(currentLocale === "ua" ? "uk-UA" : currentLocale).format(
                  maxFileSize / 1024 / 1024
                ),
              }),
      });
      return;
    },
    [
      attachmentOperations,
      maxFileSize,
      workspaceSlug,
      handleFetchPropertyActivities,
      setLastWidgetAction,
      t,
      currentLocale,
    ]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    maxSize: maxFileSize,
    multiple: false,
    disabled: isLoading || disabled,
  });

  const buttonProps = getRootProps<React.ComponentPropsWithRef<"button">>({
    role: "button",
    type: "button",
    disabled: isLoading || disabled,
  });

  return (
    <div
      role="presentation"
      onClick={(e) => {
        e.stopPropagation();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") e.stopPropagation();
      }}
    >
      <input {...getInputProps({ "aria-label": t("common.attach") })} />
      {customButton ? (
        React.cloneElement(customButton, buttonProps)
      ) : (
        <button {...buttonProps} aria-label={t("common.attach")}>
          <AddOutline className="h-4 w-4" />
        </button>
      )}
    </div>
  );
});

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";

import { useTranslation } from "@plane/i18n";
import { DeleteOutline, MoreHorizontalOutline } from "@makeplane/propel/icons";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import type { TIssueServiceType } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
// ui
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
import { convertBytesToSize, getFileExtension, getFileName, getFileURL, renderFormattedDate } from "@plane/utils";
// components
//
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import { getFileIcon } from "@/components/icons";
// helpers
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useMember } from "@/hooks/store/use-member";
import { usePlatformOS } from "@/hooks/use-platform-os";

type TIssueAttachmentsListItem = {
  attachmentId: string;
  disabled?: boolean;
  issueServiceType?: TIssueServiceType;
};

export const IssueAttachmentsListItem = observer(function IssueAttachmentsListItem(props: TIssueAttachmentsListItem) {
  const { t, currentLocale } = useTranslation();
  // props
  const { attachmentId, disabled, issueServiceType = EIssueServiceType.ISSUES } = props;
  // store hooks
  const { getUserDetails } = useMember();
  const {
    attachment: { getAttachmentById },
    toggleDeleteAttachmentModal,
  } = useIssueDetail(issueServiceType);
  // derived values
  const attachment = attachmentId ? getAttachmentById(attachmentId) : undefined;
  const fileName = getFileName(attachment?.attributes.name ?? "");
  const fileExtension = getFileExtension(attachment?.attributes.name ?? "");
  const fileIcon = getFileIcon(fileExtension, 18);
  const fileURL = getFileURL(attachment?.asset_url ?? "");
  // hooks
  const { isMobile } = usePlatformOS();

  if (!attachment) return <></>;

  return (
    <>
      <div
        role="presentation"
        className="group flex h-11 w-full items-center justify-between gap-3 px-3 hover:bg-surface-2"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") e.stopPropagation();
        }}
      >
        <a
          href={fileURL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-w-0 flex-1 items-center gap-3 truncate text-start text-13"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3">{fileIcon}</div>
          <Tooltip label={`${fileName}.${fileExtension}`} layout="stacked" disabled={isMobile}>
            <p className="truncate font-medium text-secondary">
              <bdi>{`${fileName}.${fileExtension}`}</bdi>
            </p>
          </Tooltip>
          <span className="flex size-1.5 rounded-full bg-layer-1" />
          <span className="shrink-0 text-placeholder">
            {convertBytesToSize(attachment.attributes.size, currentLocale)}
          </span>
        </a>

        <div className="flex items-center gap-3">
          {attachment?.created_by && (
            <>
              <Tooltip
                label={t("attachment.uploaded_by_on", {
                  actor: `\u2068${getUserDetails(attachment.created_by)?.display_name ?? t("unknown_user")}\u2069`,
                  date: `\u2068${renderFormattedDate(attachment.created_at, undefined, currentLocale)}\u2069`,
                })}
                layout="stacked"
                disabled={isMobile}
              >
                <div className="flex items-center justify-center">
                  <ButtonAvatars userIds={attachment?.created_by} showTooltip />
                </div>
              </Tooltip>
            </>
          )}

          {/* Keep menu activation from reaching the parent upload dropzone. */}
          <div
            role="presentation"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") e.stopPropagation();
            }}
          >
            <Menu>
              {/* Icon-only trigger, so it needs an explicit accessible name. */}
              <MenuTrigger
                render={
                  <IconButton
                    variant="ghost"
                    size="sm"
                    disabled={disabled}
                    aria-label={t("aria_labels.common.more_actions")}
                    icon={<Icon icon={MoreHorizontalOutline} />}
                  />
                }
              />
              <MenuContent side="bottom" align="end">
                <MenuItem
                  icon={<Icon icon={DeleteOutline} />}
                  label={t("common.actions.delete")}
                  onClick={() => {
                    toggleDeleteAttachmentModal(attachmentId);
                  }}
                />
              </MenuContent>
            </Menu>
          </div>
        </div>
      </div>
    </>
  );
});

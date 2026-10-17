/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { CloseCircleOutline } from "@makeplane/propel/icons";
// plane imports
import { Tooltip } from "@makeplane/propel/components/tooltip";
import type { IApiToken } from "@plane/types";
import { renderLocalizedDateTime } from "@plane/utils";
import { useTranslation } from "@plane/i18n";
// components
import { DeleteApiTokenModal } from "@/components/api-token/delete-token-modal";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  token: IApiToken;
};

export function ApiTokenListItem(props: Props) {
  const { token } = props;
  // states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  // hooks
  const { isMobile } = usePlatformOS();
  const { t, currentLocale } = useTranslation();

  return (
    <>
      <DeleteApiTokenModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} tokenId={token.id} />
      <div className="group relative flex flex-col justify-center border-b border-subtle py-3">
        <Tooltip label={t("workspace_settings.settings.api_tokens.delete.title")} disabled={isMobile}>
          <button
            type="button"
            aria-label={`${t("workspace_settings.settings.api_tokens.delete.title")}: ${token.label}`}
            onClick={() => setDeleteModalOpen(true)}
            className="absolute end-4 grid size-6 place-items-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-accent-strong"
          >
            <CloseCircleOutline className="h-4 w-4 text-danger-primary" aria-hidden="true" />
          </button>
        </Tooltip>
        <div className="flex w-4/5 items-center">
          <h5 className="min-w-0 truncate text-13 font-medium" title={token.label}>
            <bdi>{token.label}</bdi>
          </h5>
          <span
            className={`${
              token.is_active ? "bg-success-subtle text-success-primary" : "bg-layer-1 text-placeholder"
            } ms-2 flex h-4 max-h-fit shrink-0 items-center rounded-xs px-2 text-11 font-medium`}
          >
            {token.is_active ? t("common.active") : t("workspace_settings.settings.api_tokens.expired")}
          </span>
        </div>
        <div className="mt-1 flex w-full flex-col justify-center">
          {token.description.trim() !== "" && (
            <p dir="auto" className="mb-1 max-w-[70%] text-13 break-words">
              {token.description}
            </p>
          )}
          <p className="mb-1 text-11 leading-6 text-placeholder">
            {token.expired_at
              ? t(
                  token.is_active
                    ? "workspace_settings.settings.api_tokens.expires_at"
                    : "workspace_settings.settings.api_tokens.expired_at",
                  renderLocalizedDateTime(token.expired_at, currentLocale)
                )
              : t(
                  token.is_active
                    ? "workspace_settings.settings.api_tokens.never_expires"
                    : "workspace_settings.settings.api_tokens.expired"
                )}
          </p>
        </div>
      </div>
    </>
  );
}

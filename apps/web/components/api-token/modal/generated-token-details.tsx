/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useRef } from "react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import { CopyOutline } from "@makeplane/propel/icons";
import { dismissToast, setToast } from "@plane/blocks/toast";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import type { IApiToken } from "@plane/types";
import {
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogHeader,
  DialogHeading,
  DialogInfo,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
import { renderLocalizedDateTime, copyTextToClipboard } from "@plane/utils";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  handleClose: () => void;
  tokenDetails: IApiToken;
};

export function GeneratedTokenDetails(props: Props) {
  const { handleClose, tokenDetails } = props;
  const { isMobile } = usePlatformOS();
  const { t, currentLocale } = useTranslation();
  const copyToast = useRef<string | null>(null);
  const copyApiToken = async (token: string) => {
    if (copyToast.current) dismissToast(copyToast.current);
    try {
      await copyTextToClipboard(token);
      copyToast.current = setToast({
        type: "success",
        title: t("success"),
        message: t("workspace_settings.token_copied"),
      });
    } catch {
      copyToast.current = setToast({
        type: "error",
        title: t("error"),
        message: t("workspace_settings.settings.webhooks.toasts.secret_key_not_copied.message"),
      });
    }
  };

  return (
    <>
      <DialogMain>
        <DialogHeader>
          <DialogHeading>
            <DialogTitle>{t("workspace_settings.key_created")}</DialogTitle>
            <DialogDescription>{t("workspace_settings.copy_key")}</DialogDescription>
          </DialogHeading>
        </DialogHeader>
        <DialogBody>
          <Tooltip label={t("workspace_settings.settings.api_tokens.copy_secret_key")} disabled={isMobile}>
            <button
              type="button"
              aria-label={t("workspace_settings.settings.api_tokens.copy_secret_key")}
              onClick={() => copyApiToken(tokenDetails.token ?? "")}
              className="flex w-full items-center justify-between gap-2 rounded-md border-[0.5px] border-subtle px-3 py-2 text-13 font-medium outline-none focus-visible:ring-2 focus-visible:ring-accent-strong"
            >
              <span dir="ltr" className="min-w-0 truncate text-start">
                {tokenDetails.token}
              </span>
              <CopyOutline className="h-4 w-4 flex-shrink-0 text-placeholder" aria-hidden="true" />
            </button>
          </Tooltip>
        </DialogBody>
      </DialogMain>
      <DialogActions>
        <DialogInfo>
          {tokenDetails.expired_at
            ? t(
                "workspace_settings.settings.api_tokens.expires_at",
                renderLocalizedDateTime(tokenDetails.expired_at, currentLocale)
              )
            : t("workspace_settings.settings.api_tokens.never_expires")}
        </DialogInfo>
        <Button
          variant="secondary"
          size="sm"
          stretch="auto"
          label={t("close")}
          onClick={() => {
            if (copyToast.current) dismissToast(copyToast.current);
            handleClose();
          }}
        />
      </DialogActions>
    </>
  );
}

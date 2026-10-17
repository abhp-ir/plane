/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { mutate } from "swr";
// plane imports
import { Dialog, DialogContent } from "@makeplane/propel/components/dialog";
import { setToast } from "@plane/blocks/toast";
import { useTranslation } from "@plane/i18n";
import { APITokenService } from "@plane/services";
import type { IApiToken } from "@plane/types";
import { renderFormattedDate, csvDownload } from "@plane/utils";
// constants
import { API_TOKENS_LIST } from "@plane/constants";
// local imports
import { CreateApiTokenForm } from "./form";
import { GeneratedTokenDetails } from "./generated-token-details";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

// services
const apiTokenService = new APITokenService();

export function CreateApiTokenModal(props: Props) {
  const { isOpen, onClose } = props;
  // states
  const [neverExpires, setNeverExpires] = useState<boolean>(false);
  const [generatedToken, setGeneratedToken] = useState<IApiToken | null | undefined>(null);
  const { t } = useTranslation();

  const handleClose = () => {
    onClose();

    setTimeout(() => {
      setNeverExpires(false);
      setGeneratedToken(null);
    }, 350);
  };

  const downloadSecretKey = (data: IApiToken) => {
    const csvData = {
      Title: data.label,
      Description: data.description,
      Expiry: data.expired_at ? (renderFormattedDate(data.expired_at)?.replace(",", " ") ?? "") : "Never expires",
      "Secret key": data.token ?? "",
    };

    csvDownload(csvData, `secret-key-${Date.now()}`);
  };

  const handleCreateToken = async (data: Partial<IApiToken>) => {
    try {
      const res = await apiTokenService.create(data);
      setGeneratedToken(res);
      downloadSecretKey(res);

      mutate<IApiToken[]>(
        API_TOKENS_LIST,
        (prevData) => {
          if (!prevData) return;

          return [res, ...prevData];
        },
        false
      );
    } catch (error) {
      setToast({
        type: "error",
        title: t("error"),
        message: t("common.errors.default.message"),
      });
      throw error;
    }
  };

  return (
    /* Dismissed only through its own buttons, matching the modal it replaces, whose `handleClose`
       was a no-op. */
    <Dialog open={isOpen} disablePointerDismissal onOpenChange={() => {}}>
      <DialogContent size="md">
        {generatedToken ? (
          <GeneratedTokenDetails handleClose={handleClose} tokenDetails={generatedToken} />
        ) : (
          <CreateApiTokenForm
            handleClose={handleClose}
            neverExpires={neverExpires}
            toggleNeverExpires={() => setNeverExpires((prevData) => !prevData)}
            onSubmit={handleCreateToken}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { i18nInstance } from "@plane/i18n";

export enum EFileError {
  INVALID_FILE_TYPE = "INVALID_FILE_TYPE",
  FILE_SIZE_TOO_LARGE = "FILE_SIZE_TOO_LARGE",
  NO_FILE_SELECTED = "NO_FILE_SELECTED",
}

type TArgs = {
  acceptedMimeTypes: string[];
  file: File;
  maxFileSize: number;
  onError: (error: EFileError, message: string) => void;
};

export const isFileValid = (args: TArgs): boolean => {
  const { acceptedMimeTypes, file, maxFileSize, onError } = args;

  if (!file) {
    onError(EFileError.NO_FILE_SELECTED, i18nInstance.t("file_upload.no_file_selected"));
    return false;
  }

  if (!acceptedMimeTypes.includes(file.type)) {
    onError(EFileError.INVALID_FILE_TYPE, i18nInstance.t("file_upload.invalid_file_type"));
    return false;
  }

  if (file.size > maxFileSize) {
    onError(
      EFileError.FILE_SIZE_TOO_LARGE,
      i18nInstance.t("attachment.file_size_limit", {
        size: new Intl.NumberFormat(i18nInstance.language === "ua" ? "uk-UA" : i18nInstance.language).format(
          maxFileSize / 1024 / 1024
        ),
      })
    );
    return false;
  }

  return true;
};

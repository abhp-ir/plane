/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export const generateFileName = (fileName: string) => {
  const date = new Date();
  const timestamp = date.getTime();

  const _fileName = getFileName(fileName);
  const nameWithoutExtension = _fileName.length > 80 ? _fileName.substring(0, 80) : _fileName;
  const extension = getFileExtension(fileName);

  return `${nameWithoutExtension}-${timestamp}.${extension}`;
};

export const getFileExtension = (filename: string) => filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);

export const getFileName = (fileName: string) => {
  const dotIndex = fileName.lastIndexOf(".");

  const nameWithoutExtension = fileName.substring(0, dotIndex);

  return nameWithoutExtension;
};

export const convertBytesToSize = (bytes: number, locale = "en") => {
  const divisor = bytes < 1024 ? 1 : bytes < 1024 * 1024 ? 1024 : 1024 * 1024;
  const unit = divisor === 1 ? "byte" : divisor === 1024 ? "kilobyte" : "megabyte";
  return new Intl.NumberFormat(locale === "ua" ? "uk-UA" : locale, {
    style: "unit",
    unit,
    unitDisplay: "long",
    maximumFractionDigits: 1,
  }).format(bytes / divisor);
};

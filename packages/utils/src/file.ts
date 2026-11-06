/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { API_BASE_URL } from "@plane/constants";

/**
 * @description combine the file path with the base URL
 * @param {string} path
 * @returns {string} final URL with the base URL
 */
export const getFileURL = (path: string): string | undefined => {
  if (!path) return undefined;
  const isValidURL = path.startsWith("http");
  if (isValidURL) return path;
  return `${API_BASE_URL}${path}`;
};

/**
 * @description this function returns the assetId from the asset source
 * @param {string} src
 * @returns {string} assetId
 */
export const getAssetIdFromUrl = (src: string): string => {
  // remove the last char if it is a slash
  if (src.charAt(src.length - 1) === "/") src = src.slice(0, -1);
  const sourcePaths = src.split("/");
  const assetUrl = sourcePaths[sourcePaths.length - 1];
  return assetUrl;
};

/**
 * @description encode image via URL to base64
 * @param {string} url
 * @returns
 */
export const getBase64Image = async (url: string): Promise<string> => {
  if (!url || typeof url !== "string") {
    throw new Error("Invalid URL provided");
  }

  // Try to create a URL object to validate the URL
  let imageURL: URL;
  try {
    imageURL = new URL(url, url.startsWith("/") ? globalThis.location?.href : undefined);
  } catch {
    throw new Error("Invalid URL format");
  }

  const apiOrigin = API_BASE_URL ? new URL(API_BASE_URL).origin : globalThis.location?.origin;
  const isPlaneAsset = imageURL.origin === apiOrigin && imageURL.pathname.startsWith("/api/assets/v2/workspaces/");
  let imageSource = imageURL.href;
  if (isPlaneAsset) {
    // Resolve the protected asset first; storage requests must never carry the Plane session.
    imageURL.searchParams.set("response_format", "json");
    const assetResponse = await fetch(imageURL.href, { credentials: "include", redirect: "error" });
    if (!assetResponse.ok) throw new Error(`Failed to fetch image: ${assetResponse.statusText}`);
    const asset: { url: string } = await assetResponse.json();
    const storageURL = new URL(asset.url);
    if (!["http:", "https:"].includes(storageURL.protocol)) throw new Error("Invalid asset URL");
    imageSource = storageURL.href;
  }
  const response = await fetch(imageSource, { credentials: isPlaneAsset ? "omit" : "same-origin" });
  // check if the response is OK
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }

  const blob = await response.blob();
  if (blob.type !== "image/svg+xml") {
    const bitmap = await createImageBitmap(blob);
    try {
      if (!["image/png", "image/jpeg", "image/jpg"].includes(blob.type)) {
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Failed to convert image for PDF");
        context.drawImage(bitmap, 0, 0);
        const png = canvas.toDataURL("image/png");
        if (!png.startsWith("data:image/png;base64,")) throw new Error("Failed to convert image for PDF");
        return png;
      }
    } finally {
      bitmap.close();
    }
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      if (reader.result) {
        resolve(reader.result as string);
      } else {
        reject(new Error("Failed to convert image to base64."));
      }
    };

    reader.addEventListener("error", () => {
      reject(new Error("Failed to read the image file."));
    });

    reader.readAsDataURL(blob);
  });
};

/**
 * @description downloads a CSV file
 * @param {Array<Array<string>> | { [key: string]: string }} data - The data to be exported to CSV
 * @param {string} name - The name of the file to be downloaded
 */
export const csvDownload = (data: Array<Array<string>> | { [key: string]: string }, name: string) => {
  const rows = Array.isArray(data) ? [...data] : [Object.keys(data), Object.values(data)];

  const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);

  const link = document.createElement("a");
  link.href = encodedUri;
  link.download = `${name}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

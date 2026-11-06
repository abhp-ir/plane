/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */
import { escape } from "lodash-es";

export function getPageExportFileName(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\p{M}_\u200c-]+/gu, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "page"
  );
}

export function getPageExportHTML(title: string, content: string) {
  return `<h1 class="page-title">${escape(title)}</h1>${content}`;
}

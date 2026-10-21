/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { normalizeSearchQuery } from "@plane/utils";
import { defaultFilter } from "cmdk";

export function filterPowerKCommand(value: string, search: string, keywords: string[] = []): number {
  if (value === "no-results") return 1;
  const query = normalizeSearchQuery(search);
  return defaultFilter(normalizeSearchQuery(value), query, keywords.map(normalizeSearchQuery)) > 0 ? 1 : 0;
}

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { DirectionProvider } from "@makeplane/propel/components/direction-provider";
import { useTranslation } from "@plane/i18n";

/** Keep portaled controls and their keyboard navigation in the document's reading direction. */
export function LocaleDirectionProvider({ children }: { children: ReactNode }) {
  const { direction } = useTranslation();
  return <DirectionProvider direction={direction}>{children}</DirectionProvider>;
}

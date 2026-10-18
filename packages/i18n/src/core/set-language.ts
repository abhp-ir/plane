/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { initPromise, i18nInstance } from "./instance";
import { FALLBACK_LANGUAGE, getRegisteredLanguage } from "../constants/language";
import type { TLanguage } from "../types";

export async function setLanguage(lng: TLanguage): Promise<void> {
  await initPromise;
  const language = getRegisteredLanguage(lng) ?? FALLBACK_LANGUAGE;
  await i18nInstance.changeLanguage(language);
}

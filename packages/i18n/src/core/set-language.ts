/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { initPromise, i18nInstance } from "./instance";
import { FALLBACK_LANGUAGE, SUPPORTED_LANGUAGES } from "../constants/language";
import type { TLanguage } from "../types";

export async function setLanguage(lng: TLanguage): Promise<void> {
  await initPromise;
  const language = SUPPORTED_LANGUAGES.find(({ value }) => value === lng)?.value ?? FALLBACK_LANGUAGE;
  await i18nInstance.changeLanguage(language);
}

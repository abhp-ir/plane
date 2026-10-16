/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { FALLBACK_LANGUAGE, LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES } from "../constants/language";
import type { TLanguage } from "../types";

export function getStoredLanguage(): TLanguage {
  if (typeof window === "undefined") return FALLBACK_LANGUAGE;
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return SUPPORTED_LANGUAGES.find(({ value }) => value === stored)?.value ?? FALLBACK_LANGUAGE;
  } catch {
    // Storage may be disabled; language selection must still work for this session.
    return FALLBACK_LANGUAGE;
  }
}

export function syncDocumentLanguage(language: string, direction: "ltr" | "rtl"): void {
  if (typeof document === "undefined") return;
  document.documentElement.lang = language;
  document.documentElement.dir = direction;
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Keep the document usable even when the browser refuses persistence.
  }
}

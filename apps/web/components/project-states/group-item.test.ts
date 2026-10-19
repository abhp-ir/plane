/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { initPromise, setLanguage, TranslationProvider } from "@plane/i18n";
import { GroupItem } from "./group-item";

vi.mock("@/components/project-states", () => ({ StateList: () => null, StateCreate: () => null }));

it.each([
  ["fa", "آغازنشده"],
  ["en", "Unstarted"],
] as const)("renders the fixed state group in %s while retaining its semantic code", async (language, label) => {
  await initPromise;
  await setLanguage(language);
  try {
    const html = renderToStaticMarkup(
      createElement(
        TranslationProvider,
        null,
        createElement(GroupItem, {
          groupKey: "unstarted",
          groupsExpanded: ["unstarted"],
          groupedStates: { unstarted: [] },
          states: [],
          stateOperationsCallbacks: {
            createState: vi.fn(),
            updateState: vi.fn(),
            moveStatePosition: vi.fn(),
            deleteState: vi.fn(),
            markStateAsDefault: vi.fn(),
          },
          isEditable: false,
          handleGroupCollapse: vi.fn(),
          handleExpand: vi.fn(),
        })
      )
    );
    expect(html).toContain(`>${label}</span>`);
    expect(html).not.toContain(">unstarted</span>");
  } finally {
    await setLanguage("en");
  }
});

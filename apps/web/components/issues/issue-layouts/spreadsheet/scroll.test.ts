// @vitest-environment jsdom
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { initPromise, setLanguage, TranslationProvider } from "@plane/i18n";
import type { IIssueDisplayFilterOptions } from "@plane/types";
import type { TSelectionHelper } from "@/hooks/use-multiple-select";
import { SpreadsheetTable } from "./spreadsheet-table";

vi.mock("@/hooks/use-issue-layout-store", () => ({
  useIssuesStore: () => ({ issues: { getIssueLoader: () => undefined } }),
}));
vi.mock("@/hooks/use-table-keyboard-navigation", () => ({ useTableKeyboardNavigation: () => vi.fn() }));
vi.mock("@/hooks/use-intersection-observer", () => ({ useIntersectionObserver: vi.fn() }));
vi.mock("../utils", () => ({ getDisplayPropertiesCount: () => 1 }));
vi.mock("./spreadsheet-header", () => ({
  SpreadsheetHeader: () => createElement("thead", null, createElement("tr", null, createElement("th", null, "Header"))),
}));
vi.mock("./issue-row", () => ({
  SpreadsheetIssueRow: ({ issueId }: { issueId: string }) =>
    createElement("tr", null, createElement("td", null, issueId)),
}));

it("keeps scroll shadows at the logical edge for negative RTL offsets and mounted direction changes", async () => {
  await initPromise;
  await setLanguage("fa");
  const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previous = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const containerRef = { current: container as unknown as HTMLTableElement };
  try {
    await act(async () =>
      root.render(
        createElement(
          TranslationProvider,
          null,
          createElement(SpreadsheetTable, {
            displayProperties: {},
            displayFilters: {} as IIssueDisplayFilterOptions,
            handleDisplayFilterUpdate: vi.fn(),
            issueIds: ["ABC-42"],
            isEstimateEnabled: false,
            quickActions: () => null,
            updateIssue: undefined,
            canEditProperties: () => false,
            portalElement: { current: null },
            containerRef,
            canLoadMoreIssues: false,
            loadMoreIssues: vi.fn(),
            spreadsheetColumnsList: [],
            selectionHelpers: {} as TSelectionHelper,
          })
        )
      )
    );
    const cell = container.querySelector("td")!;
    const header = container.querySelector("th")!;
    container.scrollLeft = -300;
    await act(async () => container.dispatchEvent(new Event("scroll")));
    expect(cell.style.boxShadow).toBe("-8px 22px 22px 10px rgba(0, 0, 0, 0.05)");
    expect(header.style.boxShadow).toBe("-8px -22px 22px 10px rgba(0, 0, 0, 0.05)");
    await act(async () => setLanguage("en"));
    expect(cell.style.boxShadow).toBe("8px 22px 22px 10px rgba(0, 0, 0, 0.05)");
    container.scrollLeft = 300;
    await act(async () => container.dispatchEvent(new Event("scroll")));
    expect(cell.style.boxShadow).toBe("8px 22px 22px 10px rgba(0, 0, 0, 0.05)");
    await act(async () => setLanguage("fa"));
    expect(cell.style.boxShadow).toBe("-8px 22px 22px 10px rgba(0, 0, 0, 0.05)");
    container.scrollLeft = 0;
    await act(async () => container.dispatchEvent(new Event("scroll")));
    expect(cell.style.boxShadow).toBe("none");
    expect(header.style.boxShadow).toBe("none");
    container.scrollLeft = 1;
    await act(async () => container.dispatchEvent(new Event("scroll")));
    expect(cell.style.boxShadow).toBe("none");
    container.scrollLeft = -1;
    await act(async () => container.dispatchEvent(new Event("scroll")));
    expect(cell.style.boxShadow).toBe("none");
    container.scrollLeft = -2;
    await act(async () => container.dispatchEvent(new Event("scroll")));
    expect(cell.style.boxShadow).toBe("-8px 22px 22px 10px rgba(0, 0, 0, 0.05)");
    expect(cell.textContent).toBe("ABC-42");
  } finally {
    await act(async () => root.unmount());
    container.remove();
    environment.IS_REACT_ACT_ENVIRONMENT = previous;
    await setLanguage("en");
  }
});

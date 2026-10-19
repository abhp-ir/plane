// @vitest-environment jsdom
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import type { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { expect, it, vi } from "vitest";
import { initPromise, setLanguage, TranslationProvider } from "@plane/i18n";
import type { TIssueMap } from "@plane/types";
import { generateCalendarData } from "@plane/utils";
import { CalendarDayTile } from "./day-tile";
import { handleDragDrop } from "./utils";

type DropTarget = Parameters<typeof dropTargetForElements>[0];
const mocks = vi.hoisted(() => ({ targets: [] as DropTarget[], quickDates: [] as string[], toast: vi.fn() }));
vi.mock("@atlaskit/pragmatic-drag-and-drop/element/adapter", () => ({
  dropTargetForElements: (target: DropTarget) => {
    mocks.targets.push(target);
    return () => {};
  },
}));
vi.mock("@plane/blocks/toast", () => ({ setToast: mocks.toast }));
vi.mock("@/components/issues/issue-layouts/utils", () => ({ highlightIssueOnDrop: vi.fn() }));
vi.mock("@/hooks/use-issue-layout-store", () => ({
  useIssuesStore: () => ({
    issues: {
      getGroupIssueCount: () => 0,
      getPaginationData: () => undefined,
      getIssueLoader: () => false,
    },
  }),
}));
vi.mock("./quick-add-issue-actions", () => ({
  CalendarQuickAddIssueActions: ({ prePopulatedData }: { prePopulatedData: { target_date: string } }) => {
    mocks.quickDates.push(prePopulatedData.target_date);
    return null;
  },
}));

it("hands canonical Jalali cell days to quick-add and existing drop actions, retaining the start-date guard", async () => {
  await initPromise;
  await setLanguage("fa");
  const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previous = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const day = Object.values(generateCalendarData(null, new Date(2025, 2, 20), 6, "fa")["y-1403"]["m-11"])
    .flatMap(Object.values)
    .find((item) => item.date.getDate() === 20 && item.date.getMonth() === 2)!;
  const handleDrop = vi.fn().mockResolvedValue(undefined);
  const render = async (startDate: string) => {
    const props = {
      date: day,
      selectedDate: day.date,
      setSelectedDate: vi.fn(),
      issuesFilterStore: { issueFilters: { displayFilters: { calendar: { layout: "month" } } } },
      issues: { issue: { project_id: "project", start_date: startDate } } as unknown as TIssueMap,
      groupedIssueIds: { "2025-03-20": [] },
      loadMoreIssues: vi.fn(),
      getPaginationData: vi.fn(),
      getGroupIssueCount: vi.fn(),
      quickActions: () => null,
      handleDragAndDrop: handleDrop,
      canEditProperties: () => true,
      enableQuickIssueCreate: true,
    } as unknown as Parameters<typeof CalendarDayTile>[0];
    await act(async () => root.render(createElement(TranslationProvider, null, createElement(CalendarDayTile, props))));
  };
  const drop = async () => {
    const target = mocks.targets.at(-1)!;
    const data = target.getData!({} as Parameters<NonNullable<DropTarget["getData"]>>[0]);
    expect(data).toEqual({ date: "2025-03-20" });
    await act(async () =>
      target.onDrop!({
        source: { data: { id: "issue", date: "2025-03-19" }, element: { id: "issue" } },
        self: { data },
      } as unknown as Parameters<NonNullable<DropTarget["onDrop"]>>[0])
    );
  };
  try {
    await render("2025-03-19");
    expect(mocks.quickDates.at(-1)).toBe("2025-03-20");
    expect(container.querySelector("time")?.textContent).toBe("۳۰");
    await drop();
    expect(handleDrop).toHaveBeenCalledExactlyOnceWith("issue", "project", "2025-03-19", "2025-03-20");
    await render("2025-03-21");
    await drop();
    expect(handleDrop).toHaveBeenCalledTimes(1);
    expect(mocks.toast).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ type: "error" }));
    await act(async () => setLanguage("en"));
    expect(container.querySelector("time")?.textContent).toBe("20");
    expect(mocks.quickDates.at(-1)).toBe("2025-03-20");
    const update = vi.fn().mockResolvedValue(undefined);
    await handleDragDrop("issue", "2025-03-19", "2025-03-20", "workspace", "project", update);
    expect(update).toHaveBeenCalledExactlyOnceWith("project", "issue", { id: "issue", target_date: "2025-03-20" });
    await handleDragDrop("issue", "2025-03-20", "2025-03-20", "workspace", "project", update);
    expect(update).toHaveBeenCalledTimes(1);
  } finally {
    await act(async () => root.unmount());
    container.remove();
    environment.IS_REACT_ACT_ENVIRONMENT = previous;
    await setLanguage("en");
  }
});

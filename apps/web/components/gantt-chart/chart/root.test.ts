// @vitest-environment jsdom
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { observable, runInAction } from "mobx";
import { expect, it, vi } from "vitest";
import { initPromise, setLanguage, TranslationProvider } from "@plane/i18n";
import { renderFormattedPayloadDate } from "@plane/utils";
import type { RootStore } from "@/store/root.store";
import { BaseTimeLineStore } from "@/store/timeline/base-timeline.store";
import { ChartViewRoot } from "./root";

const mocks = vi.hoisted(() => ({ store: undefined as BaseTimeLineStore | undefined }));
const profile = observable({ start_of_the_week: 6, working_days: null });
vi.mock("@/hooks/use-timeline-chart", () => ({ useTimeLineChartStore: () => mocks.store }));
vi.mock("@/hooks/store/user", () => ({ useUserProfile: () => ({ data: profile }) }));
vi.mock("@/components/gantt-chart", async () => {
  const { GanttChartHeader } = await import("./header");
  return {
    GanttChartHeader,
    GanttChartMainContent: ({ itemsContainerWidth }: { itemsContainerWidth: number }) =>
      createElement("div", { id: "gantt-container", "data-width": itemsContainerWidth }),
  };
});

it("regenerates mounted scales on locale/week preference changes and centers Today on the current date", async () => {
  await initPromise;
  await setLanguage("en");
  vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] });
  vi.setSystemTime(new Date(2025, 2, 20, 12));
  const store = new BaseTimeLineStore({} as RootStore);
  mocks.store = store;
  const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previous = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const button = (label: string) =>
    [...container.querySelectorAll("button")].find((item) => item.textContent === label)!;
  try {
    await act(async () =>
      root.render(
        createElement(
          TranslationProvider,
          null,
          createElement(ChartViewRoot, {
            border: false,
            title: "Items",
            loaderTitle: "Items",
            blockIds: [],
            blockUpdateHandler: () => {},
            blockToRender: () => null,
            sidebarToRender: () => null,
            enableBlockLeftResize: true,
            enableBlockRightResize: true,
            enableBlockMove: true,
            enableReorder: false,
            enableAddBlock: true,
            enableSelection: false,
            enableDependency: false,
            bottomSpacing: false,
            showAllBlocks: true,
            showToday: true,
          })
        )
      )
    );
    expect((store.renderView as { title: string }[]).some((week) => week.title.includes("Mar 2025"))).toBe(true);
    await act(async () => setLanguage("fa"));
    expect((store.renderView as { title: string }[]).map((week) => week.title).join(" | ")).toContain("اسفند ۱۴۰۳");
    expect(store.currentViewData?.data.startDate.getDay()).toBe(6);
    await act(async () =>
      runInAction(() => {
        profile.start_of_the_week = 1;
      })
    );
    expect(store.currentViewData?.data.startDate.getDay()).toBe(1);
    await act(async () => button("ماه").click());
    expect(store.currentView).toBe("month");
    expect(
      (store.renderView as { weeks: { startDate: Date }[] }).weeks.every((week) => week.startDate.getDay() === 1)
    ).toBe(true);
    vi.setSystemTime(new Date(2026, 2, 21, 12));
    await act(async () => button("امروز").click());
    expect(renderFormattedPayloadDate(store.currentViewData?.data.currentDate)).toBe("2026-03-21");
    expect(
      (store.renderView as { months: { title: string }[] }).months.some((month) => month.title === "فروردین ۱۴۰۵")
    ).toBe(true);
    expect(Number(document.querySelector<HTMLElement>("#gantt-container")!.dataset.width)).toBeGreaterThan(0);
    await act(async () => setLanguage("en"));
    expect(
      (store.renderView as { months: { title: string }[] }).months.some((month) => month.title === "March 2026")
    ).toBe(true);
    expect(store.currentViewData?.data.startDate.getDay()).toBe(1);
  } finally {
    await act(async () => root.unmount());
    const query = vi.spyOn(document, "querySelector");
    try {
      await act(async () => vi.advanceTimersByTime(100));
      expect(query).not.toHaveBeenCalledWith("#gantt-container");
    } finally {
      query.mockRestore();
      container.remove();
      environment.IS_REACT_ACT_ENVIRONMENT = previous;
      vi.useRealTimers();
      await setLanguage("en");
    }
  }
});

// @vitest-environment jsdom
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { act, createElement, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { observable, runInAction } from "mobx";
import { expect, it, vi } from "vitest";
import { initPromise, setLanguage, TranslationProvider } from "@plane/i18n";
import { renderFormattedPayloadDate } from "@plane/utils";
import { CalendarStore } from "@/store/issue/issue_calendar_view.store";
import type { IIssueRootStore } from "@/store/issue/root.store";
import { BaseCalendarRoot } from "./base-calendar-root";

const mocks = vi.hoisted(() => ({
  store: undefined as CalendarStore | undefined,
  fetch: vi.fn(),
  quickDates: [] as Date[],
}));
const filters = observable({
  displayFilters: { calendar: { layout: "month" as "month" | "week", show_weekends: true } },
});
const issues = { viewFlags: { enableQuickAdd: true, enableIssueCreation: true }, groupedIssueIds: {} };
const profile = observable({ start_of_the_week: 6, working_days: null as number[] | null });
vi.mock("@/hooks/store/use-calendar-view", () => ({ useCalendarView: () => mocks.store }));
vi.mock("@/hooks/store/use-issues", () => ({
  useIssues: () => ({ issues, issuesFilter: { issueFilters: filters }, issueMap: {} }),
}));
vi.mock("@/hooks/use-issue-layout-store", () => ({ useIssueStoreType: () => "PROJECT" }));
vi.mock("@/hooks/use-issues-actions", () => ({ useIssuesActions: () => ({ fetchIssues: mocks.fetch }) }));
vi.mock("@/hooks/store/user", () => ({
  useUserPermissions: () => ({ allowPermissions: () => true }),
  useUserProfile: () => ({ data: profile }),
}));
vi.mock("next/navigation", () => ({ useParams: () => ({ workspaceSlug: "test", projectId: "project" }) }));
vi.mock("@/hooks/use-window-size", () => ({ default: () => [1440, 1000] }));
vi.mock("../issue-layout-HOC", () => ({ IssueLayoutHOC: ({ children }: { children: ReactNode }) => children }));
vi.mock("./issue-blocks", () => ({
  CalendarIssueBlocks: ({ date }: { date: Date }) => {
    mocks.quickDates.push(date);
    return null;
  },
}));
vi.mock("@atlaskit/pragmatic-drag-and-drop-auto-scroll/element", () => ({ autoScrollForElements: () => () => {} }));

const button = (label: string) =>
  [...document.querySelectorAll<HTMLButtonElement>("button")].find(
    (item) => (item.getAttribute("aria-label") ?? item.textContent) === label
  )!;

it("updates actual mounted grid dates and fetch bounds together, and navigates the selected calendar including Today", async () => {
  await initPromise;
  await setLanguage("en");
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 2, 21, 12));
  const rootStore = {
    rootStore: { user: { userProfile: { data: profile } } },
  } as unknown as IIssueRootStore;
  const store = new CalendarStore(rootStore);
  mocks.store = store;
  store.updateCalendarFilters({ activeMonthDate: new Date(2025, 2, 20), activeWeekDate: new Date(2025, 2, 20) });
  const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previous = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const days = () =>
    [...container.querySelectorAll<HTMLTimeElement>("time[datetime]")].filter((time) => !time.closest("button"));
  const bounds = (start: string, end: string) => {
    expect(days()[0].dateTime).toBe(start);
    expect(days().at(-1)!.dateTime).toBe(end);
    expect(mocks.fetch.mock.lastCall?.[1]).toMatchObject({ after: start, before: end, groupedBy: "target_date" });
  };
  try {
    await act(async () =>
      root.render(
        createElement(TranslationProvider, null, createElement(BaseCalendarRoot, { QuickActions: () => null }))
      )
    );
    expect(button("March 2025")).toBeTruthy();
    bounds("2025-03-01", "2025-04-04");
    expect([...container.querySelectorAll("p")].filter((item) => item.textContent === "21 March, 2026")).toHaveLength(
      1
    );
    await act(async () => setLanguage("fa"));
    expect(button("اسفند ۱۴۰۳")).toBeTruthy();
    expect(days().find((time) => time.dateTime === "2025-03-20")?.textContent).toBe("۳۰");
    bounds("2025-02-15", "2025-03-21");
    const headerForDay = (day: string) =>
      days()
        .find((time) => time.dateTime === day)!
        .closest("div.group")!.firstElementChild!;
    expect(headerForDay("2025-03-20").classList.contains("bg-layer-1")).toBe(true);
    expect(headerForDay("2025-03-21").classList.contains("bg-layer-1")).toBe(true);
    expect(headerForDay("2025-03-15").classList.contains("bg-layer-1")).toBe(false);
    await act(async () => {
      runInAction(() => {
        filters.displayFilters.calendar.show_weekends = false;
      });
    });
    expect(days().every((time) => [6, 0, 1, 2, 3].includes(new Date(time.dateTime + "T00:00:00").getDay()))).toBe(true);
    expect(days()).toHaveLength(25);
    await act(async () => {
      runInAction(() => {
        profile.working_days = [6, 0, 1, 2, 3, 4];
      });
    });
    expect(days()).toHaveLength(30);
    expect(days().some((time) => time.dateTime === "2025-03-20")).toBe(true);
    expect(days().some((time) => time.dateTime === "2025-03-21")).toBe(false);
    await act(async () => {
      runInAction(() => {
        filters.displayFilters.calendar.show_weekends = true;
        profile.working_days = null;
      });
    });
    expect(mocks.quickDates.some((date) => renderFormattedPayloadDate(date) === "2025-03-20")).toBe(true);
    await act(async () => button("بعدی").click());
    expect(button("فروردین ۱۴۰۴")).toBeTruthy();
    expect(renderFormattedPayloadDate(store.calendarFilters.activeMonthDate)).toBe("2025-03-21");
    bounds("2025-03-15", "2025-04-25");
    await act(async () => button("قبلی").click());
    bounds("2025-02-15", "2025-03-21");
    await act(async () => button("اسفند ۱۴۰۳").click());
    await act(async () => button("بعدی ۱۴۰۴").click());
    expect(renderFormattedPayloadDate(store.calendarFilters.activeMonthDate)).toBe("2026-02-20");
    await act(async () => button("فروردین ۱۴۰۴").click());
    expect(renderFormattedPayloadDate(store.calendarFilters.activeMonthDate)).toBe("2025-03-21");
    await act(async () => button("امروز").click());
    expect(renderFormattedPayloadDate(store.calendarFilters.activeMonthDate)).toBe("2026-03-21");
    expect(renderFormattedPayloadDate(store.calendarFilters.activeWeekDate)).toBe("2026-03-21");
    expect(button("فروردین ۱۴۰۵")).toBeTruthy();
    await act(async () => {
      runInAction(() => {
        filters.displayFilters.calendar.layout = "week";
      });
    });
    bounds("2026-03-21", "2026-03-27");
    await act(async () => button("قبلی").click());
    bounds("2026-03-14", "2026-03-20");
    await act(async () => setLanguage("en"));
    bounds("2026-03-14", "2026-03-20");
    expect(button("March 2026")).toBeTruthy();
    await act(async () => {
      runInAction(() => {
        filters.displayFilters.calendar.layout = "month";
      });
    });
    bounds("2026-02-28", "2026-04-03");
    await act(async () => button("Next").click());
    expect(renderFormattedPayloadDate(store.calendarFilters.activeMonthDate)).toBe("2026-04-01");
    expect(button("April 2026")).toBeTruthy();
  } finally {
    runInAction(() => {
      filters.displayFilters.calendar.show_weekends = true;
      profile.working_days = null;
    });
    await act(async () => root.unmount());
    container.remove();
    environment.IS_REACT_ACT_ENVIRONMENT = previous;
    vi.useRealTimers();
    await setLanguage("en");
  }
});

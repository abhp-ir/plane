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
import type { ChartDataType } from "@plane/types";
import { monthView, quarterView, weekView } from "../../views";
import { MonthChartView } from "./month";
import { QuarterChartView } from "./quarter";
import { WeekChartView } from "./week";

const mocks = vi.hoisted(() => ({
  store: undefined as { currentViewData: ChartDataType; renderView: unknown } | undefined,
}));
const profile = observable({ start_of_the_week: 6, working_days: null as number[] | null });
vi.mock("@/hooks/use-timeline-chart", () => ({ useTimeLineChartStore: () => mocks.store }));
vi.mock("@/hooks/store/user", () => ({ useUserProfile: () => ({ data: profile }) }));

it.each(["week", "month", "quarter"] as const)(
  "renders the %s scale with real Jalali dates and independent working-day identities",
  async (view) => {
    await initPromise;
    await setLanguage("fa");
    const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
    const previous = environment.IS_REACT_ACT_ENVIRONMENT;
    environment.IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    try {
      const current = new Date(2025, 2, 21);
      const input = {
        key: view,
        i18n_title: `common.${view}`,
        data: { startDate: current, endDate: current, currentDate: current, dayWidth: 20, approxFilterRange: 3 },
      };
      const result = { week: weekView, month: monthView, quarter: quarterView }[view].generateChart(
        input,
        null,
        undefined,
        6,
        "fa"
      );
      mocks.store = { currentViewData: result.state, renderView: result.payload };
      const Component = { week: WeekChartView, month: MonthChartView, quarter: QuarterChartView }[view];
      await act(async () => root.render(createElement(TranslationProvider, null, createElement(Component))));
      const columns = () => [...container.querySelectorAll<HTMLElement>("[data-date]")];
      expect(columns().find((day) => day.dataset.date === "2025-03-20")?.dataset.workingDay).toBe("false");
      expect(columns().find((day) => day.dataset.date === "2025-03-21")?.dataset.workingDay).toBe("false");
      expect(columns().find((day) => day.dataset.date === "2025-03-22")?.dataset.workingDay).toBe("true");
      expect(columns().find((day) => day.dataset.date === "2025-03-20")?.title).toContain("۳۰ اسفند ۱۴۰۳");
      expect(container.textContent).not.toMatch(/Week|Current|January|March|Apr|Q[1-4]/);
      if (view === "week") {
        expect(container.querySelector('time[datetime="2025-03-20"]')?.textContent).toBe("۳۰");
        expect(container.querySelector('time[datetime="2025-03-21"]')?.textContent).toBe("۱");
        expect(container.textContent).toContain("هفته ۱");
      } else {
        const farvardin = container.querySelector<HTMLElement>('[data-month-start="2025-03-21"]')!;
        expect(farvardin.dataset.monthEnd).toBe("2025-04-20");
        expect(farvardin.style.width).toBe("620px");
        if (view === "quarter") expect(container.textContent).toContain("سه‌ماهه ۱");
        else expect(container.textContent).toContain("فروردین ۱۴۰۴");
      }
      await act(async () =>
        runInAction(() => {
          profile.working_days = [6, 0, 1, 2, 3, 4];
        })
      );
      expect(columns().find((day) => day.dataset.date === "2025-03-20")?.dataset.workingDay).toBe("true");
      expect(columns().find((day) => day.dataset.date === "2025-03-21")?.dataset.workingDay).toBe("false");
      await act(async () =>
        runInAction(() => {
          profile.working_days = null;
        })
      );
    } finally {
      await act(async () => root.unmount());
      container.remove();
      environment.IS_REACT_ACT_ENVIRONMENT = previous;
      await setLanguage("en");
    }
  }
);

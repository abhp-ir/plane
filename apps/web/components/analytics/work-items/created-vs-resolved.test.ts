// @vitest-environment jsdom
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { act, createElement } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { observable, runInAction } from "mobx";
import { expect, it, vi } from "vitest";
import { initPromise, setLanguage, TranslationProvider } from "@plane/i18n";
import type { IChartResponse } from "@plane/types";
import CreatedVsResolved from "./created-vs-resolved";

const chart = vi.hoisted(() => vi.fn());
const selection = observable({
  selectedDuration: "last_30_days",
  selectedDurationLabel: "retained duration",
  selectedProjects: ["project"],
  selectedCycle: undefined as string | undefined,
  selectedModule: undefined as string | undefined,
  isPeekView: false,
  isEpic: false,
});
const source = {
  data: [
    { key: "2024-02-01", name: "2024-02-01", count: 3, created_issues: 2, completed_issues: 1 },
    { key: "2025-03-01", name: "2025-03-01", count: 0, created_issues: 0, completed_issues: 0 },
    { key: "2025-04-01", name: "2025-04-01", count: 5, created_issues: 3, completed_issues: 2 },
    { key: "2025-03-20", name: "2025-03-20", count: 1, created_issues: 1, completed_issues: 0 },
  ],
  schema: { created_issues: "created_issues", completed_issues: "completed_issues" },
} satisfies IChartResponse;
vi.mock("@/hooks/store/use-analytics", () => ({ useAnalytics: () => selection }));
vi.mock("next/navigation", () => ({ useParams: () => ({ workspaceSlug: "owned" }) }));
vi.mock("swr", () => ({ default: () => ({ data: source, isLoading: false }) }));
vi.mock("@plane/blocks/charts/area-chart", () => ({
  AreaChart: (props: unknown) => {
    chart(props);
    return null;
  },
}));
vi.mock("../analytics-section-wrapper", () => ({
  default: ({ children }: { children: ReactNode }) => createElement("section", null, children),
}));
vi.mock("../loaders", () => ({ ChartLoader: () => null }));

it("describes Gregorian monthly counts with Jalali intervals and updates daily/locale modes without changing API data", async () => {
  await initPromise;
  await setLanguage("en");
  const before = JSON.stringify(source);
  const monthlyNames = [
    "بهم ۱۲ - اسف ۱۰, ۱۴۰۲",
    "اسف ۱۱, ۱۴۰۳ - فرو ۱۱, ۱۴۰۴",
    "فرو ۱۲ - ارد ۱۰, ۱۴۰۴",
    "اسف ۳۰, ۱۴۰۳",
  ];
  const dailyNames = ["بهم ۱۲, ۱۴۰۲", "اسف ۱۱, ۱۴۰۳", "فرو ۱۲, ۱۴۰۴", "اسف ۳۰, ۱۴۰۳"];
  const data = (names: string[]) =>
    source.data.map((row, index) => ({ ...row, [row.key]: row.count, name: names[index] }));
  const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previous = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(createElement(TranslationProvider, null, createElement(CreatedVsResolved))));
    const english = chart.mock.lastCall![0];
    expect(english.data).toEqual(data(["Feb 01, 2024", "Mar 01, 2025", "Apr 01, 2025", "Mar 20, 2025"]));
    await act(async () => setLanguage("fa"));
    expect(chart.mock.lastCall![0].data).toEqual(data(monthlyNames));
    expect(chart.mock.lastCall![0].areas).toEqual(english.areas);
    await act(async () =>
      runInAction(() => {
        selection.isPeekView = true;
        selection.selectedCycle = "cycle";
      })
    );
    expect(chart.mock.lastCall![0].data).toEqual(data(dailyNames));
    await act(async () =>
      runInAction(() => {
        selection.selectedCycle = undefined;
        selection.selectedModule = "module";
      })
    );
    expect(chart.mock.lastCall![0].data).toEqual(data(dailyNames));
    await act(async () => runInAction(() => (selection.selectedModule = undefined)));
    expect(chart.mock.lastCall![0].data).toEqual(data(monthlyNames));
    await act(async () =>
      runInAction(() => {
        selection.isPeekView = false;
        selection.selectedCycle = "workspace-filter";
      })
    );
    expect(chart.mock.lastCall![0].data).toEqual(data(monthlyNames));
    await act(async () => setLanguage("en"));
    expect(chart.mock.lastCall![0]).toEqual(english);
    expect(JSON.stringify(source)).toBe(before);
  } finally {
    await act(async () => root.unmount());
    container.remove();
    environment.IS_REACT_ACT_ENVIRONMENT = previous;
    runInAction(() => {
      selection.isPeekView = false;
      selection.selectedCycle = undefined;
      selection.selectedModule = undefined;
    });
    chart.mockClear();
    await setLanguage("en");
  }
});

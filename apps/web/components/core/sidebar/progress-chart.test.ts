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
import ProgressChart from "./progress-chart";

const chart = vi.hoisted(() => vi.fn());
vi.mock("@plane/blocks/charts/area-chart", () => ({
  AreaChart: (props: unknown) => {
    chart(props);
    return null;
  },
}));

it("updates daily burndown labels across leap Esfand and Nowruz without changing buckets, counts or chart behavior", async () => {
  await initPromise;
  await setLanguage("en");
  const distribution = Object.freeze({
    "2025-03-18": 5,
    "2025-03-19": 4,
    "2025-03-20": 3,
    "2025-03-21": 2,
    "2025-03-22": 1,
    "2025-03-23": null,
  });
  const before = JSON.stringify(distribution);
  const englishNames = ["Mar 18", "Mar 19", "Mar 20", "Mar 21", "Mar 22", "Mar 23"];
  const persianNames = ["اسف ۲۸", "اسف ۲۹", "اسف ۳۰", "فرو ۰۱", "فرو ۰۲", "فرو ۰۳"];
  const data = (names: string[]) =>
    names.map((name, index) => ({
      name,
      current: [5, 4, 3, 2, 1, 0][index],
      ideal: expect.closeTo([10, 8, 6, 4, 2, 0][index]),
    }));
  const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previous = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () =>
      root.render(
        createElement(
          TranslationProvider,
          null,
          createElement(ProgressChart, {
            distribution,
            totalIssues: 10,
            plotTitle: "custom points",
            className: "owned",
          })
        )
      )
    );
    const english = chart.mock.lastCall![0];
    expect(english.data).toEqual(data(englishNames));
    await act(async () => setLanguage("fa"));
    expect(chart.mock.lastCall![0]).toEqual({ ...english, data: data(persianNames) });
    await act(async () => setLanguage("en"));
    expect(chart.mock.lastCall![0]).toEqual(english);
    expect(JSON.stringify(distribution)).toBe(before);
    expect(Object.keys(distribution)).toEqual([
      "2025-03-18",
      "2025-03-19",
      "2025-03-20",
      "2025-03-21",
      "2025-03-22",
      "2025-03-23",
    ]);
  } finally {
    await act(async () => root.unmount());
    container.remove();
    environment.IS_REACT_ACT_ENVIRONMENT = previous;
    chart.mockClear();
    await setLanguage("en");
  }
});

// @vitest-environment jsdom
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { act, createElement, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { initPromise, setLanguage, TranslationProvider } from "@plane/i18n";
import ProgressChart from "./progress-chart";
import { SingleProgressStats } from "./single-progress-stats";
import { StateGroupStatComponent } from "./progress-stats/state_group";

vi.mock("@plane/i18n", async () => {
  const { createRequire } = await import("node:module");
  const webRequire = createRequire(`${process.cwd()}/package.json`);
  const require = createRequire(webRequire.resolve("@plane/i18n"));
  const { createInstance } = require("i18next");
  const ICU = require("i18next-icu").default;
  const reactI18next = require("react-i18next");
  const instance = createInstance();
  const ready = instance
    .use(ICU)
    .use(reactI18next.initReactI18next)
    .init({
      lng: "en",
      fallbackLng: "en",
      resources: {
        en: {
          translation: {
            ...(await import("../../../../../packages/i18n/src/locales/en/common.json")).default,
            ...(await import("../../../../../packages/i18n/src/locales/en/workspace.json")).default,
          },
        },
        fa: {
          translation: {
            ...(await import("../../../../../packages/i18n/src/locales/fa/common.json")).default,
            ...(await import("../../../../../packages/i18n/src/locales/fa/workspace.json")).default,
          },
        },
      },
      interpolation: { escapeValue: false },
    });
  return {
    initPromise: ready,
    setLanguage: (language: string) => instance.changeLanguage(language),
    TranslationProvider: ({ children }: { children: ReactNode }) =>
      createElement(reactI18next.I18nextProvider, { i18n: instance }, children),
    useTranslation: () => {
      const { t, i18n } = reactI18next.useTranslation();
      return { t, currentLocale: i18n.language, direction: i18n.dir() };
    },
  };
});

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
    expect(chart.mock.lastCall![0]).toEqual({
      ...english,
      data: data(persianNames),
      areas: english.areas.map((area: { label: string }, index: number) => ({
        ...area,
        label: index === 0 ? "مقدار فعلی \u2068custom points\u2069" : "مقدار ایده‌آل \u2068custom points\u2069",
      })),
      xAxis: { key: "name", label: "تاریخ" },
      yAxis: { key: "current", label: "تکمیل" },
    });
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

async function mount() {
  await initPromise;
  await setLanguage("fa");
  const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previous = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  return {
    root,
    container,
    async close() {
      await act(async () => root.unmount());
      container.remove();
      environment.IS_REACT_ACT_ENVIRONMENT = previous;
      await setLanguage("en");
      chart.mockClear();
    },
  };
}

it.each([
  ["work items", "آیتم‌های کاری فعلی", "آیتم‌های کاری ایده‌آل"],
  ["points", "امتیازهای فعلی", "امتیازهای ایده‌آل"],
])(
  "localizes complete %s series labels on mounted locale changes while preserving series identity",
  async (plotTitle, current, ideal) => {
    const view = await mount();
    const distribution = Object.freeze({ "2026-10-21": 2, "2026-10-22": 1, "2026-10-23": 0 });
    try {
      await act(async () =>
        view.root.render(
          createElement(
            TranslationProvider,
            null,
            createElement(ProgressChart, { distribution, totalIssues: 2, plotTitle })
          )
        )
      );
      const fa = chart.mock.lastCall![0];
      expect(fa.areas.map((area: { key: string; label: string }) => [area.key, area.label])).toEqual([
        ["current", current],
        ["ideal", ideal],
      ]);
      expect(fa.data.map((row: { current: number; ideal: number }) => [row.current, row.ideal])).toEqual([
        [2, 2],
        [1, 1],
        [0, 0],
      ]);
      await act(async () => setLanguage("en"));
      const en = chart.mock.lastCall![0];
      expect(en.areas.map((area: { key: string; label: string }) => [area.key, area.label])).toEqual([
        ["current", `Current ${plotTitle}`],
        ["ideal", `Ideal ${plotTitle}`],
      ]);
      expect(en.data.map((row: { current: number; ideal: number }) => [row.current, row.ideal])).toEqual([
        [2, 2],
        [1, 1],
        [0, 0],
      ]);
      await act(async () => setLanguage("fa"));
      expect(chart.mock.lastCall![0]).toEqual(fa);
    } finally {
      await view.close();
    }
  }
);

it("formats progress/zero totals and exposes native selected filter buttons while readonly rows stay passive", async () => {
  const view = await mount();
  const click = vi.fn();
  const render = async (total: number, onClick?: () => void) =>
    act(async () =>
      view.root.render(
        createElement(
          TranslationProvider,
          null,
          createElement(SingleProgressStats, { title: "Mixed ABC-42", completed: 1, total, selected: true, onClick })
        )
      )
    );
  try {
    await render(3, click);
    const button = view.container.querySelector("button")!;
    expect(button.type).toBe("button");
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(button.textContent).toBe("Mixed ABC-42۳۳٪ از ۳");
    button.click();
    expect(click).toHaveBeenCalledTimes(1);
    await act(async () => setLanguage("en"));
    expect(button.textContent).toBe("Mixed ABC-4233% of 3");
    await act(async () => setLanguage("fa"));
    expect(button.textContent).toBe("Mixed ABC-42۳۳٪ از ۳");
    await render(0);
    expect(view.container.querySelector("button")).toBeNull();
    expect(view.container.textContent).toBe("Mixed ABC-42۰٪ از ۰");
    expect(view.container.querySelector("[aria-pressed]")).toBeNull();
  } finally {
    await view.close();
  }
});

it("translates fixed state groups while preserving canonical filter payloads and distribution values", async () => {
  const view = await mount();
  const update = vi.fn();
  const distribution = ["backlog", "unstarted", "started", "completed", "cancelled"].map((state) =>
    Object.freeze({ state, completed: 1, total: 5 })
  );
  const before = structuredClone(distribution);
  try {
    await act(async () =>
      view.root.render(
        createElement(
          TranslationProvider,
          null,
          createElement(StateGroupStatComponent, {
            distribution,
            totalIssuesCount: 5,
            selectedStateGroups: ["completed"],
            handleStateGroupFiltersUpdate: update,
            isEditable: true,
          })
        )
      )
    );
    expect([...view.container.querySelectorAll(".capitalize")].map((el) => el.textContent)).toEqual([
      "بک‌لاگ",
      "شروع‌نشده",
      "در حال انجام",
      "تکمیل‌شده",
      "لغوشده",
    ]);
    const completed = view.container.querySelectorAll("button")[3];
    expect(completed.getAttribute("aria-pressed")).toBe("true");
    completed.click();
    expect(update).toHaveBeenLastCalledWith("completed");
    await act(async () => setLanguage("en"));
    expect([...view.container.querySelectorAll(".capitalize")].map((el) => el.textContent)).toEqual([
      "Backlog",
      "Unstarted",
      "Started",
      "Completed",
      "Cancelled",
    ]);
    expect(distribution).toEqual(before);
  } finally {
    await view.close();
  }
});

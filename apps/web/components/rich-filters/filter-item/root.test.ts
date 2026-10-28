/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// @vitest-environment jsdom

import { act, createElement, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { initPromise, setLanguage, TranslationProvider } from "@plane/i18n";
import { FilterInstance, type IFilterInstance } from "@plane/shared-state";
import type {
  TAllAvailableOperatorsForDisplay,
  TExternalFilter,
  TFilterConfig,
  TFilterConditionNodeForDisplay,
  TFilterValue,
} from "@plane/types";
import {
  CORE_COLLECTION_OPERATOR,
  CORE_COMPARISON_OPERATOR,
  CORE_EQUALITY_OPERATOR,
  FILTER_FIELD_TYPE,
} from "@plane/types";
import { getPriorityFilterConfig, getTargetDateFilterConfig } from "@plane/utils";
import { useWorkItemFiltersConfig } from "@/hooks/work-item-filters/use-work-item-filters-config";
import { FiltersToggle } from "../filters-toggle";
import { SelectedOptionsDisplay } from "../filter-value-input/select/selected-options-display";
import { FilterItem } from "./root";

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
            ...(await import("../../../../../packages/i18n/src/locales/en/work-item.json")).default,
          },
        },
        fa: {
          translation: {
            ...(await import("../../../../../packages/i18n/src/locales/fa/common.json")).default,
            ...(await import("../../../../../packages/i18n/src/locales/fa/work-item.json")).default,
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
      return { t, currentLocale: i18n.language };
    },
  };
});

type OperatorOption = { value: TAllAvailableOperatorsForDisplay; label: string };
const select = vi.hoisted(() => ({
  current: undefined as
    | { getValues: () => OperatorOption[]; onChange: (value: TAllAvailableOperatorsForDisplay) => void }
    | undefined,
}));
vi.mock("@plane/blocks/select", () => {
  const Select = ({ children, ...props }: { children: ReactNode } & NonNullable<typeof select.current>) => {
    select.current = props;
    return createElement("div", null, children);
  };
  return {
    Select: Object.assign(Select, {
      Trigger: ({ children }: { children: ReactNode }) => createElement("button", null, children),
    }),
  };
});
vi.mock("../filter-value-input/root", () => ({ FilterValueInput: () => null }));
vi.mock("./container", () => ({
  FilterItemContainer: ({ children }: { children: ReactNode }) => createElement("div", null, children),
}));
vi.mock("./property", () => ({
  FilterItemProperty: ({ label }: { label: string }) => createElement("span", null, label),
}));
vi.mock("@/hooks/store/use-cycle", () => ({ useCycle: () => ({ getCycleById: () => undefined }) }));
vi.mock("@/hooks/store/use-label", () => ({ useLabel: () => ({ getLabelById: () => undefined }) }));
vi.mock("@/hooks/store/use-member", () => ({ useMember: () => ({ getUserDetails: () => undefined }) }));
vi.mock("@/hooks/store/use-project-state", () => ({ useProjectState: () => ({ getStateById: () => undefined }) }));
vi.mock("@/hooks/store/use-project", () => ({
  useProject: () => ({ loader: undefined, getProjectById: () => ({ cycle_view: false, module_view: false }) }),
}));

const IN = CORE_COLLECTION_OPERATOR.IN,
  EXACT = CORE_EQUALITY_OPERATOR.EXACT,
  RANGE = CORE_COMPARISON_OPERATOR.RANGE;
const params = { isEnabled: true, allowedOperators: new Set([IN, EXACT, RANGE]) };

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
    container,
    root,
    async render(children: ReactNode) {
      await act(async () => root.render(createElement(TranslationProvider, null, children)));
    },
    async close() {
      await act(async () => root.unmount());
      container.remove();
      environment.IS_REACT_ACT_ENVIRONMENT = previous;
      await setLanguage("en");
    },
  };
}

function fixture(
  config: TFilterConfig<string>,
  operator: TAllAvailableOperatorsForDisplay = IN,
  value: string[] = ["high"]
) {
  const registry = new FilterInstance<string, TExternalFilter>({
    adapter: { toInternal: () => null, toExternal: () => undefined },
  });
  registry.configManager.register(config);
  const condition: TFilterConditionNodeForDisplay<string, TFilterValue> = {
    id: "owned-condition",
    type: "condition",
    property: config.id,
    operator,
    value,
  };
  const updateConditionOperator = vi.fn(),
    removeCondition = vi.fn();
  const filter = {
    configManager: registry.configManager,
    updateConditionOperator,
    updateConditionValue: vi.fn(),
    removeCondition,
  } as unknown as IFilterInstance<string, TExternalFilter>;
  return { condition, filter, updateConditionOperator, removeCondition };
}

it("updates complete one/many filter operators on mounted fa/en/fa changes while retaining semantic values", async () => {
  const view = await mount(),
    data = fixture(getPriorityFilterConfig("priority")(params));
  try {
    await view.render(createElement(FilterItem, data));
    expect(select.current!.getValues()).toEqual([{ value: IN, label: "برابر با" }]);
    data.condition = { ...data.condition, value: ["high", "low"] };
    await view.render(createElement(FilterItem, data));
    expect(select.current!.getValues()).toEqual([{ value: IN, label: "یکی از" }]);
    await act(async () => setLanguage("en"));
    expect(select.current!.getValues()).toEqual([{ value: IN, label: "is any of" }]);
    await act(async () => setLanguage("fa"));
    expect(select.current!.getValues()).toEqual([{ value: IN, label: "یکی از" }]);
    expect(data.updateConditionOperator).not.toHaveBeenCalled();
    expect(data.condition.value).toEqual(["high", "low"]);
    const close = view.container.querySelector('[aria-label="حذف فیلتر"]') as HTMLButtonElement;
    expect(close.type).toBe("button");
    close.click();
    expect(data.removeCondition).toHaveBeenCalledTimes(1);
    expect(data.removeCondition).toHaveBeenCalledWith("owned-condition");
  } finally {
    await view.close();
  }
});

it("localizes date operator choices while forwarding canonical operator changes", async () => {
  const view = await mount(),
    data = fixture(getTargetDateFilterConfig("target_date")(params), RANGE, ["2025-03-01", "2025-04-01"]);
  try {
    await view.render(createElement(FilterItem, data));
    expect(select.current!.getValues()).toEqual([
      { value: EXACT, label: "برابر با" },
      { value: RANGE, label: "بین" },
    ]);
    expect(view.container.querySelector("button")!.textContent).toBe("بین");
    select.current!.onChange(EXACT);
    expect(data.updateConditionOperator).toHaveBeenCalledTimes(1);
    expect(data.updateConditionOperator).toHaveBeenCalledWith("owned-condition", EXACT, false);
    expect(data.condition.value).toEqual(["2025-03-01", "2025-04-01"]);
  } finally {
    await view.close();
  }
});

it("preserves explicitly configured operator labels even when they contain English system words", async () => {
  const view = await mount(),
    label = "Custom is ABC-42 — عبارت دلخواه";
  const data = fixture(getTargetDateFilterConfig("target_date")({ ...params, operatorLabel: label }), RANGE);
  try {
    await view.render(createElement(FilterItem, data));
    expect(select.current!.getValues().map((x) => x.label)).toEqual([label, label]);
    expect(view.container.querySelector("button")!.textContent).toBe(label);
    await act(async () => setLanguage("en"));
    expect(view.container.querySelector("button")!.textContent).toBe(label);
  } finally {
    await view.close();
  }
});

it("refreshes all first-party filter headings and priorities without changing property IDs or enabled feature flags", async () => {
  const view = await mount();
  let config: ReturnType<typeof useWorkItemFiltersConfig> | undefined;
  function Probe() {
    config = useWorkItemFiltersConfig({
      allowedFilters: [
        "project_id",
        "state_id",
        "state_group",
        "priority",
        "module_id",
        "cycle_id",
        "label_id",
        "assignee_id",
        "mention_id",
        "subscriber_id",
        "created_by_id",
      ],
      workspaceSlug: "fixture",
      projectId: "project",
    });
    return null;
  }
  try {
    await view.render(createElement(Probe));
    const ids = config!.configs.map((x) => x.id);
    expect(config!.configs.map((x) => x.label)).toEqual([
      "وضعیت",
      "گروه وضعیت",
      "مسئولان",
      "اولویت",
      "پروژه‌ها",
      "اشاره‌ها",
      "برچسب",
      "چرخه",
      "ماژول",
      "تاریخ شروع",
      "موعد انجام",
      "زمان ایجاد",
      "زمان به‌روزرسانی",
      "ایجادکننده",
      "دنبال‌کننده",
    ]);
    const priority = config!.configMap.priority!.supportedOperatorConfigsMap.get(IN)!;
    if (priority.type !== FILTER_FIELD_TYPE.MULTI_SELECT) throw new Error("Expected multi-select priorities");
    const options = typeof priority.getOptions === "function" ? await priority.getOptions() : priority.getOptions;
    expect(options.map((x) => x.label)).toEqual(["فوری", "بالا", "متوسط", "پایین", "هیچ‌کدام"]);
    expect(config!.configMap.cycle_id!.isEnabled).toBe(false);
    expect(config!.configMap.module_id!.isEnabled).toBe(false);
    await act(async () => setLanguage("en"));
    expect(config!.configMap.priority!.label).toBe("Priority");
    expect(config!.configMap.target_date!.label).toBe("Due date");
    await act(async () => setLanguage("fa"));
    expect(config!.configMap.target_date!.label).toBe("موعد انجام");
    expect(config!.configs.map((x) => x.id)).toEqual(ids);
  } finally {
    await view.close();
  }
});

it("disables the loading filter toggle until its instance exists", async () => {
  const view = await mount();
  const toggleVisibility = vi.fn();
  try {
    await view.render(createElement(FiltersToggle, { filter: undefined }));
    const loading = view.container.querySelector("button")!;
    expect(loading.disabled).toBe(true);
    expect(loading.getAttribute("aria-label")).toBe("فیلترها");
    loading.click();
    const filter = {
      allConditionsForDisplay: [{ id: "condition" }],
      isVisible: false,
      canUpdateView: false,
      hasChanges: false,
      toggleVisibility,
    } as unknown as IFilterInstance<string, TExternalFilter>;
    await view.render(createElement(FiltersToggle, { filter }));
    const ready = view.container.querySelector("button")!;
    expect(ready.disabled).toBe(false);
    ready.click();
    expect(toggleVisibility).toHaveBeenCalledTimes(1);
  } finally {
    await view.close();
  }
});

it("localizes selection separators and overflow on mounted language changes while preserving option labels and values", async () => {
  const view = await mount();
  const selectedValue = ["a", "b", "c"];
  const options = [
    { id: "a", value: "a", label: "Custom English ABC-42" },
    { id: "b", value: "b", label: "گزینهٔ دلخواه" },
    { id: "c", value: "c", label: "Third option" },
  ];
  const before = structuredClone({ selectedValue, options });
  try {
    await view.render(createElement(SelectedOptionsDisplay<string>, { selectedValue, options }));
    expect(view.container.textContent).toContain("Custom English ABC-42،گزینهٔ دلخواه");
    expect(view.container.querySelector("bdi")!.textContent).toBe("\u2066+۱\u2069 مورد دیگر");
    await act(async () => setLanguage("en"));
    expect(view.container.textContent).toContain("Custom English ABC-42,گزینهٔ دلخواه");
    expect(view.container.querySelector("bdi")!.textContent).toBe("+1 more");
    await act(async () => setLanguage("fa"));
    expect(view.container.querySelector("bdi")!.textContent).toBe("\u2066+۱\u2069 مورد دیگر");
    expect({ selectedValue, options }).toEqual(before);
  } finally {
    await view.close();
  }
});

it.each([1, 2, 12])("localizes an unresolved selection count of %i", async (count) => {
  const view = await mount();
  try {
    const selectedValue = Array.from({ length: count }, (_, index) => `id-${index}`);
    await view.render(createElement(SelectedOptionsDisplay<string>, { selectedValue, options: [] }));
    expect(view.container.textContent).toBe(`${new Intl.NumberFormat("fa").format(count)} گزینهٔ انتخاب‌شده`);
  } finally {
    await view.close();
  }
});

it("updates an unresolved selection on language change and preserves explicit fallback and empty text", async () => {
  const view = await mount();
  try {
    const selectedValue = Array.from({ length: 12 }, (_, index) => `id-${index}`);
    await view.render(createElement(SelectedOptionsDisplay<string>, { selectedValue, options: [] }));
    await act(async () => setLanguage("en"));
    expect(view.container.textContent).toBe("12 selected");
    await view.render(
      createElement(SelectedOptionsDisplay<string>, {
        selectedValue: ["retained"],
        options: [],
        fallbackText: "Custom fallback ABC-42",
      })
    );
    expect(view.container.textContent).toBe("Custom fallback ABC-42");
    await view.render(
      createElement(SelectedOptionsDisplay<string>, {
        selectedValue: [],
        options: [],
        emptyValue: "Custom empty ABC-42",
      })
    );
    expect(view.container.textContent).toBe("Custom empty ABC-42");
  } finally {
    await view.close();
  }
});

// @vitest-environment jsdom
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import type { DateSelectProps } from "@plane/blocks/property-select";
import { initPromise, setLanguage, TranslationProvider } from "@plane/i18n";
import { InboxIssueSnoozeModal } from "@/components/inbox/modals/snooze-issue-modal";
import { DateFilterModal } from "./date-filter-modal";

const { fields } = vi.hoisted(() => ({ fields: new Map<string, DateSelectProps>() }));
vi.mock("@plane/blocks/property-select", () => ({
  DateSelect: (props: DateSelectProps) => {
    fields.set(props.testId!, props);
    return createElement("button", { type: "button", "data-testid": props.testId }, props.value?.toISOString());
  },
}));
vi.mock("@/hooks/store/user", () => ({ useUserProfile: () => ({ data: { start_of_the_week: 6 } }) }));

it("commits canonical filter bounds only on Apply and rejects a reversed range", async () => {
  await initPromise;
  await setLanguage("en");
  fields.clear();
  const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previous = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const onSelect = vi.fn();
  const handleClose = vi.fn();
  try {
    await act(async () =>
      root.render(
        createElement(
          TranslationProvider,
          null,
          createElement(DateFilterModal, { title: "Due date", isOpen: true, onSelect, handleClose })
        )
      )
    );
    const start = () => fields.get("date-filter-start-select")!;
    const end = () => fields.get("date-filter-end-select")!;
    expect(start()).toBeDefined();
    expect(end()).toBeDefined();
    await act(async () => start().onChange(new Date(2025, 2, 20)));
    await act(async () => end().onChange(new Date(2025, 2, 21)));
    expect(onSelect).not.toHaveBeenCalled();
    expect(start().maxDate).toEqual(new Date(2025, 2, 21));
    expect(end().minDate).toEqual(new Date(2025, 2, 20));
    expect(start().weekStartsOn).toBe(6);
    const apply = [...document.querySelectorAll("button")].find((button) => button.textContent === "Apply")!;
    await act(async () => apply.click());
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(["2025-03-20;after", "2025-03-21;before"]);
    expect(handleClose).toHaveBeenCalledOnce();
    // A programmatic reversed value must still be rejected by the form, beyond the picker's disabled days.
    await act(async () => start().onChange(new Date(2025, 2, 22)));
    expect(apply.disabled).toBe(true);
    await act(async () => apply.click());
    expect(onSelect).toHaveBeenCalledTimes(1);
  } finally {
    await act(async () => root.unmount());
    container.remove();
    fields.clear();
    environment.IS_REACT_ACT_ENVIRONMENT = previous;
    await setLanguage("en");
  }
});

it("keeps snooze's project-day boundary and waits for explicit confirmation", async () => {
  await initPromise;
  await setLanguage("en");
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2025-03-20T22:00:00Z"));
  fields.clear();
  const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previous = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const onConfirm = vi.fn();
  const handleClose = vi.fn();
  try {
    await act(async () =>
      root.render(
        createElement(
          TranslationProvider,
          null,
          createElement(InboxIssueSnoozeModal, {
            isOpen: true,
            value: new Date("2025-03-21T21:00:00Z"),
            projectTimezone: "Asia/Tehran",
            onConfirm,
            handleClose,
          })
        )
      )
    );
    const field = () => fields.get("intake-snooze-date-select")!;
    expect(field()).toBeDefined();
    expect(field().minDate).toEqual(new Date(2025, 2, 22));
    expect(field().value).toEqual(new Date(2025, 2, 22));
    expect(field().weekStartsOn).toBe(6);
    const selected = new Date(2025, 2, 23);
    await act(async () => field().onChange(selected));
    expect(onConfirm).not.toHaveBeenCalled();
    await act(async () => setLanguage("fa"));
    expect(field().value).toBe(selected);
    await act(async () =>
      [...document.querySelectorAll("button")].find((button) => button.textContent === "تعویق")!.click()
    );
    expect(onConfirm).toHaveBeenCalledExactlyOnceWith(selected);
    expect(handleClose).toHaveBeenCalledOnce();
  } finally {
    await act(async () => root.unmount());
    container.remove();
    fields.clear();
    environment.IS_REACT_ACT_ENVIRONMENT = previous;
    vi.useRealTimers();
    await setLanguage("en");
  }
});

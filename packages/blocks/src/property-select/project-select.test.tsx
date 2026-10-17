/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { initPromise, setLanguage } from "@plane/i18n";
import { ProjectSelect } from "./project-select";

it("keeps stored project IDs when selecting a mixed-script name in an RTL form", async () => {
  const user = userEvent.setup();
  const existing = { id: "unloaded-project", name: "پروژهٔ پیشین ABC-42" };
  const available = { id: "available-project", name: "Plane پروژهٔ تازه" };
  const onChange = vi.fn();
  render(
    <div dir="rtl">
      <ProjectSelect
        multiple
        value={[existing]}
        getValues={() => Promise.resolve({ results: [available], next_page_results: false })}
        onChange={onChange}
        variant="select-md"
        searchPlaceholder="جست‌وجوی پروژه"
      />
    </div>
  );

  await user.click(screen.getByRole("button", { name: existing.name }));
  await screen.findByRole("combobox", { name: "جست‌وجوی پروژه" });
  await user.click(await screen.findByRole("option", { name: available.name }));

  expect(onChange).toHaveBeenCalledWith([existing.id, available.id]);
});

it("localizes the default empty-result message for a Persian project picker", async () => {
  await initPromise;
  await setLanguage("fa");
  try {
    const user = userEvent.setup();
    render(
      <ProjectSelect
        value={null}
        getValues={() => Promise.resolve({ results: [], next_page_results: false })}
        onChange={vi.fn()}
        variant="select-md"
        placeholder="انتخاب پروژه"
        searchPlaceholder="جست‌وجوی پروژه"
      />
    );

    await user.click(screen.getByRole("button", { name: "انتخاب پروژه" }));
    expect(await screen.findByText("نتیجهٔ منطبقی وجود ندارد")).toBeDefined();
    expect(screen.queryByText("No results found")).toBeNull();
  } finally {
    await setLanguage("en");
  }
});

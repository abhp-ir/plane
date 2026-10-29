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
import { IssueTitleInput } from "./title-input";

it("localizes counts without changing title text, input limits or save behavior during locale/prop updates", async () => {
  await initPromise;
  await setLanguage("fa");
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
  );
  const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previous = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const update = vi.fn().mockResolvedValue(undefined);
  const operations = {
    update,
    fetch: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
  };
  const setIsSubmitting = vi.fn();
  const render = (value: string) =>
    root.render(
      createElement(
        TranslationProvider,
        null,
        createElement(IssueTitleInput, {
          value,
          workspaceSlug: "test-workspace",
          projectId: "test-project",
          issueId: "test-issue",
          isSubmitting: "saved",
          setIsSubmitting,
          issueOperations: operations,
        })
      )
    );
  try {
    await act(async () => render("کار ABC"));
    const input = container.querySelector("textarea")!;
    const counter = () => container.querySelector('bdi[dir="ltr"]')!.textContent;
    await act(async () => input.focus());
    expect(counter()).toBe("۷/۲۵۵");
    expect(input.maxLength).toBe(255);
    await act(async () => setLanguage("en"));
    expect(input.value).toBe("کار ABC");
    expect(counter()).toBe("7/255");
    await act(async () => setLanguage("fa"));
    await act(async () => render("نام جدید X"));
    expect(input.value).toBe("نام جدید X");
    expect(counter()).toBe("۱۰/۲۵۵");
    await act(async () => new Promise<void>((resolve) => setTimeout(resolve, 1600)));
    expect(update).not.toHaveBeenCalled();
    expect(setIsSubmitting).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
    container.remove();
    environment.IS_REACT_ACT_ENVIRONMENT = previous;
    vi.unstubAllGlobals();
    await setLanguage("en");
  }
  expect(update).not.toHaveBeenCalled();
});

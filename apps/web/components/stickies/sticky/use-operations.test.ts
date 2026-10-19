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
import { setToast } from "@plane/blocks/toast";
import type { TOperations } from "./use-operations";
import { useStickyOperations } from "./use-operations";

vi.mock("@plane/blocks/toast", () => ({ setToast: vi.fn() }));
vi.mock("@/components/editor/sticky-editor/color-palette", () => ({ STICKY_COLORS_LIST: [{ key: "#ffffff" }] }));
vi.mock("@/hooks/use-stickies", () => {
  const store = {
    stickies: {},
    getWorkspaceStickyIds: () => [],
    createSticky: vi.fn().mockResolvedValue(undefined),
    updateSticky: vi.fn(),
    deleteSticky: vi.fn(),
    updateStickyPosition: vi.fn(),
  };
  return { useSticky: () => store };
});

it("uses the current language for note notifications after a mounted language switch", async () => {
  await initPromise;
  await setLanguage("en");
  const container = document.createElement("div");
  const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previousActEnvironment = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  const root = createRoot(container);
  let operations: TOperations | undefined;
  function Consumer() {
    operations = useStickyOperations({ workspaceSlug: "synthetic" }).stickyOperations;
    return null;
  }
  try {
    await act(async () => root.render(createElement(TranslationProvider, null, createElement(Consumer))));
    await act(async () => setLanguage("fa"));
    await operations!.create({ name: "Unchanged custom title" });
    expect(setToast).toHaveBeenLastCalledWith({
      type: "success",
      title: "یادداشت ایجاد شد",
      message: "یادداشت با موفقیت ایجاد شد",
    });
  } finally {
    await act(async () => root.unmount());
    await setLanguage("en");
    environment.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
  }
});

// @vitest-environment jsdom
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { useFormContext } from "react-hook-form";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { initPromise, setLanguage, TranslationProvider } from "@plane/i18n";
import { CreateProjectForm } from "./root";

const mocks = vi.hoisted(() => ({ upload: vi.fn(), create: vi.fn(), toast: vi.fn() }));
beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
  );
});
afterEach(() => vi.unstubAllGlobals());
vi.mock("@plane/i18n", async (importOriginal) => {
  const { createTestTranslation } = await import("@/helpers/__tests__/translation");
  return createTestTranslation(await importOriginal<typeof import("@plane/i18n")>());
});
vi.mock("@plane/blocks/toast", () => ({ setToast: mocks.toast }));
vi.mock("@/helpers/cover-image.helper", () => ({
  getRandomCoverImage: () => "/test-cover.jpg",
  getCoverImageType: () => "local_static",
  uploadCoverImage: mocks.upload,
}));
vi.mock("@/hooks/store/use-project", () => ({
  useProject: () => ({ createProject: mocks.create, updateProject: vi.fn(), addProjectToFavorites: vi.fn() }),
}));
vi.mock("@/hooks/use-platform-os", () => ({ usePlatformOS: () => ({ isMobile: false }) }));
vi.mock("@/components/project/create/header", () => ({ default: () => null }));
vi.mock("./attributes", () => ({ ProjectAttributes: () => null }));
vi.mock("@/components/project/create/project-create-buttons", () => ({
  default: function Submit() {
    const { formState } = useFormContext();
    return createElement("button", { type: "submit", disabled: formState.isSubmitting }, "Submit");
  },
}));

async function mounted(
  locale: "fa" | "en",
  identifier: string,
  run: (container: HTMLDivElement, next: ReturnType<typeof vi.fn>) => Promise<void>
) {
  await initPromise;
  await setLanguage(locale);
  vi.clearAllMocks();
  const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previous = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const next = vi.fn();
  try {
    await act(async () =>
      root.render(
        createElement(
          TranslationProvider,
          null,
          createElement(CreateProjectForm, {
            workspaceSlug: "disposable-workspace",
            onClose: vi.fn(),
            handleNextStep: next,
            updateCoverImageStatus: vi.fn(),
            data: { name: "پروژهٔ آزمایشی", identifier, cover_image_url: "/test-cover.jpg" },
          })
        )
      )
    );
    await run(container, next);
  } finally {
    await act(async () => root.unmount());
    container.remove();
    environment.IS_REACT_ACT_ENVIRONMENT = previous;
    await setLanguage("en");
  }
}

it.each(["fa", "en"] as const)(
  "formats the existing identifier limit in %s without accepting an overlong ID",
  async (locale) => {
    await mounted(locale, "TWELVE123456", async (container) => {
      await act(async () => container.querySelector("button")!.click());
      expect(container.textContent).toContain(
        locale === "fa" ? "شناسهٔ پروژه باید حداکثر ۱۰ نویسه باشد" : "Project ID must at most be of 10 characters"
      );
      expect(container.textContent).not.toContain("{max}");
      expect(mocks.upload).not.toHaveBeenCalled();
      expect(mocks.create).not.toHaveBeenCalled();
    });
  }
);

it.each([new Error("Failed to fetch"), { error: "Untranslated service error" }, undefined])(
  "handles a cover failure without submitting, rejecting the form or exposing service text: %j",
  async (error) => {
    const diagnostic = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await mounted("fa", "PICKR", async (container, next) => {
        mocks.upload.mockRejectedValue(error);
        const submit = container.querySelector("button")!;
        await act(async () => submit.click());
        expect(mocks.toast).toHaveBeenCalledExactlyOnceWith({
          type: "error",
          title: "خطا",
          message: "به‌روزرسانی تصویر جلد انجام نشد",
        });
        expect(mocks.create).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
        expect(submit.disabled).toBe(false);
        expect(diagnostic).toHaveBeenCalledWith("Error uploading cover image:", error);
        await act(async () => submit.click());
        expect(mocks.upload).toHaveBeenCalledTimes(2);
        expect(submit.disabled).toBe(false);
      });
    } finally {
      diagnostic.mockRestore();
    }
  }
);

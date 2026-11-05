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
import { TourRoot } from "./root";

const { onComplete, toggleCreateProjectModal } = vi.hoisted(() => ({
  onComplete: vi.fn(),
  toggleCreateProjectModal: vi.fn(),
}));

vi.mock("@plane/i18n", async (importOriginal) => {
  const { createTestTranslation } = await import("@/helpers/__tests__/translation");
  return createTestTranslation(await importOriginal<typeof import("@plane/i18n")>());
});
vi.mock("@/hooks/store/user", () => ({
  useUser: () => ({ data: { first_name: "علی‌رضا", last_name: "Smith-123" } }),
}));
vi.mock("@/hooks/store/use-command-palette", () => ({
  useCommandPalette: () => ({ toggleCreateProjectModal }),
}));

it("translates the mounted tour without changing names, steps or completion behavior", async () => {
  await initPromise;
  await setLanguage("fa");
  const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previous = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const button = (label: string) =>
    [...container.querySelectorAll("button")].find((node) => node.textContent === label)!;
  try {
    await act(async () =>
      root.render(createElement(TranslationProvider, null, createElement(TourRoot, { onComplete })))
    );
    expect(container.querySelector("h3")?.textContent).toBe("به Plane خوش آمدید، علی‌رضا Smith-123");
    expect([...container.querySelectorAll("h3 bdi")].map((node) => node.textContent)).toEqual([
      "Plane",
      "علی‌رضا Smith-123",
    ]);
    await act(async () => button("دیدن راهنما").click());
    expect(container.querySelector("img")?.alt).toBe("برنامه‌ریزی با آیتم‌های کاری");
    expect(container.querySelector("img")?.src).toContain("issues-fa.png");
    const cycles = button("چرخه‌ها");
    expect(cycles.tagName).toBe("BUTTON");
    expect(cycles.type).toBe("button");
    await act(async () => cycles.click());
    expect(cycles.getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelector("img")?.alt).toBe("با چرخه‌ها پیشرفت کنید");
    expect(onComplete).not.toHaveBeenCalled();
    await act(async () => setLanguage("en"));
    expect(button("Cycles").getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelector("img")?.alt).toBe("Make progress with Cycles");
    expect(container.querySelector("img")?.src).toContain("cycles.webp");
    expect(container.textContent).toContain("Cycles help you and your team to progress faster");
    await act(async () => setLanguage("fa"));
    expect(container.querySelector("img")?.src).toContain("cycles-fa.png");
    await act(async () => button("بعدی").click());
    expect(container.querySelector("img")?.alt).toBe("پروژهٔ خود را به ماژول‌ها تقسیم کنید");
    await act(async () => button("بعدی").click());
    expect(container.querySelector("img")?.alt).toBe("نماها");
    await act(async () => button("بعدی").click());
    expect(container.querySelector("img")?.alt).toBe("مستندسازی با صفحه‌ها");
    expect(container.textContent).not.toMatch(/onboarding_tour\.|product_tour\.|<brand\/>/);
    await act(async () => container.querySelector<HTMLButtonElement>('button[aria-label="بستن"]')!.click());
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(toggleCreateProjectModal).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
    container.remove();
    await setLanguage("en");
    environment.IS_REACT_ACT_ENVIRONMENT = previous;
  }
});

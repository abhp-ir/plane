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
import type { IUser } from "@plane/types";
import { UserGreetingsView } from "./user-greetings";

const clock = vi.hoisted(() => ({ currentTime: new Date("2025-03-21T12:34:00.000Z") }));
vi.mock("@/hooks/use-current-time", () => ({ useCurrentTime: () => clock }));

it("updates the home date to real Nowruz and Persian digits on mounted locale changes without changing time or names", async () => {
  await initPromise;
  await setLanguage("en");
  const user = { first_name: "سارا", last_name: "Mixed ABC-42", user_timezone: "UTC" } as IUser;
  const before = JSON.stringify(user),
    epoch = clock.currentTime.getTime();
  const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previous = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () =>
      root.render(createElement(TranslationProvider, null, createElement(UserGreetingsView, { user })))
    );
    const english = container.querySelector("h5")?.textContent;
    expect(english).toContain("Friday, Mar 21 12:34");
    await act(async () => setLanguage("fa"));
    expect(container.querySelector("h5")?.textContent).toContain("جمعه، ۱ فروردین ۱۲:۳۴");
    expect(container.querySelector("h5")?.textContent).not.toMatch(/[0-9A-Za-z]/);
    expect(container.querySelector("bdi")?.textContent).toBe("سارا Mixed ABC-42");
    expect(container.querySelector("bdi")?.getAttribute("dir")).toBe("auto");
    expect(clock.currentTime.getTime()).toBe(epoch);
    expect(JSON.stringify(user)).toBe(before);
    await act(async () => setLanguage("en"));
    expect(container.querySelector("h5")?.textContent).toBe(english);
  } finally {
    await act(async () => root.unmount());
    container.remove();
    environment.IS_REACT_ACT_ENVIRONMENT = previous;
    await setLanguage("en");
  }
});

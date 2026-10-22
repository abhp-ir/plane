/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { expect, it } from "vitest";
import { i18nInstance, initPromise, setLanguage } from "@plane/i18n";
import { AppSidebarItem } from "./sidebar-item";

it.each([
  ["link", "fa"],
  ["button", "fa"],
  ["link", "en"],
  ["button", "en"],
] as const)(
  "names an icon-only %s in %s while preserving its native element and destination",
  async (variant, language) => {
    await initPromise;
    try {
      await setLanguage(language);
      const label = i18nInstance.t("sidebar.inbox");
      const html = renderToStaticMarkup(
        createElement(
          MemoryRouter,
          null,
          createElement(AppSidebarItem, {
            variant,
            "aria-label": label,
            item: { href: "/owned/notifications/", icon: createElement("svg", { "aria-hidden": true }) },
          })
        )
      );
      expect(html).toContain(`aria-label="${label}"`);
      expect(html).toContain(variant === "link" ? 'href="/owned/notifications/"' : 'type="button"');
      expect(html).not.toContain(`>${label}<`);
    } finally {
      await setLanguage("en");
    }
  }
);

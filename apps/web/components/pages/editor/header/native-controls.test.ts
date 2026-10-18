/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createElement } from "react";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { TPageInstance } from "@/store/pages/base-page";
import { PageEditorHeaderRoot } from "./root";

vi.mock("@plane/i18n", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock("@plane/blocks/emoji-icon-picker", () => ({
  // Model the shared picker's native trigger; real popover interaction is checked in the browser.
  EmojiPicker: ({
    label,
    buttonClassName,
    disabled,
  }: {
    label: ReactNode;
    buttonClassName?: string;
    disabled?: boolean;
  }) => createElement("button", { type: "button", className: buttonClassName, disabled }, label),
  Logo: () => createElement("svg", { "aria-hidden": true }),
}));

function pageFixture(selected = false, editable = true): TPageInstance {
  return {
    name: "صفحه آزمون ABC-42",
    isContentEditable: editable,
    logo_props: selected ? { in_use: "icon", icon: { name: "FileText", color: "#3574d4" } } : {},
    updatePageLogo: vi.fn(),
  } as unknown as TPageInstance;
}

describe("native Page header controls", () => {
  it("keeps the Add icon control inside the shared picker's single native trigger", () => {
    const html = renderToStaticMarkup(createElement(PageEditorHeaderRoot, { page: pageFixture() }));
    expect(html).not.toMatch(/<button\b[^>]*>(?:(?!<\/button>)[\s\S])*<button\b/);
  });

  it("names the Add icon and icon-only Change icon controls in their respective states", () => {
    const empty = renderToStaticMarkup(createElement(PageEditorHeaderRoot, { page: pageFixture() }));
    const selected = renderToStaticMarkup(createElement(PageEditorHeaderRoot, { page: pageFixture(true) }));
    expect(empty).toContain("common.icon.add");
    expect(selected).toContain("common.icon.change");
  });

  it("uses one native trigger before and after selecting the first icon", () => {
    for (const selected of [false, true]) {
      const html = renderToStaticMarkup(createElement(PageEditorHeaderRoot, { page: pageFixture(selected) }));
      expect(html.match(/<button\b/g)).toHaveLength(1);
    }
  });

  it("keeps both icon states actionable only for users allowed to edit", () => {
    for (const selected of [false, true]) {
      const editable = renderToStaticMarkup(createElement(PageEditorHeaderRoot, { page: pageFixture(selected) }));
      const readOnly = renderToStaticMarkup(
        createElement(PageEditorHeaderRoot, { page: pageFixture(selected, false) })
      );
      expect(editable).not.toContain('disabled=""');
      expect(readOnly).toContain('disabled=""');
    }
  });
});

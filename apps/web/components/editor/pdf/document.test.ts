/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { cloneElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { expect, it, vi } from "vitest";
import { PDFDocument } from "./document";

vi.mock("@react-pdf/renderer", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@react-pdf/renderer")>();
  return {
    ...actual,
    Font: {
      register: (font: Parameters<typeof actual.Font.register>[0]) => {
        const localSource = (src: string) => {
          const start = src.indexOf("/app/assets/fonts/");
          return start < 0 ? src : fileURLToPath(new URL(`../../../${src.slice(start + 1)}`, import.meta.url));
        };
        if ("fonts" in font) {
          return actual.Font.register({
            ...font,
            fonts: font.fonts.map((face) => ({ ...face, src: localSource(face.src) })),
          });
        }
        return actual.Font.register({ ...font, src: localSource(font.src) });
      },
    },
  };
});

it.each(["fa", "en"])(
  "passes content direction, list ordinals and alignment to actual PDF layout (%s)",
  async (locale) => {
    type LayoutNode = {
      type: string;
      value?: string;
      style?: { direction?: string; textAlign?: string };
      children?: LayoutNode[];
    };
    let layout: LayoutNode | undefined;
    const document = cloneElement(
      PDFDocument({
        content:
          '<p>سلام ABC-42</p><p>English فارسی</p><p style="text-align:center">وسط فارسی</p><ol start="3"><li><p>آیتم فارسی</p><ul><li><p>Nested English</p></li></ul></li><li value="7"><p>English item</p></li><li><p>آیتم بعدی</p></li></ol>',
        pageFormat: "A4",
        locale,
      }),
      {
        onRender: (data: unknown) => {
          layout = (data as { _INTERNAL__LAYOUT__DATA_: LayoutNode })._INTERNAL__LAYOUT__DATA_;
        },
      }
    );
    await renderToBuffer(document);
    const textNodes: LayoutNode[] = [];
    function collect(node: LayoutNode) {
      if (node.type === "TEXT") textNodes.push(node);
      node.children?.forEach(collect);
    }
    expect(layout).toBeDefined();
    if (!layout) throw new Error("Missing PDF layout");
    collect(layout);
    const text = (value: string) =>
      textNodes.find((node) => node.children?.some((child) => child.value?.includes(value)));
    expect(text("سلام")?.style?.direction).toBe("rtl");
    expect(text("English")?.style?.direction).toBe("ltr");
    expect(text("وسط")?.style?.textAlign).toBe("center");
    for (const ordinal of [3, 7, 8]) {
      expect(text(`${new Intl.NumberFormat(locale).format(ordinal)}.`)).toBeDefined();
    }
  }
);

it("embeds Persian fallback glyphs, retains the Latin font and includes real image bytes", async () => {
  const image = readFileSync(new URL("../../../app/assets/cover-images/image_1.jpg", import.meta.url));
  const content = `<h1>گزارش فارسی می‌رود ABC-42</h1><p>English GitHub ABC-42</p><p><strong>پررنگ فارسی</strong> <em>مورب فارسی</em></p><img src="data:image/jpeg;base64,${image.toString("base64")}" width="80" height="45">`;
  const buffer = await renderToBuffer(PDFDocument({ content, pageFormat: "A4" }));
  expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
  const pdf = buffer.toString("latin1");
  expect(pdf).toContain("Amiri");
  expect(pdf).toContain("Inter");
  expect(pdf).toMatch(/\/Subtype\s*\/Image/);
});

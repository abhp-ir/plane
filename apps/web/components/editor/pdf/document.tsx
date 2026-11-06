/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ComponentProps } from "react";
import type { PageProps, Styles } from "@react-pdf/renderer";
import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { Html } from "react-pdf-html";
// assets
import interBold from "@/app/assets/fonts/inter/bold.ttf?url";
import interHeavy from "@/app/assets/fonts/inter/heavy.ttf?url";
import interLight from "@/app/assets/fonts/inter/light.ttf?url";
import interMedium from "@/app/assets/fonts/inter/medium.ttf?url";
import interRegular from "@/app/assets/fonts/inter/regular.ttf?url";
import interSemibold from "@/app/assets/fonts/inter/semibold.ttf?url";
import interThin from "@/app/assets/fonts/inter/thin.ttf?url";
import interUltraBold from "@/app/assets/fonts/inter/ultrabold.ttf?url";
import interUltraLight from "@/app/assets/fonts/inter/ultralight.ttf?url";
import amiriRegular from "@/app/assets/fonts/amiri/Amiri-Regular.ttf?url";
import amiriBold from "@/app/assets/fonts/amiri/Amiri-Bold.ttf?url";
import amiriItalic from "@/app/assets/fonts/amiri/Amiri-Italic.ttf?url";
import amiriBoldItalic from "@/app/assets/fonts/amiri/Amiri-BoldItalic.ttf?url";
// plane imports
import { convertRemToPixel } from "@plane/utils";
import { getPDFTextDirection } from "./content-direction";

type PDFRenderers = NonNullable<ComponentProps<typeof Html>["renderers"]>;
type PDFRendererProps = ComponentProps<PDFRenderers[string]>;

function getElementDirection(element: PDFRendererProps["element"]): "ltr" | "rtl" {
  let ancestor = element;
  while (ancestor) {
    const dir = ancestor.getAttribute("dir");
    if (dir === "ltr" || dir === "rtl") return dir;
    ancestor = ancestor.parentNode;
  }
  return getPDFTextDirection(element.textContent);
}

function PDFBlock({ element, style, children }: PDFRendererProps) {
  const direction = element.getAttribute("data-node-type") === "code-block" ? "ltr" : getElementDirection(element);
  return <View style={[{ direction, textAlign: direction === "rtl" ? "right" : "left" }, ...style]}>{children}</View>;
}

function PDFListItem({ element, style, children, locale }: PDFRendererProps & { locale: string }) {
  const direction = getElementDirection(element);
  const rtl = direction === "rtl";
  const list = element.parentNode;
  const task = list.getAttribute("data-type") === "taskList";
  const start = Number.parseInt(list.getAttribute("start") ?? "", 10);
  let number = (Number.isNaN(start) ? 1 : start) + element.indexOfType;
  let previous = element;
  while (previous) {
    const value = Number.parseInt(previous.getAttribute("value") ?? "", 10);
    if (!Number.isNaN(value)) {
      number = value + element.indexOfType - previous.indexOfType;
      break;
    }
    previous = previous.previousElementSibling as typeof previous;
  }
  const marker = list.tag === "ol" ? `${new Intl.NumberFormat(locale, { useGrouping: false }).format(number)}.` : "•";
  return (
    <View style={[...style, { direction, flexDirection: rtl ? "row-reverse" : "row" }]}>
      <View style={{ width: 30, flexShrink: 0, alignItems: rtl ? "flex-start" : "flex-end", paddingHorizontal: 5 }}>
        {task ? (
          <View
            style={{
              width: 12,
              height: 12,
              marginTop: 3,
              borderWidth: 1.5,
              borderRadius: 2,
              backgroundColor: element.getAttribute("data-checked") === "true" ? "#3f76ff" : "#ffffff",
            }}
          />
        ) : (
          <Text style={{ direction: "ltr" }}>{marker}</Text>
        )}
      </View>
      <View style={{ flexGrow: 1, flexBasis: 1, textAlign: rtl ? "right" : "left" }}>{children}</View>
    </View>
  );
}

const EDITOR_PDF_FONT_FAMILY_STYLES: Styles = {
  "*:not(.courier, .courier-bold)": { fontFamily: ["Inter", "Amiri"] },
  ".courier": { fontFamily: ["Courier", "Amiri"] },
  ".courier-bold": { fontFamily: ["Courier-Bold", "Amiri"] },
};

const EDITOR_PDF_TYPOGRAPHY_STYLES: Styles = {
  // page title
  "h1.page-title": {
    fontSize: convertRemToPixel(1.6),
    fontWeight: "bold",
    marginTop: 0,
    marginBottom: convertRemToPixel(2),
  },
  // headings
  "h1:not(.page-title)": {
    fontSize: convertRemToPixel(1.4),
    fontWeight: "semibold",
    marginTop: convertRemToPixel(2),
    marginBottom: convertRemToPixel(0.25),
  },
  h2: {
    fontSize: convertRemToPixel(1.2),
    fontWeight: "semibold",
    marginTop: convertRemToPixel(1.4),
    marginBottom: convertRemToPixel(0.0625),
  },
  h3: {
    fontSize: convertRemToPixel(1.1),
    fontWeight: "semibold",
    marginTop: convertRemToPixel(1),
    marginBottom: convertRemToPixel(0.0625),
  },
  h4: {
    fontSize: convertRemToPixel(1),
    fontWeight: "semibold",
    marginTop: convertRemToPixel(1),
    marginBottom: convertRemToPixel(0.0625),
  },
  h5: {
    fontSize: convertRemToPixel(0.9),
    fontWeight: "semibold",
    marginTop: convertRemToPixel(1),
    marginBottom: convertRemToPixel(0.0625),
  },
  h6: {
    fontSize: convertRemToPixel(0.8),
    fontWeight: "semibold",
    marginTop: convertRemToPixel(1),
    marginBottom: convertRemToPixel(0.0625),
  },
  // paragraph
  "p:not(table p)": {
    fontSize: convertRemToPixel(0.8),
  },
  "p:not(ol p, ul p)": {
    marginTop: convertRemToPixel(0.25),
    marginBottom: convertRemToPixel(0.0625),
  },
};

const EDITOR_PDF_LIST_STYLES: Styles = {
  "ul, ol": {
    fontSize: convertRemToPixel(0.8),
    marginHorizontal: -20,
  },
  "ol p, ul p": {
    marginVertical: 0,
  },
  "ol li, ul li": {
    marginTop: convertRemToPixel(0.45),
  },
  "ul ul, ul ol, ol ol, ol ul": {
    marginVertical: 0,
  },
  "ul[data-type='taskList']": {
    position: "relative",
  },
  "div.input-checkbox": {
    position: "absolute",
    top: convertRemToPixel(0.15),
    left: -convertRemToPixel(1.2),
    height: convertRemToPixel(0.75),
    width: convertRemToPixel(0.75),
    borderWidth: "1.5px",
    borderStyle: "solid",
    borderRadius: convertRemToPixel(0.125),
  },
  "div.input-checkbox:not(.checked)": {
    backgroundColor: "#ffffff",
    borderColor: "#171717",
  },
  "div.input-checkbox.checked": {
    backgroundColor: "#3f76ff",
    borderColor: "#3f76ff",
  },
  "ul li[data-checked='true'] p": {
    color: "#a3a3a3",
  },
};

const EDITOR_PDF_CODE_STYLES: Styles = {
  // code block
  "[data-node-type='code-block']": {
    marginVertical: convertRemToPixel(0.5),
    padding: convertRemToPixel(1),
    borderRadius: convertRemToPixel(0.5),
    backgroundColor: "#f7f7f7",
    fontSize: convertRemToPixel(0.7),
  },
  // inline code block
  "[data-node-type='inline-code-block']": {
    margin: 0,
    paddingVertical: convertRemToPixel(0.25 / 4 + 0.25 / 8),
    paddingHorizontal: convertRemToPixel(0.375),
    border: "0.5px solid #e5e5e5",
    borderRadius: convertRemToPixel(0.25),
    backgroundColor: "#e8e8e8",
    color: "#f97316",
    fontSize: convertRemToPixel(0.7),
  },
};

const EDITOR_PDF_DOCUMENT_STYLESHEET = StyleSheet.create({
  ...EDITOR_PDF_FONT_FAMILY_STYLES,
  ...EDITOR_PDF_TYPOGRAPHY_STYLES,
  ...EDITOR_PDF_LIST_STYLES,
  ...EDITOR_PDF_CODE_STYLES,
  // quote block
  blockquote: {
    borderLeft: "3px solid gray",
    paddingLeft: convertRemToPixel(1),
    marginTop: convertRemToPixel(0.625),
    marginBottom: 0,
    marginHorizontal: 0,
  },
  img: {
    marginVertical: 0,
    borderRadius: convertRemToPixel(0.375),
  },
  // divider
  "div[data-type='horizontalRule']": {
    marginVertical: convertRemToPixel(1),
    height: 1,
    width: "100%",
    backgroundColor: "gray",
  },
  // mention block
  "[data-node-type='mention-block']": {
    margin: 0,
    color: "#3f76ff",
    backgroundColor: "#3f76ff33",
    paddingHorizontal: convertRemToPixel(0.375),
  },
  // table
  table: {
    marginTop: convertRemToPixel(0.5),
    marginBottom: convertRemToPixel(1),
    marginHorizontal: 0,
  },
  "table td": {
    padding: convertRemToPixel(0.625),
    border: "1px solid #e5e5e5",
  },
  "table p": {
    fontSize: convertRemToPixel(0.7),
  },
});

Font.register({
  family: "Amiri",
  fonts: [
    { src: amiriRegular, fontWeight: 400 },
    { src: amiriBold, fontWeight: 700 },
    { src: amiriItalic, fontWeight: 400, fontStyle: "italic" },
    { src: amiriBoldItalic, fontWeight: 700, fontStyle: "italic" },
  ],
});
Font.register({
  family: "Inter",
  fonts: [
    { src: interThin, fontWeight: "thin" },
    { src: interThin, fontWeight: "thin", fontStyle: "italic" },
    { src: interUltraLight, fontWeight: "ultralight" },
    { src: interUltraLight, fontWeight: "ultralight", fontStyle: "italic" },
    { src: interLight, fontWeight: "light" },
    { src: interLight, fontWeight: "light", fontStyle: "italic" },
    { src: interRegular, fontWeight: "normal" },
    { src: interRegular, fontWeight: "normal", fontStyle: "italic" },
    { src: interMedium, fontWeight: "medium" },
    { src: interMedium, fontWeight: "medium", fontStyle: "italic" },
    { src: interSemibold, fontWeight: "semibold" },
    { src: interSemibold, fontWeight: "semibold", fontStyle: "italic" },
    { src: interBold, fontWeight: "bold" },
    { src: interBold, fontWeight: "bold", fontStyle: "italic" },
    { src: interUltraBold, fontWeight: "ultrabold" },
    { src: interUltraBold, fontWeight: "ultrabold", fontStyle: "italic" },
    { src: interHeavy, fontWeight: "heavy" },
    { src: interHeavy, fontWeight: "heavy", fontStyle: "italic" },
  ],
});

type Props = {
  content: string;
  pageFormat: PageProps["size"];
  locale?: string;
};

export function PDFDocument(props: Props) {
  const { content, pageFormat, locale = "en" } = props;

  return (
    <Document>
      <Page
        size={pageFormat}
        style={{
          backgroundColor: "#ffffff",
          padding: 64,
        }}
      >
        <Html
          stylesheet={EDITOR_PDF_DOCUMENT_STYLESHEET}
          renderers={{
            p: PDFBlock,
            h1: PDFBlock,
            h2: PDFBlock,
            h3: PDFBlock,
            h4: PDFBlock,
            h5: PDFBlock,
            h6: PDFBlock,
            div: PDFBlock,
            li: (item) => <PDFListItem {...item} locale={locale} />,
          }}
        >
          {content}
        </Html>
      </Page>
    </Document>
  );
}

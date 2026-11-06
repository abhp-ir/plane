// @vitest-environment jsdom
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { getBase64Image, getEditorAssetSrc } from "@plane/utils";
import { useParseEditorContent } from "./use-parse-editor-content";

vi.mock("@plane/utils", async (original) => ({
  ...(await original<typeof import("@plane/utils")>()),
  getBase64Image: vi.fn(async () => "data:image/png;base64,cGl4ZWw="),
}));
vi.mock("@/hooks/store/use-member", () => ({ useMember: () => ({ getUserDetails: () => undefined }) }));
vi.mock("@/hooks/use-additional-editor-mention", () => ({
  useAdditionalEditorMention: () => ({ parseAdditionalEditorContent: () => undefined }),
}));

it("exports native asset IDs and external URLs, removes excluded images and propagates conversion failures", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  let parse: ReturnType<typeof useParseEditorContent>["replaceCustomComponentsFromHTMLContent"] | undefined;
  let parseMarkdown: ReturnType<typeof useParseEditorContent>["replaceCustomComponentsFromMarkdownContent"] | undefined;
  function Fixture() {
    const parser = useParseEditorContent({
      projectId: "project",
      workspaceSlug: "workspace",
    });
    parse = parser.replaceCustomComponentsFromHTMLContent;
    parseMarkdown = parser.replaceCustomComponentsFromMarkdownContent;
    return null;
  }
  try {
    await act(async () => root.render(createElement(Fixture)));
    if (!parse) throw new Error("Hook did not mount");
    const asset = "2f7c2a11-922b-4e2b-801e-44492b72a4bf";
    const html = `<image-component src="${asset}"></image-component><img src="${asset}"><img src="https://images.example.test/image.png">`;
    const result = await parse({ htmlContent: html });
    expect(getBase64Image).toHaveBeenCalledWith(
      getEditorAssetSrc({ assetId: asset, projectId: "project", workspaceSlug: "workspace" })
    );
    expect(getBase64Image).toHaveBeenCalledWith("https://images.example.test/image.png");
    expect(result.match(/data:image\/png/g)).toHaveLength(3);
    expect(
      vi
        .mocked(getBase64Image)
        .mock.calls.filter(
          ([url]) => url === getEditorAssetSrc({ assetId: asset, projectId: "project", workspaceSlug: "workspace" })
        )
    ).toHaveLength(2);
    vi.mocked(getBase64Image).mockClear();
    expect(await parse({ htmlContent: html, noAssets: true })).not.toContain("img");
    expect(getBase64Image).not.toHaveBeenCalled();
    if (!parseMarkdown) throw new Error("Markdown hook did not mount");
    const between = "متن فارسی می‌رود ABC-42";
    const markdown = `<image-component src="${asset}"></image-component>${between}<image-component src="https://images.example.test/image.png"></image-component>`;
    expect(parseMarkdown({ markdownContent: markdown })).toBe(
      `<img src="${getEditorAssetSrc({ assetId: asset, projectId: "project", workspaceSlug: "workspace" })}" >${between}<img src="https://images.example.test/image.png" >`
    );
    expect(parseMarkdown({ markdownContent: markdown, noAssets: true })).toBe(between);
    expect(
      parseMarkdown({
        markdownContent: `<issue-embed-component></issue-embed-component>${between}<issue-embed-component></issue-embed-component>`,
      })
    ).toBe(between);
    vi.mocked(getBase64Image).mockRejectedValueOnce(new Error("offline"));
    await expect(parse({ htmlContent: `<image-component src="${asset}"></image-component>` })).rejects.toThrow(
      "offline"
    );
  } finally {
    await act(async () => root.unmount());
    host.remove();
    vi.unstubAllGlobals();
  }
});

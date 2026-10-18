/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { EIssueServiceType } from "@plane/types";
import { IssueAttachmentsListItem } from "../attachment/attachment-list-item";
import { IssueAttachmentActionButton } from "./attachments/quick-action-button";
import { IssueLinksActionButton } from "./links/quick-action-button";

vi.mock("@plane/i18n", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock("@/hooks/store/use-issue-detail", () => ({
  useIssueDetail: () => ({
    toggleIssueLinkModal: vi.fn(),
    fetchActivities: vi.fn(),
    setLastWidgetAction: vi.fn(),
    toggleDeleteAttachmentModal: vi.fn(),
    attachment: {
      getAttachmentById: () => ({
        attributes: { name: "report.pdf", size: 256 },
        asset_url: "http://127.0.0.1:19000/report.pdf",
      }),
    },
  }),
}));
vi.mock("@/hooks/use-file-size", () => ({ useFileSize: () => ({ maxFileSize: 1024 }) }));
vi.mock("./attachments/helper", () => ({
  useAttachmentOperations: () => ({ operations: { create: vi.fn() } }),
}));
vi.mock("@/hooks/store/use-member", () => ({ useMember: () => ({ getUserDetails: vi.fn() }) }));
vi.mock("@/hooks/use-platform-os", () => ({ usePlatformOS: () => ({ isMobile: false }) }));
vi.mock("@/components/icons", () => ({ getFileIcon: () => null }));
vi.mock("@/components/dropdowns/member/avatar", () => ({ ButtonAvatars: () => null }));

const issueServiceType = EIssueServiceType.ISSUES;
const attachmentProps = { workspaceSlug: "fixture", projectId: "project", issueId: "issue", issueServiceType };

describe("native work-item widget actions", () => {
  it("uses the custom link button itself and forwards its disabled state", () => {
    const html = renderToStaticMarkup(
      createElement(IssueLinksActionButton, {
        issueServiceType,
        disabled: true,
        customButton: createElement("button", {}, "Add link"),
      })
    );
    expect(html.match(/<button\b/g)).toHaveLength(1);
    expect(html).toContain('disabled=""');
  });

  it("names the default icon-only link button", () => {
    const html = renderToStaticMarkup(createElement(IssueLinksActionButton, { issueServiceType }));
    expect(html).toContain('aria-label="issue.add.link"');
  });

  it("keeps the file input outside the custom native attachment button", () => {
    const html = renderToStaticMarkup(
      createElement(IssueAttachmentActionButton, {
        ...attachmentProps,
        disabled: true,
        customButton: createElement("button", {}, "Attach"),
      })
    );
    expect(html.match(/<button\b/g)).toHaveLength(1);
    expect(html).toContain('disabled=""');
    const input = html.indexOf("<input");
    expect(input).toBeGreaterThanOrEqual(0);
    expect(input < html.indexOf("<button") || input > html.indexOf("</button>")).toBe(true);
  });

  it("names the default icon-only attachment button", () => {
    const html = renderToStaticMarkup(createElement(IssueAttachmentActionButton, attachmentProps));
    expect(html).toContain('aria-label="common.attach"');
  });

  it("keeps the attachment link separate from its action-menu button", () => {
    const html = renderToStaticMarkup(createElement(IssueAttachmentsListItem, { attachmentId: "attachment" }));
    expect(html).toContain('href="http://127.0.0.1:19000/report.pdf"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html.indexOf("</a>")).toBeLessThan(html.indexOf("<button"));
  });
});

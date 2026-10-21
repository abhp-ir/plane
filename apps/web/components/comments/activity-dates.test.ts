// @vitest-environment jsdom
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { act, createElement, createRef } from "react";
import type { ComponentProps, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { expect, it, vi } from "vitest";
import type { EditorRefApi } from "@plane/editor";
import { initPromise, setLanguage, TranslationProvider } from "@plane/i18n";
import type { TCommentsOperations, TIssueComment, TNotification } from "@plane/types";
import { IssueAttachmentsDetail } from "../issues/attachment/attachment-detail";
import { IssueAttachmentsListItem } from "../issues/attachment/attachment-list-item";
import {
  BASE_NOTIFICATION_CONTENT_MAP,
  NotificationContent,
} from "../workspace-notifications/sidebar/notification-card/content";
import { NotificationItem } from "../workspace-notifications/sidebar/notification-card/item";
import { CommentCardDisplay } from "./card/display";

const mocks = vi.hoisted(() => ({ mutate: vi.fn(), read: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => "/owned/issue" }));
vi.mock("@plane/hooks", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@plane/hooks")>()),
  useHashScroll: () => ({ isHashMatch: false }),
}));
vi.mock("@makeplane/propel/components/tooltip", () => ({
  Tooltip: ({ label, children }: { label: string; children: ReactNode }) =>
    createElement("span", { "data-tooltip": label }, children),
}));
vi.mock("@/hooks/store/use-member", () => ({
  useMember: () => ({ getUserDetails: () => ({ display_name: "نگار ABC-42", avatar_url: "" }) }),
}));
vi.mock("@/hooks/store/use-issue-detail", () => ({
  useIssueDetail: () => ({
    attachment: { getAttachmentById: () => attachment },
    toggleDeleteAttachmentModal: mocks.mutate,
    getIsIssuePeeked: () => false,
    setPeekIssue: mocks.mutate,
  }),
}));
vi.mock("@/hooks/use-platform-os", () => ({ usePlatformOS: () => ({ isMobile: false }) }));
vi.mock("@/hooks/store/use-workspace", () => ({
  useWorkspace: () => ({ getWorkspaceBySlug: () => ({ id: "workspace" }) }),
}));
vi.mock("@/hooks/store/notifications", () => ({
  useWorkspaceNotifications: () => ({
    currentSelectedNotificationId: undefined,
    setCurrentSelectedNotificationId: mocks.mutate,
  }),
}));
vi.mock("@/hooks/store/notifications/use-notification", () => ({
  useNotification: () => ({ asJson: notification, markNotificationAsRead: mocks.read }),
}));
vi.mock("@/components/editor/lite-text", () => ({
  LiteTextEditor: ({ initialValue }: { initialValue: string }) =>
    createElement("div", { "data-content": initialValue }),
}));
vi.mock("@/components/dropdowns/member/avatar", () => ({ ButtonAvatars: () => null }));
vi.mock("@/components/icons", () => ({ getFileIcon: () => null }));
vi.mock("../issues/attachment/delete-attachment-modal", () => ({ IssueAttachmentDeleteModal: () => null }));
vi.mock("../workspace-notifications/sidebar/notification-card/options", () => ({ NotificationOption: () => null }));
vi.mock("./card/edit-form", () => ({ CommentCardEditForm: () => null }));
vi.mock("./comment-reaction", () => ({ CommentReactions: () => null }));
vi.mock("@plane/blocks/emoji-reaction", () => ({ EmojiReactionPicker: () => null }));

const date = "2025-03-20T22:00:00Z";
const attachment = {
  id: "asset",
  asset_url: "http://127.0.0.1:18000/retained.png",
  attributes: { name: "گزارش ABC-42.png", size: 68 },
  created_by: "creator",
  updated_by: "updater",
  updated_at: date,
};
// Only metadata is exercised; editor/store/network implementations are fixture boundaries.
const comment = {
  id: "comment",
  actor: "creator",
  actor_detail: { is_bot: false },
  created_at: date,
  updated_at: date,
  comment_html: "<p>می‌رود ABC-42</p>",
} as TIssueComment;
const operations = {
  userReactions: () => [],
  reactionIds: () => undefined,
  react: mocks.mutate,
  updateComment: mocks.mutate,
} as unknown as TCommentsOperations;
let notification: TNotification;

it.each([
  ["fa", "ذخیرهٔ تغییرات", "انصراف", "دیدگاه‌ها"],
  ["en", "Save changes", "Cancel", "Comments"],
] as const)("names %s comment edit actions without changing saved content", async (language, save, cancel, label) => {
  const { CommentCardEditForm } = await vi.importActual<typeof import("./card/edit-form")>("./card/edit-form");
  await initPromise;
  mocks.mutate.mockClear();
  const before = JSON.stringify(comment);
  try {
    await setLanguage(language);
    const markup = renderToStaticMarkup(
      createElement(
        TranslationProvider,
        null,
        createElement(CommentCardEditForm, {
          activityOperations: operations,
          comment,
          isEditing: true,
          readOnlyEditorRef: null,
          setIsEditing: mocks.mutate,
          workspaceId: "workspace",
          workspaceSlug: "owned",
        })
      )
    );
    expect(markup).toContain(`aria-label="${save}"`);
    expect(markup).toContain(`aria-label="${cancel}"`);
    expect(markup).toContain(`role="group" aria-label="${label}"`);
    expect(markup).toContain('data-content="&lt;p&gt;می‌رود ABC-42&lt;/p&gt;"');
    expect(JSON.stringify(comment)).toBe(before);
    expect(mocks.mutate).not.toHaveBeenCalled();
  } finally {
    await setLanguage("en");
  }
});

it.each([
  "comment",
  "attachment-list",
  "attachment-detail",
  "notification-start",
  "notification-due",
  "notification-snoozed",
])("updates the mounted %s date without mutating content, assets, read state or instants", async (surface) => {
  await initPromise;
  await setLanguage("en");
  mocks.mutate.mockClear();
  mocks.read.mockClear();
  notification = {
    id: "notification",
    title: "Metadata fixture",
    project: "project",
    workspace: "workspace",
    created_at: date,
    updated_at: date,
    created_by: "creator",
    updated_by: "creator",
    entity_identifier: "issue",
    entity_name: "issue",
    message_html: undefined,
    message: undefined,
    message_stripped: undefined,
    sender: undefined,
    receiver: "recipient",
    triggered_by: "creator",
    triggered_by_details: undefined,
    read_at: undefined,
    archived_at: undefined,
    snoozed_till: date,
    is_inbox_issue: false,
    is_mentioned_notification: false,
    data: {
      issue: {
        id: "issue",
        identifier: "FA",
        sequence_id: 42,
        name: "می‌رود ABC-42",
        state_name: "Custom English state",
        state_group: "started",
      },
      issue_activity: {
        id: "activity",
        actor: "creator",
        issue_comment: undefined,
        field:
          surface === "notification-due" ? "target_date" : surface === "notification-snoozed" ? "state" : "start_date",
        new_value: surface === "notification-snoozed" ? "Custom English state" : date,
        old_value: "",
        verb: "updated",
      },
    },
  } satisfies TNotification;
  const before = JSON.stringify({ comment, attachment, notification });
  const components: Record<string, ReactNode> = {
    comment: createElement(CommentCardDisplay, {
      comment,
      activityOperations: operations,
      disabled: true,
      entityId: "issue",
      projectId: "project",
      readOnlyEditorRef: createRef<EditorRefApi>(),
      showAccessSpecifier: false,
      workspaceId: "workspace",
      workspaceSlug: "owned",
    }),
    "attachment-list": createElement(IssueAttachmentsListItem, { attachmentId: "asset", disabled: true }),
    "attachment-detail": createElement(IssueAttachmentsDetail, {
      attachmentId: "asset",
      disabled: true,
      attachmentHelpers: {} as ComponentProps<typeof IssueAttachmentsDetail>["attachmentHelpers"],
    }),
    "notification-start": createElement(NotificationContent, {
      notification,
      workspaceId: "workspace",
      workspaceSlug: "owned",
      projectId: "project",
    }),
    "notification-due": createElement(NotificationContent, {
      notification,
      workspaceId: "workspace",
      workspaceSlug: "owned",
      projectId: "project",
    }),
    "notification-snoozed": createElement(NotificationItem, { notificationId: "notification", workspaceSlug: "owned" }),
  };
  const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previous = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const displayed = () =>
    [
      container.textContent,
      ...Array.from(container.querySelectorAll("[data-tooltip]"), (n) => n.getAttribute("data-tooltip")),
    ].join(" ");
  // Comment timestamps use the local day of the instant; date-only properties retain their saved day.
  const nextLocalDay = surface === "comment" && new Date(date).getDate() === 21;
  const englishDate = nextLocalDay ? "Mar 21, 2025" : "Mar 20, 2025";
  const persianDate = surface === "comment" ? (nextLocalDay ? "۱ فروردین ۱۴۰۴" : "۳۰ اسفند ۱۴۰۳") : "اسف ۳۰, ۱۴۰۳";
  try {
    await act(async () =>
      root.render(createElement(MemoryRouter, null, createElement(TranslationProvider, null, components[surface])))
    );
    expect(displayed()).toContain(englishDate);
    const originalHref = container.querySelector("a")?.getAttribute("href");
    await act(async () => setLanguage("fa"));
    expect(displayed()).toContain(persianDate);
    expect(displayed()).not.toContain(englishDate);
    if (surface === "comment")
      expect(container.querySelector("[data-content]")?.getAttribute("data-content")).toBe(comment.comment_html);
    if (surface.startsWith("attachment")) expect(container.querySelector("a")?.getAttribute("href")).toBe(originalHref);
    await act(async () => setLanguage("en"));
    expect(displayed()).toContain(englishDate);
    expect(JSON.stringify({ comment, attachment, notification })).toBe(before);
    expect(mocks.mutate).not.toHaveBeenCalled();
    expect(mocks.read).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
    container.remove();
    environment.IS_REACT_ACT_ENVIRONMENT = previous;
    await setLanguage("en");
  }
});

it.each(["start_date", "target_date"])("preserves the default locale and cleared %s value", (field) => {
  const data = { field, newValue: date, oldValue: "", verb: "updated" };
  expect(BASE_NOTIFICATION_CONTENT_MAP[field](data)?.value).toBe("Mar 20, 2025");
  expect(BASE_NOTIFICATION_CONTENT_MAP[field]({ ...data, newValue: "", oldValue: date })?.value).toBeUndefined();
  expect(data.newValue).toBe(date);
});

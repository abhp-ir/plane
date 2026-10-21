/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createElement } from "react";
import type { ComponentProps, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import { initPromise, setLanguage, TranslationProvider } from "@plane/i18n";
import type { IUserProfileData, IUserProfileProjectSegregation } from "@plane/types";
import ProfileIssuesTypePage from "../../app/(all)/[workspaceSlug]/(projects)/profile/[userId]/[profileViewId]/page";
import ProfileActivityPage from "../../app/(all)/[workspaceSlug]/(projects)/profile/[userId]/activity/page";
import { ProfilePriorityDistribution } from "./overview/priority-distribution";
import { ProfileStats } from "./overview/stats";
import { ProfileSidebar } from "./sidebar";
import { ProfileSidebarTime } from "./time";

vi.mock("next/navigation", () => ({ useParams: () => ({ workspaceSlug: "owned", userId: "user" }) }));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => createElement("a", { href }, children),
}));
vi.mock("@/hooks/use-current-time", () => ({
  useCurrentTime: () => ({ currentTime: new Date("2025-03-20T22:00:00Z") }),
}));
vi.mock("@/hooks/store/use-app-theme", () => ({
  useAppTheme: () => ({ profileSidebarCollapsed: false, toggleProfileSidebar: vi.fn() }),
}));
vi.mock("@/hooks/store/use-command-palette", () => ({
  useCommandPalette: () => ({ toggleProfileSettingsModal: vi.fn() }),
}));
vi.mock("@/hooks/store/use-project", () => ({
  useProject: () => ({ getProjectById: () => ({ name: "Project ABC-42", logo_props: {} }) }),
}));
vi.mock("@/hooks/store/user", () => ({
  useUser: () => ({ data: { id: "user" } }),
  useUserPermissions: () => ({ allowPermissions: () => false }),
}));
vi.mock("@/hooks/use-platform-os", () => ({ usePlatformOS: () => ({ isMobile: false }) }));
vi.mock("@/components/common/cover-image", () => ({ CoverImage: () => null }));
vi.mock("@plane/blocks/emoji-icon-picker", () => ({ Logo: () => null }));
vi.mock("@makeplane/propel/components/collapsible", () => ({
  Collapsible: ({ trigger, trailing, children }: { trigger: ReactNode; trailing: ReactNode; children: ReactNode }) =>
    createElement("section", null, trigger, trailing, children),
}));
vi.mock("@makeplane/propel/components/tooltip", () => ({
  Tooltip: ({ label, children }: { label: string; children: ReactNode }) =>
    createElement("span", { "data-tooltip": label }, children),
}));
vi.mock("@plane/blocks/charts/bar-chart", () => ({
  BarChart: (props: { data: unknown; bars: { label: string }[] }) =>
    createElement("div", { "data-chart": JSON.stringify(props.data) }, props.bars[0].label),
}));
vi.mock("@/components/core/page-title", () => ({
  PageHead: ({ title }: { title: string }) => createElement("span", { "data-title": title }),
}));
vi.mock("@/components/profile/profile-issues", () => ({
  ProfileIssuesPage: ({ type }: { type: string }) => createElement("span", { "data-view": type }),
}));
vi.mock("@/components/profile/activity/workspace-activity-list", () => ({ WorkspaceActivityListPage: () => null }));
vi.mock("@/components/profile/activity/download-button", () => ({ DownloadActivityButton: () => null }));

const profile: IUserProfileData = {
  created_issues: 10,
  assigned_issues: 8,
  subscribed_issues: 11,
  completed_issues: 2,
  pending_issues: 6,
  priority_distribution: [
    { priority: "high", priority_count: 4 },
    { priority: "medium", priority_count: 4 },
  ],
  state_distribution: [],
};
const details: IUserProfileProjectSegregation = {
  project_data: [{ id: "project", created_issues: 10, assigned_issues: 8, completed_issues: 2, pending_issues: 6 }],
  user_data: {
    avatar_url: "",
    cover_image_url: "",
    display_name: "Name ABC-42",
    first_name: "Sara",
    last_name: "آزمون",
    date_joined: new Date("2025-03-20T22:00:00Z"),
    user_timezone: "UTC",
  },
};
const render = (component: ReactNode) => renderToStaticMarkup(createElement(TranslationProvider, null, component));

afterEach(async () => {
  await setLanguage("en");
});

it.each(["fa", "en", "fa"] as const)(
  "localizes %s profile counts and priority display while preserving codes, values and links",
  async (language) => {
    await initPromise;
    await setLanguage(language);
    const before = structuredClone(profile);
    const html = render(createElement(ProfileStats, { userProfile: profile }));
    for (const count of language === "fa" ? ["۱۰", "۸", "۱۱"] : ["10", "8", "11"])
      expect(html).toContain(`>${count}</p>`);
    for (const view of ["created", "assigned", "subscribed"])
      expect(html).toContain(`href="/owned/profile/user/${view}"`);
    const chart = render(createElement(ProfilePriorityDistribution, { userProfile: profile }));
    expect(chart).toContain(language === "fa" ? "تعداد" : "Count");
    const data = JSON.parse(chart.match(/data-chart="([^"]+)"/)![1].replaceAll("&quot;", '"'));
    expect(data).toEqual([
      { key: "high", name: language === "fa" ? "بالا" : "High", count: 4 },
      { key: "medium", name: language === "fa" ? "متوسط" : "Medium", count: 4 },
    ]);
    expect(profile).toEqual(before);
  }
);

it.each([
  ["fa", "۲۲:۰۰", "۰۱:۳۰"],
  ["en", "22:00", "01:30"],
] as const)(
  "localizes %s clocks in the saved timezone without changing the instant or timezone ID",
  async (language, utc, tehran) => {
    await initPromise;
    await setLanguage(language);
    expect(render(createElement(ProfileSidebarTime, { timeZone: "UTC" }))).toContain(`<bdi>${utc}</bdi>`);
    expect(render(createElement(ProfileSidebarTime, { timeZone: "Asia/Tehran" }))).toContain(`<bdi>${tehran}</bdi>`);
    expect(render(createElement(ProfileSidebarTime, { timeZone: "UTC" }))).toContain(
      'dir="ltr" class="text-secondary">UTC</bdi>'
    );
  }
);

it("localizes the expanded project summary while preserving editable names and source counts", async () => {
  await initPromise;
  await setLanguage("fa");
  const before = structuredClone(details);
  const html = render(createElement(ProfileSidebar, { userProjectsData: details }));
  for (const text of ["ایجادشده", "واگذارشده", "در انتظار", "تکمیل‌شده", "۲۵٪", "۱۰", "۸", "۶", "۲"])
    expect(html).toContain(text);
  expect(html).toContain('data-tooltip="درصد تکمیل"');
  expect(html).toContain("<bdi>Project ABC-42</bdi>");
  expect(html).toContain("<bdi>Name ABC-42</bdi>");
  expect(details).toEqual(before);
});

it.each([
  ["assigned", "واگذارشده"],
  ["created", "ایجادشده"],
  ["subscribed", "دنبال‌شده"],
] as const)("localizes the %s profile title while retaining the canonical view", async (view, label) => {
  await initPromise;
  const props = { params: { profileViewId: view } } as ComponentProps<typeof ProfileIssuesTypePage>;
  await setLanguage("en");
  expect(render(createElement(ProfileIssuesTypePage, props))).toContain(
    `data-title="Profile - ${view[0].toUpperCase()}${view.slice(1)}"`
  );
  await setLanguage("fa");
  const html = render(createElement(ProfileIssuesTypePage, props));
  expect(html).toContain(`data-title="پروفایل - ${label}"`);
  expect(html).toContain(`data-view="${view}"`);
});

it("localizes the activity title and rejects inherited view names", async () => {
  await initPromise;
  await setLanguage("fa");
  expect(render(createElement(ProfileActivityPage))).toContain('data-title="پروفایل - فعالیت"');
  for (const view of ["toString", "constructor", "unknown"])
    expect(
      render(
        createElement(ProfileIssuesTypePage, { params: { profileViewId: view } } as ComponentProps<
          typeof ProfileIssuesTypePage
        >)
      )
    ).toBe("");
});

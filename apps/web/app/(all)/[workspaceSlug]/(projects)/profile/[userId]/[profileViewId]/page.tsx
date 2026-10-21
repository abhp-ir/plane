/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { useTranslation } from "@plane/i18n";
// components
import { PageHead } from "@/components/core/page-title";
import { ProfileIssuesPage } from "@/components/profile/profile-issues";
import type { Route } from "./+types/page";

const ProfilePageHeader = {
  assigned: "profile.tabs.assigned",
  created: "profile.tabs.created",
  subscribed: "profile.tabs.subscribed",
} as const;

function isValidProfileViewId(viewId: string): viewId is keyof typeof ProfilePageHeader {
  return Object.hasOwn(ProfilePageHeader, viewId);
}

function ProfileIssuesTypePage({ params }: Route.ComponentProps) {
  const { t } = useTranslation();
  const { profileViewId } = params;

  if (!isValidProfileViewId(profileViewId)) return null;

  const header = ProfilePageHeader[profileViewId];

  return (
    <>
      <PageHead title={`${t("profile.label")} - ${t(header)}`} />
      <ProfileIssuesPage type={profileViewId} />
    </>
  );
}

export default ProfileIssuesTypePage;

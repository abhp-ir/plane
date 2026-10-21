/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactElement } from "react";
import { useTranslation } from "@plane/i18n";
import { EInboxIssueSource } from "@plane/types";
import { ActivitySentence } from "./sentence";

export function WorkItemActivityChange({
  activity,
  actor,
  issue,
}: {
  activity: { verb: string; source_data?: { source: EInboxIssueSource } };
  actor: ReactElement;
  issue?: ReactElement;
}) {
  const { t } = useTranslation();
  const source = activity.source_data?.source;
  return (
    <ActivitySentence
      actor={actor}
      issue={issue}
      message={activity.verb === "created" ? "work_item_created" : "work_item_deleted"}
      origin={
        activity.verb === "created" && source && source !== EInboxIssueSource.IN_APP ? (
          <bdi className="font-medium">
            {source === EInboxIssueSource.EMAIL ? t("email") : source === EInboxIssueSource.FORMS ? t("forms") : source}
          </bdi>
        ) : undefined
      }
    />
  );
}

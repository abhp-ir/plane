/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import type { ReactElement, ReactNode } from "react";
import { HierarchyOutline } from "@makeplane/propel/icons";
// plane imports
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { renderLocalizedDateTime, calculateTimeAgo } from "@plane/utils";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { usePlatformOS } from "@/hooks/use-platform-os";
// local imports
import { IssueUser } from "../";
import { IssueCreatorDisplay } from "./issue-creator";

type TIssueActivityBlockComponent = {
  icon?: ReactNode;
  activityId: string;
  ends: "top" | "bottom" | undefined;
  children: ReactNode | ((actor: ReactElement) => ReactNode);
  customUserName?: string;
};

export function IssueActivityBlockComponent(props: TIssueActivityBlockComponent) {
  const { icon, activityId, ends, children, customUserName } = props;
  const { currentLocale } = useTranslation();
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);
  const { isMobile } = usePlatformOS();
  if (!activity) return <></>;
  const actor =
    !activity.field && activity.verb === "created" ? (
      <IssueCreatorDisplay activityId={activityId} customUserName={customUserName} />
    ) : (
      <IssueUser activityId={activityId} customUserName={customUserName} />
    );
  const timestamp = renderLocalizedDateTime(activity.created_at, currentLocale);
  return (
    <div
      className={`relative flex items-start gap-3 text-caption-sm-regular ${
        ends === "top" ? `pb-2` : ends === "bottom" ? `pt-2` : `py-2`
      }`}
    >
      <div className="absolute inset-y-0 start-[13px] w-px bg-layer-3" aria-hidden />
      <div className="z-[4] flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-subtle bg-layer-2 text-secondary shadow-raised-100">
        {icon ? icon : <HierarchyOutline className="h-3.5 w-3.5" />}
      </div>
      <div className="min-w-0 flex-1 break-words text-secondary">
        {typeof children === "function" ? (
          children(actor)
        ) : (
          <>
            {actor}
            <span> {children} </span>
          </>
        )}
        <span>
          <Tooltip
            label={`${timestamp.date}${currentLocale === "fa" ? "،" : ","} ${timestamp.time}`}
            disabled={isMobile}
          >
            <span className="whitespace-nowrap text-tertiary">
              {" "}
              {calculateTimeAgo(activity.created_at, currentLocale)}
            </span>
          </Tooltip>
        </span>
      </div>
    </div>
  );
}

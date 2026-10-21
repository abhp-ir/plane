/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactElement } from "react";
import { ISSUE_PRIORITIES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { renderFormattedDate } from "@plane/utils";
import { ActivitySentence } from "./sentence";

export const ACTIVITY_PROPERTY_LABELS = {
  name: "title",
  state: "state",
  priority: "priority",
  start_date: "start_date",
  target_date: "due_date",
};

type Props = {
  activity: { field?: string | null; new_value?: string | null };
  actor: ReactElement;
  issue?: ReactElement;
};

export function ActivityPropertyChange({ activity, actor, issue }: Props) {
  const { t, currentLocale } = useTranslation();
  if (!activity.field || !Object.hasOwn(ACTIVITY_PROPERTY_LABELS, activity.field)) return null;
  const property = ACTIVITY_PROPERTY_LABELS[activity.field as keyof typeof ACTIVITY_PROPERTY_LABELS];

  let value = activity.new_value;
  if (activity.new_value && (activity.field === "start_date" || activity.field === "target_date")) {
    value = renderFormattedDate(activity.new_value, currentLocale === "fa" ? "d MMMM yyyy" : undefined, currentLocale);
  } else if (activity.field === "priority") {
    const priority = ISSUE_PRIORITIES.find((option) => option.key === activity.new_value);
    if (priority) value = t(priority.key);
  }

  return (
    <ActivitySentence
      actor={actor}
      message={activity.new_value ? "property_set" : "property_removed"}
      property={t(property)}
      value={<bdi className="font-medium text-primary">{value}</bdi>}
      issue={issue}
    />
  );
}

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TAnalyticsTabsBase } from "@plane/types";
import { ChartXAxisProperty, ChartYAxisMetric } from "@plane/types";

export interface IInsightField {
  key: string;
  i18nKey: string;
  i18nProps?: {
    entity?: string;
    entityPlural?: string;
    prefix?: string;
    suffix?: string;
    [key: string]: unknown;
  };
}

export const ANALYTICS_INSIGHTS_FIELDS: Record<TAnalyticsTabsBase, IInsightField[]> = {
  overview: [
    {
      key: "total_users",
      i18nKey: "workspace_analytics.total",
      i18nProps: {
        entity: "common.users",
      },
    },
    {
      key: "total_admins",
      i18nKey: "workspace_analytics.total",
      i18nProps: {
        entity: "common.admins",
      },
    },
    {
      key: "total_members",
      i18nKey: "workspace_analytics.total",
      i18nProps: {
        entity: "common.members",
      },
    },
    {
      key: "total_guests",
      i18nKey: "workspace_analytics.total",
      i18nProps: {
        entity: "common.guests",
      },
    },
    {
      key: "total_projects",
      i18nKey: "workspace_analytics.total",
      i18nProps: {
        entity: "common.projects",
      },
    },
    {
      key: "total_work_items",
      i18nKey: "workspace_analytics.total",
      i18nProps: {
        entity: "common.work_items",
      },
    },
    {
      key: "total_cycles",
      i18nKey: "workspace_analytics.total",
      i18nProps: {
        entity: "common.cycles",
      },
    },
    {
      key: "total_intake",
      i18nKey: "workspace_analytics.total",
      i18nProps: {
        entity: "sidebar.intake",
      },
    },
  ],
  "work-items": [
    {
      key: "total_work_items",
      i18nKey: "workspace_analytics.total",
    },
    {
      key: "started_work_items",
      i18nKey: "workspace_analytics.started_work_items",
    },
    {
      key: "backlog_work_items",
      i18nKey: "workspace_analytics.backlog_work_items",
    },
    {
      key: "un_started_work_items",
      i18nKey: "workspace_analytics.un_started_work_items",
    },
    {
      key: "completed_work_items",
      i18nKey: "workspace_analytics.completed_work_items",
    },
  ],
};

export const ANALYTICS_DURATION_FILTER_OPTIONS = [
  {
    name: "Yesterday",
    value: "yesterday",
  },
  {
    name: "Last 7 days",
    value: "last_7_days",
  },
  {
    name: "Last 30 days",
    value: "last_30_days",
  },
  {
    name: "Last 3 months",
    value: "last_3_months",
  },
];

export const ANALYTICS_X_AXIS_VALUES: { value: ChartXAxisProperty; label: string; i18nKey: string }[] = [
  {
    value: ChartXAxisProperty.STATES,
    label: "State name",
    i18nKey: "common.state",
  },
  {
    value: ChartXAxisProperty.STATE_GROUPS,
    label: "State group",
    i18nKey: "common.state_group",
  },
  {
    value: ChartXAxisProperty.PRIORITY,
    label: "Priority",
    i18nKey: "common.priority",
  },
  {
    value: ChartXAxisProperty.LABELS,
    label: "Label",
    i18nKey: "common.label",
  },
  {
    value: ChartXAxisProperty.ASSIGNEES,
    label: "Assignee",
    i18nKey: "common.assignee",
  },
  {
    value: ChartXAxisProperty.ESTIMATE_POINTS,
    label: "Estimate point",
    i18nKey: "project_settings.estimates.systems.points.label",
  },
  {
    value: ChartXAxisProperty.CYCLES,
    label: "Cycle",
    i18nKey: "common.cycle",
  },
  {
    value: ChartXAxisProperty.MODULES,
    label: "Module",
    i18nKey: "common.module",
  },
  {
    value: ChartXAxisProperty.COMPLETED_AT,
    label: "Completed date",
    i18nKey: "common.completed_on",
  },
  {
    value: ChartXAxisProperty.TARGET_DATE,
    label: "Due date",
    i18nKey: "due_date",
  },
  {
    value: ChartXAxisProperty.START_DATE,
    label: "Start date",
    i18nKey: "start_date",
  },
  {
    value: ChartXAxisProperty.CREATED_AT,
    label: "Created date",
    i18nKey: "project_modules.order_by.created_at",
  },
];

export const ANALYTICS_Y_AXIS_VALUES: { value: ChartYAxisMetric; label: string; i18nKey: string }[] = [
  {
    value: ChartYAxisMetric.WORK_ITEM_COUNT,
    label: "Work item",
    i18nKey: "common.work_item",
  },
  {
    value: ChartYAxisMetric.ESTIMATE_POINT_COUNT,
    label: "Estimate",
    i18nKey: "common.estimate",
  },
  {
    value: ChartYAxisMetric.EPIC_WORK_ITEM_COUNT,
    label: "Epic",
    i18nKey: "common.epic",
  },
];

export const ANALYTICS_V2_DATE_KEYS = ["completed_at", "target_date", "start_date", "created_at"];

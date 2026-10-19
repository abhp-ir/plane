/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { eachDayOfInterval, isToday } from "date-fns";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { cn, formatDateForLocale, getCalendarPreferences, renderFormattedPayloadDate } from "@plane/utils";
import { useUserProfile } from "@/hooks/store/user";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";

export const GanttDayColumns = observer(function GanttDayColumns(props: { startDate: Date; endDate: Date }) {
  const { currentLocale, t } = useTranslation();
  const { data } = useUserProfile();
  const { currentViewData } = useTimeLineChartStore();
  const { workingDays } = getCalendarPreferences(data, currentLocale);
  return (
    <div className="flex h-full w-full flex-grow" aria-hidden="true">
      {eachDayOfInterval({ start: props.startDate, end: props.endDate }).map((date) => {
        const working = workingDays.includes(date.getDay());
        return (
          <div
            key={date.getTime()}
            data-date={renderFormattedPayloadDate(date)}
            data-working-day={working}
            title={`${formatDateForLocale(date, "EEEE d MMMM yyyy", currentLocale)} — ${t(working ? "working_day" : "non_working_day")}`}
            className={cn("h-full flex-shrink-0 overflow-hidden outline-[0.25px] outline-subtle", {
              "bg-surface-2": !working,
              "bg-accent-primary/20": isToday(date),
            })}
            style={{ width: currentViewData?.data.dayWidth }}
          />
        );
      })}
    </div>
  );
});

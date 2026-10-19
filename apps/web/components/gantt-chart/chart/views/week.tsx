/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane utils
import {
  cn,
  formatDateForLocale,
  getCalendarPreferences,
  getWeekdayLabel,
  renderFormattedPayloadDate,
} from "@plane/utils";
import { useTranslation } from "@plane/i18n";
import { useUserProfile } from "@/hooks/store/user";
import { GanttDayColumns } from "./day-columns";
// hooks
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
//
import { HEADER_HEIGHT } from "../../constants";
import type { IWeekBlock } from "../../views";

export const WeekChartView = observer(function WeekChartView(_props: any) {
  const { currentViewData, renderView } = useTimeLineChartStore();
  const weekBlocks: IWeekBlock[] = renderView;
  const { currentLocale, t } = useTranslation();
  const { data } = useUserProfile();
  const { workingDays } = getCalendarPreferences(data, currentLocale);

  return (
    <div className={`absolute top-0 left-0 flex h-max min-h-full w-max`}>
      {currentViewData &&
        weekBlocks?.map((block) => (
          <div
            key={`month-${block?.startDate.toString()}-${block?.endDate.toString()}`}
            className="relative flex flex-col outline-[0.25px] outline-subtle-1"
          >
            {/** Header Div */}
            <div
              className="sticky top-0 z-[5] w-full flex-shrink-0 bg-surface-1 outline-[1px] outline-subtle-1"
              style={{
                height: `${HEADER_HEIGHT}px`,
              }}
            >
              {/** Main Months Title */}
              <div className="inline-flex h-7 w-full justify-between">
                <div
                  className="sticky z-[1] m-1 flex items-center bg-surface-1 px-3 py-1 text-13 font-regular whitespace-nowrap text-secondary capitalize"
                  style={{
                    left: "var(--gantt-sidebar-width)",
                  }}
                >
                  <bdi>{block?.title}</bdi>
                </div>
                <div className="sticky px-3 py-2 text-11 whitespace-nowrap text-placeholder capitalize">
                  {t("common.week")} {new Intl.NumberFormat(currentLocale).format(block.weekNumber)}
                </div>
              </div>
              {/** Days Sub title */}
              <div className="flex h-5 w-full">
                {block?.children?.map((weekDay) => (
                  <div
                    key={weekDay.date.getTime()}
                    title={`${formatDateForLocale(weekDay.date, "EEEE d MMMM yyyy", currentLocale)} — ${t(workingDays.includes(weekDay.day) ? "working_day" : "non_working_day")}`}
                    className={cn(
                      "flex flex-shrink-0 justify-between p-1 text-center capitalize outline-[0.25px] outline-subtle-1",
                      {
                        "bg-accent-primary/20": weekDay.today,
                      }
                    )}
                    style={{ width: `${currentViewData?.data.dayWidth}px` }}
                  >
                    <div className="space-x-1 text-11 font-medium text-placeholder">
                      <abbr
                        aria-label={getWeekdayLabel(weekDay.day, currentLocale)}
                        title={getWeekdayLabel(weekDay.day, currentLocale)}
                        className="no-underline"
                      >
                        {getWeekdayLabel(weekDay.day, currentLocale, "narrow")}
                      </abbr>
                    </div>
                    <div className="space-x-1 text-11 font-medium">
                      <span
                        className={cn({
                          "rounded-sm bg-accent-primary px-1 text-on-color": weekDay.today,
                        })}
                      >
                        <time dateTime={renderFormattedPayloadDate(weekDay.date)}>
                          {formatDateForLocale(weekDay.date, "d", currentLocale)}
                        </time>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/** Day Columns */}
            <GanttDayColumns startDate={block.startDate} endDate={block.endDate} />
          </div>
        ))}
    </div>
  );
});

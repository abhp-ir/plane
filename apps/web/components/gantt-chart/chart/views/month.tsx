/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// components
import { cn, formatDateForLocale, renderFormattedPayloadDate } from "@plane/utils";
import { differenceInCalendarDays, max, min } from "date-fns";
import { useTranslation } from "@plane/i18n";
import { GanttDayColumns } from "./day-columns";
import { HEADER_HEIGHT } from "@/components/gantt-chart/constants";
// helpers
// hooks
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
// types
import type { IMonthView } from "../../views";

export const MonthChartView = observer(function MonthChartView(_props: any) {
  // chart hook
  const { currentViewData, renderView } = useTimeLineChartStore();
  const monthView: IMonthView = renderView;
  const { currentLocale, t } = useTranslation();

  if (!monthView) return <></>;

  const { months, weeks } = monthView;

  return (
    <div className="absolute top-0 left-0 flex h-max min-h-full w-max">
      {currentViewData && (
        <div className="relative flex flex-col outline-[0.25px] outline-subtle-1">
          {/** Header Div */}
          <div
            className="sticky top-0 z-[5] w-full flex-shrink-0 bg-surface-1"
            style={{
              height: `${HEADER_HEIGHT}px`,
            }}
          >
            {/** Main Month Title */}
            <div className="flex h-7">
              {months?.map((monthBlock) => (
                <div
                  key={`month-${monthBlock?.month}-${monthBlock?.year}`}
                  className="flex outline-[0.5px] outline-subtle-1"
                  data-month-start={renderFormattedPayloadDate(monthBlock.startDate)}
                  data-month-end={renderFormattedPayloadDate(monthBlock.endDate)}
                  style={{
                    width: `${(differenceInCalendarDays(min([monthBlock.endDate, currentViewData.data.endDate]), max([monthBlock.startDate, currentViewData.data.startDate])) + 1) * currentViewData.data.dayWidth}px`,
                  }}
                >
                  <div
                    className="sticky z-[1] m-1 flex items-center bg-surface-1 px-3 py-1 text-14 font-regular whitespace-nowrap text-secondary capitalize"
                    style={{
                      left: "var(--gantt-sidebar-width)",
                    }}
                  >
                    <bdi>{monthBlock?.title}</bdi>
                    {monthBlock.today && (
                      <span className={cn("ml-2 rounded-sm bg-accent-primary px-1 text-9 font-medium text-on-color")}>
                        {t("current")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/** Weeks Sub title */}
            <div className="flex h-5 w-full">
              {weeks?.map((weekBlock) => (
                <div
                  key={`sub-title-${weekBlock.startDate.toString()}-${weekBlock.endDate.toString()}`}
                  title={`${formatDateForLocale(weekBlock.startDate, "d MMMM yyyy", currentLocale)} – ${formatDateForLocale(weekBlock.endDate, "d MMMM yyyy", currentLocale)}`}
                  className={cn(
                    "flex flex-shrink-0 justify-between px-2 py-1 text-center capitalize outline-[0.25px] outline-subtle-1",
                    {
                      "bg-accent-primary/20": weekBlock.today,
                    }
                  )}
                  style={{ width: `${currentViewData?.data.dayWidth * 7}px` }}
                >
                  <div className="space-x-1 text-11 font-medium text-placeholder">
                    <span
                      className={cn({
                        "rounded-sm bg-accent-primary px-1 text-on-color": weekBlock.today,
                      })}
                    >
                      <bdi>
                        {formatDateForLocale(weekBlock.startDate, "d", currentLocale)}–
                        {formatDateForLocale(weekBlock.endDate, "d", currentLocale)}
                      </bdi>
                    </span>
                  </div>
                  <div className="space-x-1 text-11 font-medium">
                    {t("common.week")} {new Intl.NumberFormat(currentLocale).format(weekBlock.weekNumber)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/** Week Columns */}
          <GanttDayColumns startDate={currentViewData.data.startDate} endDate={currentViewData.data.endDate} />
        </div>
      )}
    </div>
  );
});

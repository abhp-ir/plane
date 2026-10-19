/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Popover, PopoverContent, PopoverTrigger } from "@makeplane/propel/components/popover";
import { ChevronLeftOutline, ChevronRightOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
import { formatDateForLocale, getCalendarDateLib } from "@plane/utils";
import { useCalendarView } from "@/hooks/store/use-calendar-view";
import type { ICycleIssuesFilter } from "@/store/issue/cycle";
import type { IModuleIssuesFilter } from "@/store/issue/module";
import type { IProjectIssuesFilter } from "@/store/issue/project";
import type { IProjectViewIssuesFilter } from "@/store/issue/project-views";

interface Props {
  issuesFilterStore: IProjectIssuesFilter | IModuleIssuesFilter | ICycleIssuesFilter | IProjectViewIssuesFilter;
}
export const CalendarMonthsDropdown = observer(function CalendarMonthsDropdown(props: Props) {
  const { issuesFilterStore } = props;
  const { t, currentLocale } = useTranslation();
  const calendar = getCalendarDateLib(currentLocale);
  const issueCalendarView = useCalendarView();
  const calendarLayout = issuesFilterStore.issueFilters?.displayFilters?.calendar?.layout ?? "month";
  const { activeMonthDate } = issueCalendarView.calendarFilters;
  const monthStart = calendar.startOfMonth(activeMonthDate);
  const format = (date: Date, token: string) => formatDateForLocale(date, token, currentLocale);

  const getWeekLayoutHeader = (): string => {
    const days = Object.values(issueCalendarView.allDaysOfActiveWeek(currentLocale) ?? {});
    const firstDay = days[0]?.date;
    const lastDay = days[days.length - 1]?.date;
    if (!firstDay || !lastDay) return t("common.week");
    if (
      calendar.getMonth(firstDay) === calendar.getMonth(lastDay) &&
      calendar.getYear(firstDay) === calendar.getYear(lastDay)
    )
      return format(firstDay, "MMMM yyyy");
    if (calendar.getYear(firstDay) !== calendar.getYear(lastDay))
      return `${format(firstDay, "MMM yyyy")} - ${format(lastDay, "MMM yyyy")}`;
    return `${format(firstDay, "MMM")} - ${format(lastDay, "MMM yyyy")}`;
  };

  const handleDateChange = (date: Date) => {
    issueCalendarView.updateCalendarFilters({ activeMonthDate: date });
  };

  return (
    <Popover>
      <PopoverTrigger
        disabled={calendarLayout === "week"}
        render={
          <button
            type="button"
            className="rounded-sm text-18 font-semibold focus-visible:outline-2 focus-visible:outline-accent-strong"
          >
            {calendarLayout === "month" ? format(activeMonthDate, "MMMM yyyy") : getWeekLayoutHeader()}
          </button>
        }
      />
      <PopoverContent variant="rich" side="bottom" align="start" collisionPadding={12}>
        <div className="w-56 divide-y divide-subtle-1">
          <div className="flex items-center justify-between gap-2 pb-3">
            <button
              type="button"
              aria-label={`${t("prev")} ${format(calendar.addYears(monthStart, -1), "yyyy")}`}
              className="grid size-6 place-items-center rounded-sm focus-visible:outline-2 focus-visible:outline-accent-strong"
              onClick={() => handleDateChange(calendar.addYears(monthStart, -1))}
            >
              <ChevronLeftOutline height={14} width={14} className="rtl:rotate-180" />
            </button>
            <span className="text-11">{format(activeMonthDate, "yyyy")}</span>
            <button
              type="button"
              aria-label={`${t("common.next")} ${format(calendar.addYears(monthStart, 1), "yyyy")}`}
              className="grid size-6 place-items-center rounded-sm focus-visible:outline-2 focus-visible:outline-accent-strong"
              onClick={() => handleDateChange(calendar.addYears(monthStart, 1))}
            >
              <ChevronRightOutline height={14} width={14} className="rtl:rotate-180" />
            </button>
          </div>
          <div className="grid grid-cols-4 items-stretch justify-items-stretch gap-4 pt-3">
            {Array.from({ length: 12 }, (_, month) => {
              const date = calendar.setMonth(monthStart, month);
              return (
                <button
                  key={format(date, "MMMM")}
                  type="button"
                  aria-label={format(date, "MMMM yyyy")}
                  aria-pressed={calendar.getMonth(activeMonthDate) === month}
                  className="rounded-sm py-0.5 text-11 hover:bg-layer-1 focus-visible:outline-2 focus-visible:outline-accent-strong"
                  onClick={() => handleDateChange(date)}
                >
                  {format(date, "MMM")}
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});

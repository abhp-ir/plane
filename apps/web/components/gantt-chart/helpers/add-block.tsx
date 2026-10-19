/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { addDays } from "date-fns";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { AddOutline } from "@makeplane/propel/icons";
// ui
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { setToast } from "@plane/blocks/toast";
import type { IBlockUpdateData, IGanttBlock } from "@plane/types";
// helpers
import { renderFormattedDate, renderFormattedPayloadDate } from "@plane/utils";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
//

type Props = {
  block: IGanttBlock;
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
};

export const ChartAddBlock = observer(function ChartAddBlock(props: Props) {
  const { block, blockUpdateHandler } = props;
  const { t, currentLocale } = useTranslation();
  // states
  const [isButtonVisible, setIsButtonVisible] = useState(false);
  const [buttonXPosition, setButtonXPosition] = useState(0);
  const [buttonStartDate, setButtonStartDate] = useState<Date | null>(null);
  // refs
  const containerRef = useRef<HTMLDivElement>(null);
  // hooks
  const { isMobile } = usePlatformOS();
  // chart hook
  const { currentViewData, currentView } = useTimeLineChartStore();

  const handleButtonClick = async () => {
    if (!currentViewData) return;

    const { startDate: chartStartDate, dayWidth } = currentViewData.data;
    const columnNumber = Math.floor(buttonXPosition / dayWidth);

    let numberOfDays = 1;

    if (currentView === "quarter") numberOfDays = 7;

    const startDate = addDays(chartStartDate, columnNumber);
    const endDate = addDays(startDate, numberOfDays);

    try {
      await blockUpdateHandler(block.data, {
        start_date: renderFormattedPayloadDate(startDate) ?? undefined,
        target_date: renderFormattedPayloadDate(endDate) ?? undefined,
        meta: block.meta,
      });
    } catch {
      setToast({
        type: "error",
        title: t("toast.error"),
        message: t("entity.update.failed", { entity: t("common.dates") }),
      });
    }
  };

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!currentViewData) return;

      setButtonXPosition(e.offsetX);

      const { startDate: chartStartDate, dayWidth } = currentViewData.data;
      const columnNumber = Math.floor(e.offsetX / dayWidth);

      const startDate = addDays(chartStartDate, columnNumber);
      setButtonStartDate(startDate);
    };

    container.addEventListener("mousemove", handleMouseMove);

    return () => {
      container?.removeEventListener("mousemove", handleMouseMove);
    };
  }, [currentViewData]);

  return (
    <div
      className="relative h-full w-full"
      onMouseEnter={() => setIsButtonVisible(true)}
      onMouseLeave={() => setIsButtonVisible(false)}
    >
      <div ref={containerRef} className="h-full w-full" />
      {isButtonVisible && (
        <Tooltip
          label={
            renderFormattedDate(buttonStartDate, currentLocale === "fa" ? "d MMMM yyyy" : undefined, currentLocale) ??
            ""
          }
          disabled={isMobile}
        >
          <button
            type="button"
            aria-label={`${t("common.add")}: ${t("common.dates")} ${renderFormattedDate(buttonStartDate, currentLocale === "fa" ? "d MMMM yyyy" : undefined, currentLocale) ?? ""}`}
            className="absolute top-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-sm border border-strong bg-layer-1 p-1.5 text-secondary hover:text-primary"
            style={{
              marginLeft: `${buttonXPosition}px`,
            }}
            onClick={handleButtonClick}
          >
            <AddOutline className="h-3.5 w-3.5" />
          </button>
        </Tooltip>
      )}
    </div>
  );
});

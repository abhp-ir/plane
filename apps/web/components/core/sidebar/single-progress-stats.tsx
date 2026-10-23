/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { useTranslation } from "@plane/i18n";

type TSingleProgressStatsProps = {
  title: React.ReactNode;
  completed: number;
  total: number;
  onClick?: () => void;
  selected?: boolean;
};

export function SingleProgressStats({ title, completed, total, onClick, selected = false }: TSingleProgressStatsProps) {
  const { t } = useTranslation();
  const Component = onClick ? "button" : "div";
  return (
    <Component
      type={onClick ? "button" : undefined}
      aria-pressed={onClick ? selected : undefined}
      className={`flex w-full items-center justify-between gap-4 rounded-xs p-1 text-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong ${
        onClick ? "cursor-pointer hover:bg-surface-2" : ""
      } ${selected ? "bg-layer-1" : ""}`}
      onClick={onClick}
    >
      <div className="w-4/6">{title}</div>
      <div className="flex w-2/6 items-center justify-end gap-1 px-2">
        <span className="h-5 text-end whitespace-nowrap">
          {t("common.charts.percentage_of_total", { percentage: total > 0 ? completed / total : 0, total })}
        </span>
      </div>
    </Component>
  );
}

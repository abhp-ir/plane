/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane package imports
import React from "react";
import { useTranslation } from "@plane/i18n";
import type { IAnalyticsResponseFields } from "@plane/types";
import { Loader } from "@plane/blocks/skeleton";

export type InsightCardProps = {
  data?: IAnalyticsResponseFields;
  label: string;
  isLoading?: boolean;
};

function InsightCard(props: InsightCardProps) {
  const { data, label, isLoading = false } = props;
  const { currentLocale } = useTranslation();
  const formatNumber = new Intl.NumberFormat(currentLocale === "ua" ? "uk-UA" : currentLocale).format;
  const count = data?.count ?? 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="text-13 text-tertiary">{label}</div>
      {!isLoading ? (
        <div className="flex flex-col gap-1">
          <div className="text-20 font-bold text-primary">{formatNumber(count)}</div>
        </div>
      ) : (
        <Loader.Item height="50px" width="100%" />
      )}
    </div>
  );
}

export default InsightCard;

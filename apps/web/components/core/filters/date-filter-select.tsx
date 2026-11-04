/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { useTranslation } from "@plane/i18n";
import { CalendarOutline } from "@makeplane/propel/icons";
// ui
import { CalendarAfterIcon, CalendarBeforeIcon } from "@plane/blocks/icons";
import { Select } from "@plane/blocks/select";

type Props = {
  title: string;
  value: string;
  onChange: (value: string) => void;
};

type DueDate = {
  name: string;
  value: string;
  icon: React.ReactNode;
};

const dueDateRange: DueDate[] = [
  {
    name: "before",
    value: "before",
    icon: <CalendarBeforeIcon className="h-4 w-4" />,
  },
  {
    name: "after",
    value: "after",
    icon: <CalendarAfterIcon className="h-4 w-4" />,
  },
  {
    name: "range",
    value: "range",
    icon: <CalendarOutline className="h-4 w-4" />,
  },
];

export function DateFilterSelect({ title, value, onChange }: Props) {
  const { t } = useTranslation();
  const formatOptionLabel = (name?: string) => (name ? t(`date_filters.${name}_field`, { field: title }) : title);
  const selected = dueDateRange.find((item) => item.value === value) ?? null;

  return (
    <Select<DueDate>
      getValues={() => dueDateRange}
      value={selected}
      onChange={onChange}
      getOptionValue={(option) => option.value}
      getOptionLabel={(option) => formatOptionLabel(option.name)}
      getOptionIcon={(option) => option.icon}
      showSearch={false}
      pinSelected={false}
      placeholder={formatOptionLabel()}
    >
      <Select.Trigger variant="select-md">
        <span className="flex items-center gap-2 text-11">
          {selected?.icon}
          <span>{formatOptionLabel(selected?.name)}</span>
        </span>
      </Select.Trigger>
    </Select>
  );
}

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { addDays } from "date-fns";
// ui
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import { DateSelect } from "@plane/blocks/property-select";
import { Dialog, DialogActions, DialogBody, DialogContent, DialogMain } from "@makeplane/propel/components/dialog";
import { useUserProfile } from "@/hooks/store/user";

export type InboxIssueSnoozeModalProps = {
  isOpen: boolean;
  value: Date | undefined;
  projectTimezone: string | undefined;
  onConfirm: (value: Date) => void;
  handleClose: () => void;
};

// `date`'s calendar day in `timeZone` (browser zone if unset), as a local-midnight Date (what the calendar compares against).
const getDayInTimezone = (date: Date, timeZone: string | undefined) => {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value);
  return new Date(part("year"), part("month") - 1, part("day"));
};

export function InboxIssueSnoozeModal(props: InboxIssueSnoozeModalProps) {
  const { isOpen, handleClose, value, projectTimezone, onConfirm } = props;
  // states
  const [pickedDate, setPickedDate] = useState<Date | undefined>();
  //hooks
  const { t } = useTranslation();
  const { data: userProfile } = useUserProfile();
  // derived values
  // A snooze ends at 00:00 of the picked day in the project timezone, so any day that has already
  // started there would lapse at once. The pick is cleared on close because this modal stays
  // mounted across intake items.
  const tomorrow = addDays(getDayInTimezone(new Date(), projectTimezone), 1);
  const snoozedDay = value ? getDayInTimezone(new Date(value), projectTimezone) : undefined;
  const date = pickedDate ?? (snoozedDay && snoozedDay >= tomorrow ? snoozedDay : tomorrow);

  const onClose = () => {
    setPickedDate(undefined);
    handleClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent size="xs" aria-label={t("inbox_issue.actions.snooze")}>
        <DialogMain>
          <DialogBody>
            <DateSelect
              variant="select-md"
              value={date}
              onChange={(selected) => {
                if (!selected) return;
                setPickedDate(selected);
              }}
              minDate={tomorrow}
              weekStartsOn={userProfile?.start_of_the_week}
              testId="intake-snooze-date-select"
            />
          </DialogBody>
        </DialogMain>
        <DialogActions>
          <Button
            variant="primary"
            size="sm"
            stretch="auto"
            onClick={() => {
              onClose();
              onConfirm(date);
            }}
            label={t("inbox_issue.actions.snooze")}
          />
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}

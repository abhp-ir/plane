/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState, useEffect } from "react";
import { CloudOff, Dot } from "lucide-react";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { Badge } from "@makeplane/propel/components/badge";
import { useTranslation } from "@plane/i18n";

type Props = {
  syncStatus: "syncing" | "synced" | "error";
};

const BADGE_CONTENT = {
  syncing: {
    label: "page_editor.syncing",
    tooltipLabel: "page_editor.syncing_description",
  },
  error: {
    label: "page_editor.connection_lost",
    tooltipLabel: "page_editor.connection_lost_description",
  },
};

export function PageSyncingBadge({ syncStatus }: Props) {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(syncStatus !== "synced");

  // Runs once per status change. The pending hide is cancelled if the status moves on (or the badge
  // unmounts) before it fires, so a stale timer can't hide the badge during a later sync.
  useEffect(() => {
    if (syncStatus !== "synced") {
      setIsVisible(true);
      return;
    }
    // Delay hiding to allow exit animation to complete
    const timeoutId = setTimeout(() => {
      setIsVisible(false);
    }, 300); // match animation duration
    return () => clearTimeout(timeoutId);
  }, [syncStatus]);

  if (!isVisible || syncStatus === "synced") return null;

  // The synced early-return above guarantees this key exists
  const content = BADGE_CONTENT[syncStatus];

  return (
    <Tooltip label={t(content.tooltipLabel)} layout="stacked">
      <span className="animate-quickFadeIn">
        <Badge
          variant={syncStatus === "syncing" ? "brand" : "danger"}
          size="sm"
          startIcon={syncStatus === "syncing" ? <Dot className="size-4" /> : <CloudOff className="size-4" />}
          label={t(content.label)}
        />
      </span>
    </Tooltip>
  );
}

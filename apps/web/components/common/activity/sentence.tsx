/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactElement } from "react";
import { i18nInstance, Trans, useTranslation } from "@plane/i18n";

type Props = {
  message:
    | "property_set"
    | "property_removed"
    | "description_edited"
    | "work_item_created"
    | "work_item_deleted"
    | "collection_assigned"
    | "collection_removed";
  actor: ReactElement;
  property?: string;
  value?: ReactElement;
  issue?: ReactElement;
  origin?: ReactElement;
  kind?: "cycles" | "modules";
};

export function ActivitySentence({ message, actor, property, value, issue, origin, kind }: Props) {
  const { currentLocale } = useTranslation();
  return (
    <Trans
      i18n={i18nInstance}
      t={i18nInstance.getFixedT(currentLocale)}
      i18nKey={`activity_messages.${message}`}
      values={{ property, showIssue: !!issue, hasSource: !!origin, kind }}
      components={{ actor, value: value ?? <></>, issue: issue ?? <></>, origin: origin ?? <></> }}
    />
  );
}

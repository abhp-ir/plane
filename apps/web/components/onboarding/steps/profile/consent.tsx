/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Checkbox } from "@makeplane/propel/components/checkbox";
import { useTranslation } from "@plane/i18n";

type Props = {
  isChecked: boolean;
  handleChange: (checked: boolean) => void;
};

export function MarketingConsent({ isChecked, handleChange }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center gap-1.5">
      <Checkbox id="marketing-consent" checked={isChecked} onCheckedChange={handleChange} />
      <label htmlFor="marketing-consent" className="text-13 text-tertiary">
        {t("onboarding.marketing_consent")}
      </label>
    </div>
  );
}

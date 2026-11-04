/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import Link from "next/link";
import { EAuthModes } from "@plane/constants";
import { i18nInstance, Trans, useTranslation } from "@plane/i18n";

interface TermsAndConditionsProps {
  authType?: EAuthModes;
}

// Constants for better maintainability
const LEGAL_LINKS = {
  termsOfService: "https://plane.so/legals/terms-and-conditions",
  privacyPolicy: "https://plane.so/legals/privacy-policy",
} as const;

// Reusable link component to reduce duplication
function LegalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-secondary" target="_blank" rel="noopener noreferrer">
      <span className="text-13 font-medium underline hover:cursor-pointer">{children}</span>
    </Link>
  );
}

export function TermsAndConditions({ authType = EAuthModes.SIGN_IN }: TermsAndConditionsProps) {
  const { t, currentLocale } = useTranslation();
  return (
    <div className="flex items-center justify-center">
      <p dir="auto" className="text-center text-13 whitespace-pre-line text-tertiary">
        <Trans
          i18n={i18nInstance}
          t={i18nInstance.getFixedT(currentLocale)}
          i18nKey={authType === EAuthModes.SIGN_UP ? "auth.legal.sign_up" : "auth.legal.sign_in"}
          components={{
            terms: <LegalLink href={LEGAL_LINKS.termsOfService}>{t("auth.legal.terms_of_service")}</LegalLink>,
            privacy: <LegalLink href={LEGAL_LINKS.privacyPolicy}>{t("auth.legal.privacy_policy")}</LegalLink>,
          }}
        />
      </p>
    </div>
  );
}

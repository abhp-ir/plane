/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { CyclesOutline, ModuleOutline, PagesOutline, ViewsOutline, WorkItemsOutline } from "@makeplane/propel/icons";
import type { ISvgIcons } from "@plane/blocks/icons";
import { i18nInstance, Trans, useTranslation } from "@plane/i18n";
// types
import type { TTourSteps } from "./root";

const sidebarOptions: {
  key: TTourSteps;
  label: string;
  Icon: React.FC<ISvgIcons>;
}[] = [
  {
    key: "work-items",
    label: "work_items",
    Icon: WorkItemsOutline,
  },
  {
    key: "cycles",
    label: "cycles",
    Icon: CyclesOutline,
  },
  {
    key: "modules",
    label: "modules",
    Icon: ModuleOutline,
  },
  {
    key: "views",
    label: "views",
    Icon: ViewsOutline,
  },
  {
    key: "pages",
    label: "pages",
    Icon: PagesOutline,
  },
];

type Props = {
  step: TTourSteps;
  setStep: React.Dispatch<React.SetStateAction<TTourSteps>>;
};

export function TourSidebar({ step, setStep }: Props) {
  const { t, currentLocale } = useTranslation();
  return (
    <div className="col-span-3 hidden bg-surface-2 p-8 lg:block">
      <h3 className="text-16 font-medium">
        {t("onboarding_tour.start")}
        <br />
        <Trans
          i18n={i18nInstance}
          t={i18nInstance.getFixedT(currentLocale)}
          i18nKey="onboarding_tour.subtitle"
          components={{ brand: <bdi>Plane</bdi> }}
        />
      </h3>
      <div className="mt-8 space-y-5">
        {sidebarOptions.map((option) => (
          <button
            key={option.key}
            type="button"
            className={`flex w-full cursor-pointer items-center gap-2 border-s-[3px] py-0.5 ps-3 pe-2 text-start text-13 font-medium capitalize focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong ${
              step === option.key ? "border-accent-strong text-accent-primary" : "border-transparent text-secondary"
            }`}
            onClick={() => setStep(option.key)}
            aria-pressed={step === option.key}
          >
            <option.Icon className="h-4 w-4" aria-hidden="true" />
            {t(option.label)}
          </button>
        ))}
      </div>
    </div>
  );
}

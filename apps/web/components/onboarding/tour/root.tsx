/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { Button } from "@makeplane/propel/components/button";
import { PlaneLockup } from "@plane/blocks/icons";
import { CloseOutline } from "@makeplane/propel/icons";
import { i18nInstance, Trans, useTranslation } from "@plane/i18n";
// assets
import CyclesTour from "@/app/assets/onboarding/cycles.webp?url";
import PersianCyclesTour from "@/app/assets/onboarding/cycles-fa.png?url";
import IssuesTour from "@/app/assets/onboarding/issues.webp?url";
import PersianIssuesTour from "@/app/assets/onboarding/issues-fa.png?url";
import ModulesTour from "@/app/assets/onboarding/modules.webp?url";
import PersianModulesTour from "@/app/assets/onboarding/modules-fa.png?url";
import PagesTour from "@/app/assets/onboarding/pages.webp?url";
import PersianPagesTour from "@/app/assets/onboarding/pages-fa.png?url";
import ViewsTour from "@/app/assets/onboarding/views.webp?url";
import PersianViewsTour from "@/app/assets/onboarding/views-fa.png?url";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useUser } from "@/hooks/store/user";
// local imports
import { TourSidebar } from "./sidebar";

export type TOnboardingTourProps = {
  onComplete: () => void;
};

export type TTourSteps = "welcome" | "work-items" | "cycles" | "modules" | "views" | "pages";

const TOUR_STEPS: {
  key: TTourSteps;
  title: string;
  description: string;
  image: string;
  persianImage: string;
  prevStep?: TTourSteps;
  nextStep?: TTourSteps;
}[] = [
  {
    key: "work-items",
    title: "onboarding_tour.work_items.title",
    description: "onboarding_tour.work_items.description",
    image: IssuesTour,
    persianImage: PersianIssuesTour,
    nextStep: "cycles",
  },
  {
    key: "cycles",
    title: "product_tour.cycle.step_zero.title",
    description: "onboarding_tour.cycles.description",
    image: CyclesTour,
    persianImage: PersianCyclesTour,
    prevStep: "work-items",
    nextStep: "modules",
  },
  {
    key: "modules",
    title: "product_tour.module.step_zero.title",
    description: "onboarding_tour.modules.description",
    image: ModulesTour,
    persianImage: PersianModulesTour,
    prevStep: "cycles",
    nextStep: "views",
  },
  {
    key: "views",
    title: "views",
    description: "onboarding_tour.views.description",
    image: ViewsTour,
    persianImage: PersianViewsTour,
    prevStep: "modules",
    nextStep: "pages",
  },
  {
    key: "pages",
    title: "onboarding_tour.pages.title",
    description: "onboarding_tour.pages.description",
    image: PagesTour,
    persianImage: PersianPagesTour,
    prevStep: "views",
  },
];

export const TourRoot = observer(function TourRoot(props: TOnboardingTourProps) {
  const { onComplete } = props;
  const { t, currentLocale } = useTranslation();
  // states
  const [step, setStep] = useState<TTourSteps>("welcome");
  // store hooks
  const { toggleCreateProjectModal } = useCommandPalette();
  const { data: currentUser } = useUser();

  const currentStepIndex = TOUR_STEPS.findIndex((tourStep) => tourStep.key === step);
  const currentStep = TOUR_STEPS[currentStepIndex];

  return (
    <>
      {step === "welcome" ? (
        <div className="w-4/5 overflow-hidden rounded-[10px] bg-surface-1 md:w-1/2 lg:w-2/5">
          <div className="h-full overflow-hidden">
            <div className="grid h-64 place-items-center bg-accent-primary">
              <PlaneLockup className="h-10 w-auto text-on-color" />
            </div>
            <div className="flex flex-col overflow-y-auto p-6">
              <h3 className="font-semibold sm:text-18">
                <Trans
                  i18n={i18nInstance}
                  t={i18nInstance.getFixedT(currentLocale)}
                  i18nKey="onboarding_tour.welcome"
                  components={{
                    brand: <bdi>Plane</bdi>,
                    name: (
                      <bdi>
                        {currentUser?.first_name} {currentUser?.last_name}
                      </bdi>
                    ),
                  }}
                />
              </h3>
              <p className="mt-3 text-13 text-secondary">
                <Trans
                  i18n={i18nInstance}
                  t={i18nInstance.getFixedT(currentLocale)}
                  i18nKey="onboarding_tour.welcome_description"
                  components={{ brand: <bdi>Plane</bdi> }}
                />
              </p>
              <div className="flex h-full items-end">
                <div className="mt-12 flex items-center gap-6">
                  <Button
                    variant="primary"
                    size="sm"
                    stretch="auto"
                    label={t("product_tour.actions.take_a_tour")}
                    onClick={() => {
                      setStep("work-items");
                    }}
                  />
                  <button
                    type="button"
                    className="bg-transparent text-11 font-medium text-accent-primary outline-subtle-1"
                    onClick={() => {
                      onComplete();
                    }}
                  >
                    {t("onboarding_tour.skip")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative grid h-3/5 w-4/5 grid-cols-10 overflow-hidden rounded-[10px] bg-surface-1 sm:h-3/4 md:w-1/2 lg:w-3/5">
          <button
            type="button"
            className="fixed end-[9%] top-[19%] z-10 translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border border-strong bg-surface-1 p-1 sm:top-[11.5%] md:end-[24%] lg:end-[19%] rtl:-translate-x-1/2"
            aria-label={t("product_tour.actions.close")}
            onClick={onComplete}
          >
            <CloseOutline className="border-strong- h-3 w-3 text-primary" />
          </button>
          <TourSidebar step={step} setStep={setStep} />
          <div className="col-span-10 h-full overflow-hidden lg:col-span-7">
            <div
              className={`flex h-1/2 items-end overflow-hidden bg-accent-primary sm:h-3/5 ${
                currentStepIndex % 2 === 0 ? "justify-end" : "justify-start"
              }`}
            >
              <img
                src={currentLocale === "fa" ? currentStep.persianImage : currentStep.image}
                className="h-full w-full object-cover"
                alt={t(currentStep.title)}
              />
            </div>
            <div className="flex h-1/2 flex-col overflow-y-auto p-4 sm:h-2/5">
              <h3 className="font-semibold sm:text-18">{t(currentStep.title)}</h3>
              <p className="mt-3 text-13 text-secondary">
                <Trans
                  i18n={i18nInstance}
                  t={i18nInstance.getFixedT(currentLocale)}
                  i18nKey={currentStep.description}
                  components={{ brand: <bdi>Plane</bdi> }}
                />
              </p>
              <div className="mt-3 flex h-full items-end justify-between gap-4">
                <div className="flex items-center gap-4">
                  {currentStep?.prevStep && (
                    <Button
                      variant="secondary"
                      size="sm"
                      stretch="auto"
                      label={t("product_tour.actions.back")}
                      onClick={() => setStep(currentStep.prevStep ?? "welcome")}
                    />
                  )}
                  {currentStep?.nextStep && (
                    <Button
                      variant="primary"
                      size="sm"
                      stretch="auto"
                      label={t("product_tour.actions.next")}
                      onClick={() => setStep(currentStep.nextStep ?? "work-items")}
                    />
                  )}
                </div>
                {currentStepIndex === TOUR_STEPS.length - 1 && (
                  <Button
                    variant="primary"
                    size="sm"
                    stretch="auto"
                    label={t("workspace_dashboard.empty_state.general.primary_button.text")}
                    onClick={() => {
                      onComplete();
                      toggleCreateProjectModal(true);
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

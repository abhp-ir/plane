/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { LogoSpinner as LogoSpinnerRoot, LogoSpinnerImage } from "@makeplane/propel/elements/logo-spinner";
import LogoSpinnerDark from "@makeplane/propel/components/logo-spinner/logo-spinner-dark.gif?url";
import LogoSpinnerLight from "@makeplane/propel/components/logo-spinner/logo-spinner-light.gif?url";
import LogoSpinnerDarkStill from "@makeplane/propel/components/logo-spinner/logo-spinner-dark-still.png?url";
import LogoSpinnerLightStill from "@makeplane/propel/components/logo-spinner/logo-spinner-light-still.png?url";

export function LogoSpinner() {
  return (
    <LogoSpinnerRoot>
      <LogoSpinnerImage size="fluid" theme="light" src={LogoSpinnerLight} alt="logo" />
      <LogoSpinnerImage size="fluid" theme="dark" src={LogoSpinnerDark} alt="logo" />
      <LogoSpinnerImage size="fluid" theme="light" motion="still" src={LogoSpinnerLightStill} alt="logo" />
      <LogoSpinnerImage size="fluid" theme="dark" motion="still" src={LogoSpinnerDarkStill} alt="logo" />
    </LogoSpinnerRoot>
  );
}

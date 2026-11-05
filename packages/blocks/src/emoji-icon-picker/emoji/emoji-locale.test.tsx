/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { render } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { EmojiRoot } from "./emoji";

const state = vi.hoisted(() => ({ locale: "fa", root: vi.fn() }));
vi.mock("@plane/i18n", () => ({
  useTranslation: () => ({ currentLocale: state.locale, t: (key: string) => key }),
}));
vi.mock("frimousse", () => ({
  EmojiPicker: {
    Root: ({ children, ...props }: { children: ReactNode }) => {
      state.root(props);
      return children;
    },
    Search: () => <input />,
    SkinToneSelector: () => <button type="button" />,
    Viewport: ({ children }: { children: ReactNode }) => children,
    List: () => null,
  },
}));

it("loads Persian data from the app root without changing other locale defaults", () => {
  state.locale = "fa";
  state.root.mockClear();
  const onChange = vi.fn();
  try {
    const { rerender } = render(<EmojiRoot onChange={onChange} />);
    expect(state.root).toHaveBeenLastCalledWith(expect.objectContaining({ locale: "fa", emojibaseUrl: "/emojibase" }));
    state.locale = "en";
    rerender(<EmojiRoot onChange={onChange} />);
    expect(state.root).toHaveBeenLastCalledWith(
      expect.objectContaining({ locale: undefined, emojibaseUrl: undefined })
    );
    state.locale = "fa";
    rerender(<EmojiRoot onChange={onChange} />);
    const props = state.root.mock.lastCall?.[0];
    expect(props).toMatchObject({ locale: "fa", emojibaseUrl: "/emojibase" });
    props.onEmojiSelect({ emoji: "😀" });
    expect(onChange).toHaveBeenCalledExactlyOnceWith("😀");
  } finally {
    state.locale = "fa";
  }
});

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { TaskItem } from "@tiptap/extension-task-item";
import { i18nInstance } from "@plane/i18n";

export const LocalizedTaskItem = TaskItem.extend({
  addNodeView() {
    const render = this.parent!();
    return (props) => {
      const view = render(props);
      const checkbox = (view.dom as HTMLElement).querySelector<HTMLInputElement>('input[type="checkbox"]')!;
      let node = props.node;
      // Preserve Tiptap's behavior; bind the accessible name to the current task and locale.
      const refresh = () =>
        checkbox.setAttribute(
          "aria-label",
          i18nInstance.t("editor_commands.task_checkbox", {
            text: node.firstChild?.textContent || i18nInstance.t("editor_commands.empty_task"),
          })
        );
      const update = view.update;
      view.update = (next, decorations, innerDecorations) => {
        const accepted = update?.(next, decorations, innerDecorations) ?? false;
        if (accepted) {
          node = next;
          refresh();
        }
        return accepted;
      };
      const destroy = view.destroy;
      const ignoreMutation = view.ignoreMutation;
      view.ignoreMutation = (mutation) =>
        (mutation.type === "attributes" && mutation.target === checkbox && mutation.attributeName === "aria-label") ||
        (ignoreMutation?.(mutation) ?? false);
      view.destroy = () => {
        i18nInstance.off("languageChanged", refresh);
        destroy?.();
      };
      i18nInstance.on("languageChanged", refresh);
      refresh();
      return view;
    };
  },
}).configure({
  HTMLAttributes: { class: "relative" },
  nested: true,
});

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane utils
import { cn } from "@plane/utils";
import { findSlashCommandMatch } from "@/helpers/slash-command-search";
// types
import type { ISlashCommandItem } from "@/types";

type Props = {
  isSelected: boolean;
  item: ISlashCommandItem;
  itemIndex: number;
  onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  onMouseEnter: () => void;
  sectionIndex: number;
  query?: string;
};

// Utility to highlight matched text in a string
const highlightMatch = (text: string, query: string): React.ReactNode => {
  const range = findSlashCommandMatch(text, query);
  if (range) {
    const before = text.substring(0, range.from);
    const match = text.substring(range.from, range.to);
    const after = text.substring(range.to);

    return (
      <>
        {before}
        <span className="font-medium text-primary">{match}</span>
        {after}
      </>
    );
  }

  // Otherwise just return the text
  return text;
};

export function CommandMenuItem(props: Props) {
  const { isSelected, item, itemIndex, onClick, onMouseEnter, sectionIndex, query } = props;

  return (
    <button
      type="button"
      id={`item-${sectionIndex}-${itemIndex}`}
      className={cn(
        "flex w-full items-center gap-2 truncate rounded-sm px-1 py-1.5 text-start text-13 text-secondary hover:bg-layer-1-hover",
        {
          "bg-layer-1-hover": isSelected,
        }
      )}
      onClick={onClick}
      onMouseDown={(event) => event.preventDefault()}
      onMouseEnter={onMouseEnter}
    >
      <span aria-hidden="true" className="grid size-5 flex-shrink-0 place-items-center" style={item.iconContainerStyle}>
        {item.icon}
      </span>
      <p className="flex-grow truncate text-12">{query ? highlightMatch(item.title, query) : item.title}</p>
      {item.badge && <bdi className="shrink-0">{item.badge}</bdi>}
    </button>
  );
}

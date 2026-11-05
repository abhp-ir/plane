/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observe, runInAction, toJS } from "mobx";
import { expect, it, vi } from "vitest";
import type { IIssueLabel } from "@plane/types";
import { LabelStore } from "./label.store";
import type { CoreRootStore } from "./root.store";

vi.mock("@/services/issue", () => ({ IssueLabelService: vi.fn() }));

it("derives nested label trees without writing observable label records during rendering", () => {
  const store = new LabelStore({ router: { projectId: "project", workspaceSlug: "workspace" } } as CoreRootStore);
  const label = (id: string, parent: string | null, sort_order: number) =>
    ({ id, parent, sort_order, name: id, project_id: "project" }) as IIssueLabel;
  runInAction(() => {
    store.fetchedMap.project = true;
    store.labelMap = {
      group: label("group", null, 1),
      child: label("child", "group", 2),
      nested: label("nested", "child", 3),
      sibling: label("sibling", "group", 4),
    };
  });
  const original = toJS(store.labelMap);
  const writes: unknown[] = [];
  const disposers = Object.values(store.labelMap).map((row) => observe(row, (change) => writes.push(change)));
  try {
    const tree = store.projectLabelsTree!;
    expect(tree[0].children?.map(({ id }) => id)).toEqual(["child", "sibling"]);
    expect(tree[0].children?.[0]).toMatchObject({ id: "child", children: [{ id: "nested", children: [] }] });
    expect(writes).toEqual([]);
    expect(toJS(store.labelMap)).toEqual(original);

    runInAction(() => {
      store.labelMap.child.parent = null;
    });
    writes.length = 0;
    const updated = store.projectLabelsTree!;
    expect(updated.map(({ id }) => id)).toEqual(["group", "child"]);
    expect(updated[0].children?.map(({ id }) => id)).toEqual(["sibling"]);
    expect(updated[1].children?.[0].id).toBe("nested");
    expect(tree[0].children?.map(({ id }) => id)).toEqual(["child", "sibling"]);
    expect(writes).toEqual([]);
    expect(toJS(store.labelMap)).toEqual({ ...original, child: { ...original.child, parent: null } });
  } finally {
    disposers.forEach((dispose) => dispose());
  }
});

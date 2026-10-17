/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { expect, it, vi } from "vitest";
import { AuthService } from "./auth.service";

it("shares an in-flight CSRF request so concurrent mounts cannot overwrite the cookie", async () => {
  const service = new AuthService();
  let finish!: (response: Awaited<ReturnType<AuthService["get"]>>) => void;
  const pending = new Promise<Awaited<ReturnType<AuthService["get"]>>>((resolve) => (finish = resolve));
  const get = vi.spyOn(service, "get").mockReturnValue(pending);
  const first = service.requestCSRFToken();
  const second = service.requestCSRFToken();
  expect(get).toHaveBeenCalledTimes(1);
  finish({ data: { csrf_token: "matching-cookie" } } as Awaited<ReturnType<AuthService["get"]>>);
  expect(await first).toEqual({ csrf_token: "matching-cookie" });
  expect(await second).toEqual({ csrf_token: "matching-cookie" });
  await service.requestCSRFToken();
  expect(get).toHaveBeenCalledTimes(2);
});

it("propagates a failed CSRF request to all callers and allows a fresh retry", async () => {
  const service = new AuthService();
  const error = new Error("Disconnected");
  const get = vi
    .spyOn(service, "get")
    .mockRejectedValueOnce(error)
    .mockResolvedValue({ data: { csrf_token: "retry" } } as Awaited<ReturnType<AuthService["get"]>>);
  const results = await Promise.allSettled([service.requestCSRFToken(), service.requestCSRFToken()]);
  expect(results).toEqual([
    { status: "rejected", reason: error },
    { status: "rejected", reason: error },
  ]);
  expect(get).toHaveBeenCalledTimes(1);
  expect(await service.requestCSRFToken()).toEqual({ csrf_token: "retry" });
  expect(get).toHaveBeenCalledTimes(2);
});

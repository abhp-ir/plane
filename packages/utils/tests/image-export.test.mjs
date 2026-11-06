/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import assert from "node:assert/strict";
import { test } from "node:test";

process.env.VITE_API_BASE_URL = "https://api.plane.test";
const { getBase64Image } = await import("../dist/index.js");

for (const [url, credentials] of [
  ["https://api.plane.test/api/assets/v2/workspaces/lab/image/", "include"],
  ["https://api.plane.test/api/users/me/", "same-origin"],
  ["https://images.example.test/api/assets/image.jpg", "same-origin"],
  ["https://api.plane.test.evil.test/api/assets/image.jpg", "same-origin"],
  ["https://api.plane.test:8443/api/assets/image.jpg", "same-origin"],
]) {
  test(`image credentials remain scoped for ${url}`, async (t) => {
    t.mock.method(globalThis, "fetch", async () => new Response("denied", { status: 401 }));
    await assert.rejects(getBase64Image(url), /Failed to fetch image/);
    assert.equal(globalThis.fetch.mock.calls.at(-1).arguments[1]?.credentials, credentials);
  });
}

test("resolves an authorized Plane asset then fetches storage without any session credentials", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", async (url) =>
    url.startsWith("https://api.plane.test/")
      ? Response.json({ url: "https://storage.example.test/signed-image?signature=opaque" })
      : new Response("missing", { status: 404 })
  );
  await assert.rejects(
    getBase64Image("https://api.plane.test/api/assets/v2/workspaces/lab/image/"),
    /Failed to fetch image/
  );
  assert.equal(fetch.mock.callCount(), 2);
  const [resolve, storage] = fetch.mock.calls.map((call) => call.arguments);
  assert.equal(new URL(resolve[0]).searchParams.get("response_format"), "json");
  assert.deepEqual(resolve[1], { credentials: "include", redirect: "error" });
  assert.deepEqual(storage, ["https://storage.example.test/signed-image?signature=opaque", { credentials: "omit" }]);
});

test("invalid signed URL protocols are rejected before a storage request", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", async () => Response.json({ url: "file:///secret" }));
  await assert.rejects(
    getBase64Image("https://api.plane.test/api/assets/v2/workspaces/lab/image/"),
    /Invalid asset URL/
  );
  assert.equal(fetch.mock.callCount(), 1);
});

test("image export rejects invalid sources and failed requests instead of silently omitting images", async (t) => {
  t.mock.method(globalThis, "fetch", async () => {
    throw new Error("offline");
  });
  await assert.rejects(getBase64Image("not a URL"), /Invalid URL format/);
  assert.equal(globalThis.fetch.mock.callCount(), 0);
  await assert.rejects(getBase64Image("https://api.plane.test/api/assets/image/"), /offline/);
});

for (const type of ["image/gif", "image/webp"]) {
  test(`normalizes ${type} to a supported PNG and releases the decoded bitmap`, async (t) => {
    const previousDocument = globalThis.document;
    const previousDecoder = globalThis.createImageBitmap;
    let closed = false;
    const bitmap = {
      width: 20,
      height: 10,
      close: () => {
        closed = true;
      },
    };
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => ({ drawImage: (image) => assert.equal(image, bitmap) }),
      toDataURL: (format) => {
        assert.equal(format, "image/png");
        return "data:image/png;base64,cGl4ZWw=";
      },
    };
    globalThis.createImageBitmap = async (blob) => {
      assert.equal(blob.type, type);
      return bitmap;
    };
    globalThis.document = {
      createElement: (tag) => {
        assert.equal(tag, "canvas");
        return canvas;
      },
    };
    t.after(() => {
      globalThis.document = previousDocument;
      globalThis.createImageBitmap = previousDecoder;
    });
    t.mock.method(globalThis, "fetch", async () => new Response("image", { headers: { "Content-Type": type } }));
    assert.equal(await getBase64Image("https://images.example.test/image"), "data:image/png;base64,cGl4ZWw=");
    assert.equal(canvas.width, 20);
    assert.equal(canvas.height, 10);
    assert.equal(closed, true);
  });
}

test("a corrupt image rejects the export before the PDF renderer can silently omit it", async (t) => {
  const previous = globalThis.createImageBitmap;
  globalThis.createImageBitmap = async () => {
    throw new Error("Image decode failed");
  };
  t.after(() => {
    globalThis.createImageBitmap = previous;
  });
  t.mock.method(globalThis, "fetch", async () => new Response("broken", { headers: { "Content-Type": "image/png" } }));
  await assert.rejects(getBase64Image("https://images.example.test/broken.png"), /Image decode failed/);
});

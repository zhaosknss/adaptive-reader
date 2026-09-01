import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("web app manifest is installable and keeps the two primary destinations", async () => {
  const manifest = JSON.parse(await readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"));

  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.scope, "/");
  assert.equal(manifest.display, "standalone");
  assert.ok(manifest.icons.some((icon: { sizes?: string }) => icon.sizes === "192x192"));
  assert.ok(manifest.icons.some((icon: { sizes?: string }) => icon.sizes === "512x512"));
  assert.deepEqual(manifest.shortcuts.map((shortcut: { url: string }) => shortcut.url), ["/", "/me"]);
});

test("service worker caches the shell without caching feed or extraction APIs", async () => {
  const worker = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");

  assert.match(worker, /APP_SHELL/);
  assert.match(worker, /request\.mode === "navigate"/);
  assert.match(worker, /url\.pathname\.startsWith\("\/api\/"\)/);
  assert.match(worker, /url\.pathname\.startsWith\("\/app\/"\)/);
  assert.match(worker, /networkFirst/);
});

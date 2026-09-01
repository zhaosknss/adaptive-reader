import assert from "node:assert/strict";
import test from "node:test";
import {
  browserThemeColor,
  normalizeThemeAccent,
  normalizeThemeMode,
  resolveThemeMode,
  THEME_INITIALIZER_SCRIPT,
} from "../lib/theme.ts";

test("theme preferences fall back to the calm system and ocean defaults", () => {
  assert.equal(normalizeThemeMode("dark"), "dark");
  assert.equal(normalizeThemeMode("unknown"), "system");
  assert.equal(normalizeThemeAccent("jade"), "jade");
  assert.equal(normalizeThemeAccent("orange"), "ocean");
});

test("system appearance resolves without changing the chosen accent", () => {
  assert.equal(resolveThemeMode("system", false), "light");
  assert.equal(resolveThemeMode("system", true), "dark");
  assert.equal(resolveThemeMode("light", true), "light");
  assert.equal(resolveThemeMode("dark", false), "dark");
});

test("theme initialization happens before paint and supplies PWA colors", () => {
  assert.match(THEME_INITIALIZER_SCRIPT, /prefers-color-scheme: dark/);
  assert.match(THEME_INITIALIZER_SCRIPT, /dataset\.colorMode/);
  assert.equal(browserThemeColor("light"), "#F8F9FA");
  assert.equal(browserThemeColor("dark"), "#151817");
});

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_SETTINGS, resolveTheme, splitWords,
  estimateRemainingMs, formatDuration, orpIndex,
} from "../src/shared/settings.js";

test("DEFAULT_SETTINGS has expected shape", () => {
  assert.deepEqual(DEFAULT_SETTINGS,
    { defaultWpm: 250, theme: "system", orp: true, contextWords: true });
});

test("resolveTheme maps system to null, others passthrough", () => {
  assert.equal(resolveTheme("system"), null);
  assert.equal(resolveTheme("light"), "light");
  assert.equal(resolveTheme("dark"), "dark");
});

test("splitWords splits on whitespace and drops empties", () => {
  assert.deepEqual(splitWords("  hello   world\n foo "), ["hello", "world", "foo"]);
  assert.deepEqual(splitWords(""), []);
});

test("estimateRemainingMs computes ms and guards wpm<=0", () => {
  assert.equal(estimateRemainingMs(250, 250), 60000);
  assert.equal(estimateRemainingMs(100, 0), 0);
});

test("formatDuration formats mm:ss with zero-padded seconds", () => {
  assert.equal(formatDuration(0), "0:00");
  assert.equal(formatDuration(47000), "0:47");
  assert.equal(formatDuration(65000), "1:05");
  assert.equal(formatDuration(723000), "12:03");
});

test("orpIndex returns center-ish index", () => {
  assert.equal(orpIndex(1), 0);
  assert.equal(orpIndex(5), 2);   // odd → floor(len/2)
  assert.equal(orpIndex(6), 2);   // even → len/2 - 1
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mp3Duration } from "../src/speech.js";

test("mp3Duration reads a constant-bitrate file's length from its header", () => {
  const near = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);
  near(mp3Duration(readFileSync(new URL("./fixtures/tone5.mp3", import.meta.url))), 5, 0.2);
  near(mp3Duration(readFileSync(new URL("./fixtures/openrouter-id3.mp3", import.meta.url))), 1.41, 0.08);
});

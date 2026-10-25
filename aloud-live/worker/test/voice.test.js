import { test } from "node:test";
import assert from "node:assert/strict";
import { matchControl } from "../src/voice.js";

test("whole-utterance playback commands map to room actions", () => {
  assert.equal(matchControl("Pause."), "pause");
  assert.equal(matchControl("Stop, please!"), "stop");
  assert.equal(matchControl("next one"), "skip");
  assert.equal(matchControl("From the top."), "restart");
  assert.equal(matchControl("Continue"), "resume");
  assert.equal(matchControl("Cisza."), "stop");
  assert.equal(matchControl("Następny, proszę"), "skip");
  assert.equal(matchControl("Od początku"), "restart");
  assert.equal(matchControl("Wznów teraz"), "resume");
});

test("requests that merely contain a command word go to the routine", () => {
  assert.equal(matchControl("Read me a poem by Wordsworth"), null);
  assert.equal(matchControl("Something to stop the rain"), null);
  assert.equal(matchControl("Next, read me some Keats"), null);
  assert.equal(matchControl("Przeczytaj mi coś Mickiewicza"), null);
  assert.equal(matchControl(""), null);
});

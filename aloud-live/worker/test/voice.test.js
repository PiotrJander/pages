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

import { routingFrom } from "../src/voice.js";

test("a request may name its routine and kiosk, and nothing else", () => {
  const f = o => routingFrom(k => o[k]);
  assert.deepEqual(f({}), {});
  assert.deepEqual(f({ routine: "trig_01Abc", routine_token: "t" }).routine,
    { url: "https://api.anthropic.com/v1/claude_code/routines/trig_01Abc/fire", token: "t" });
  assert.equal(f({ routine: "https://api.anthropic.com/v1/claude_code/routines/trig_9/fire", routine_token: "t" }).routine.url,
    "https://api.anthropic.com/v1/claude_code/routines/trig_9/fire");
  assert.match(f({ routine: "https://evil.example/fire", routine_token: "t" }).error, /routine/);
  assert.match(f({ routine: "trig_1" }).error, /routine_token/);
  assert.equal(f({ control_url: "https://aloud-stream.pjander2.workers.dev/k/x/control" }).controlUrl,
    "https://aloud-stream.pjander2.workers.dev/k/x/control");
  assert.match(f({ control_url: "https://example.com/control" }).error, /control_url/);
});

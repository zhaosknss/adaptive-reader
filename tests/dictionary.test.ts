import assert from "node:assert/strict";
import test from "node:test";
import { LocalDictionaryProvider, localDictionaryCandidates } from "../lib/dictionary.ts";

test("local dictionary returns Chinese without calling an external service", async () => {
  let requests = 0;
  const fetcher: typeof fetch = async (input) => {
    requests += 1;
    assert.equal(input, "/dictionary/m.json");
    return new Response(JSON.stringify({
      mollusk: ["n. 软体动物", "mɒləsk"],
      make: ["v. 制作；使得", "meɪk"],
    }), { status: 200 });
  };
  const provider = new LocalDictionaryProvider(fetcher);

  assert.deepEqual(await provider.lookup("mollusks"), {
    word: "mollusks",
    translation: "n. 软体动物",
    phonetic: "mɒləsk",
    source: "local",
  });
  assert.equal((await provider.lookup("making")).translation, "v. 制作；使得");
  assert.equal(requests, 1);
});

test("local dictionary candidates cover common English inflections", () => {
  assert.ok(localDictionaryCandidates("stories").includes("story"));
  assert.ok(localDictionaryCandidates("loved").includes("love"));
  assert.ok(localDictionaryCandidates("stopped").includes("stop"));
  assert.ok(localDictionaryCandidates("making").includes("make"));
});

test("local dictionary keeps browser fetch bound to the global receiver", async () => {
  let usedGlobalReceiver = false;
  const fetcher = async function (this: unknown, input: RequestInfo | URL) {
    usedGlobalReceiver = this === globalThis;
    assert.equal(input, "/dictionary/b.json");
    return new Response(JSON.stringify({
      become: ["vi. 变成, 变得；vt. 适合", "bi'kʌm"],
    }), { status: 200 });
  };
  const provider = new LocalDictionaryProvider(fetcher as typeof fetch);

  assert.equal((await provider.lookup("become")).translation, "vi. 变成, 变得；vt. 适合");
  assert.equal(usedGlobalReceiver, true);
});

test("local dictionary falls back to a two-letter extended shard", async () => {
  const requests: string[] = [];
  const fetcher: typeof fetch = async (input) => {
    requests.push(String(input));
    if (input === "/dictionary/f.json") return new Response("{}", { status: 200 });
    assert.equal(input, "/dictionary/extended/fa.json");
    return new Response(JSON.stringify({
      fanlike: ["a. 象扇的, 折迭的, 象风扇般转动的", "'fænlaik"],
    }), { status: 200 });
  };
  const provider = new LocalDictionaryProvider(fetcher);

  assert.equal((await provider.lookup("fanlike")).translation, "a. 象扇的, 折迭的, 象风扇般转动的");
  assert.deepEqual(requests, ["/dictionary/f.json", "/dictionary/extended/fa.json"]);
});

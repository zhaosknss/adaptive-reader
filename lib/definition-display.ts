const PART_OF_SPEECH = /^(n|v|vi|vt|adj|a|adv|ad|prep|pron|conj|aux|num|int|art)\.\s*/i;
const NORMALIZED_PART_OF_SPEECH: Record<string, string> = {
  a: "adj",
  ad: "adv",
};

export type CompactDefinition = {
  partOfSpeech?: string;
  meaning: string;
};

export function compactDefinition(translation: string): CompactDefinition {
  const firstEntry = translation
    .replace(/\r?\n/g, "；")
    .split(/[；;]/)
    .map((value) => value.trim())
    .find(Boolean) ?? translation.trim();
  const match = firstEntry.match(PART_OF_SPEECH);
  const withoutPartOfSpeech = match ? firstEntry.slice(match[0].length) : firstEntry;
  const rawMeaning = withoutPartOfSpeech.split(/[，,、]/)[0]?.trim() || translation.trim();
  const meaning = rawMeaning.replace(/^象(?=.+的$)/, "像");

  return {
    partOfSpeech: match
      ? `${NORMALIZED_PART_OF_SPEECH[match[1].toLocaleLowerCase("en-US")] ?? match[1].toLocaleLowerCase("en-US")}.`
      : undefined,
    meaning,
  };
}

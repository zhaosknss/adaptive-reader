import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const [, , sourcePath, outputPath, limitArgument = "60000"] = process.argv;
if (!sourcePath || !outputPath) {
  console.error("Usage: node scripts/build-local-dictionary.mjs <ecdict.csv> <output-directory> [limit]");
  process.exit(1);
}

const limit = Number.parseInt(limitArgument, 10);
if (!Number.isFinite(limit) || limit < 1) throw new Error("Dictionary limit must be a positive integer.");

const source = await readFile(sourcePath, "utf8");
const rows = parseCsv(source);
const header = rows.shift();
if (!header) throw new Error("ECDICT CSV has no header row.");

const column = Object.fromEntries(header.map((name, index) => [name, index]));
const ranked = [];

for (const row of rows) {
  const word = row[column.word]?.trim().toLocaleLowerCase("en-US");
  const translation = compactTranslation(row[column.translation]);
  if (!word || !translation || !/^[a-z]+(?:['-][a-z]+)*$/.test(word)) continue;

  const score = dictionaryScore(row, column);
  ranked.push({ word, translation, phonetic: compactPhonetic(row[column.phonetic]), score });
}

ranked.sort((left, right) => left.score - right.score || left.word.length - right.word.length || left.word.localeCompare(right.word));

const selected = new Map();
for (const entry of ranked) {
  if (!Number.isFinite(entry.score)) continue;
  if (!selected.has(entry.word)) selected.set(entry.word, entry);
  if (selected.size >= limit) break;
}

const allEntries = new Map();
for (const entry of ranked) {
  if (!allEntries.has(entry.word)) allEntries.set(entry.word, entry);
}

const shards = Object.fromEntries("abcdefghijklmnopqrstuvwxyz".split("").map((letter) => [letter, {}]));
for (const entry of [...selected.values()].sort((left, right) => left.word.localeCompare(right.word))) {
  shards[entry.word[0]][entry.word] = entry.phonetic
    ? [entry.translation, entry.phonetic]
    : [entry.translation];
}

const extendedShards = Object.fromEntries(
  "abcdefghijklmnopqrstuvwxyz".split("").flatMap((first) => (
    "abcdefghijklmnopqrstuvwxyz".split("").map((second) => [`${first}${second}`, {}])
  )),
);
let extendedEntries = 0;
for (const entry of allEntries.values()) {
  if (selected.has(entry.word) || entry.word.length < 2) continue;
  const prefix = entry.word.replace(/[^a-z]/g, "").slice(0, 2);
  if (!extendedShards[prefix]) continue;
  extendedShards[prefix][entry.word] = entry.phonetic
    ? [entry.translation, entry.phonetic]
    : [entry.translation];
  extendedEntries += 1;
}

await mkdir(outputPath, { recursive: true });
for (const [letter, entries] of Object.entries(shards)) {
  await writeFile(path.join(outputPath, `${letter}.json`), JSON.stringify(entries), "utf8");
}
const extendedPath = path.join(outputPath, "extended");
await mkdir(extendedPath, { recursive: true });
for (const [prefix, entries] of Object.entries(extendedShards)) {
  await writeFile(path.join(extendedPath, `${prefix}.json`), JSON.stringify(entries), "utf8");
}
await writeFile(path.join(outputPath, "index.json"), JSON.stringify({
  source: "ECDICT",
  sourceUrl: "https://github.com/skywind3000/ECDICT",
  license: "MIT",
  entries: selected.size,
  extendedEntries,
  generatedAt: new Date().toISOString(),
}, null, 2), "utf8");

console.log(`Generated ${selected.size} core and ${extendedEntries} extended ECDICT entries in ${outputPath}`);

function dictionaryScore(row, column) {
  const ranks = [positiveInteger(row[column.bnc]), positiveInteger(row[column.frq])].filter(Number.isFinite);
  let score = ranks.length ? Math.min(...ranks) : Number.POSITIVE_INFINITY;
  const collins = positiveInteger(row[column.collins]);
  if (Number.isFinite(collins)) score = Math.min(score, Math.max(1, 7 - collins) * 3500);
  if (row[column.oxford]?.trim() === "1") score = Math.min(score, 9000);
  if (row[column.tag]?.trim()) score = Math.min(score, 32000);
  return score;
}

function positiveInteger(value) {
  const parsed = Number.parseInt(value ?? "", 10);
  return parsed > 0 ? parsed : Number.POSITIVE_INFINITY;
}

function compactTranslation(value = "") {
  return value
    .replace(/\\n/g, "\n")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !/^\[(?:网络|例句)\]/.test(line))
    .slice(0, 3)
    .join("；")
    .slice(0, 280);
}

function compactPhonetic(value = "") {
  return value.trim().replace(/^\/+|\/+$/g, "").slice(0, 80);
}

function parseCsv(value) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (quoted) {
      if (character === '"' && value[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"' && field.length === 0) {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows;
}

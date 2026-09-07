# Third-party notices

The MIT license in `LICENSE` applies to the Adaptive Reader source code written
for this repository. It does not replace the licenses or public-domain status
of bundled data, reading material, or third-party dependencies.

## Bundled data

- **ECDICT** — The local English-Chinese dictionary shards under
  `public/dictionary/` are derived from ECDICT and distributed under its MIT
  license. The upstream license and copyright notice are preserved in
  `public/dictionary/ECDICT-LICENSE.txt`.
- **SCOWL-derived word lists** — `wordlist-english` supplies the word lists used
  by the local frequency provider. Its upstream `Copyright` notice includes the
  notices and redistribution conditions for SCOWL, MWords, WordNet, Ispell and
  the other contributing lists. Redistributors should retain that notice with
  the package and derived distributions.

## Reading material

- **Simple English Wikipedia extracts** — Licensed under CC BY-SA 4.0 and the
  GNU Free Documentation License. Each record preserves its source page,
  attribution, license URL, retrieval date, and transformations. Modified or
  redistributed extracts remain subject to their applicable share-alike and
  attribution requirements.
- **Wikinews archive extracts** — Only eligible text published on or after
  2024-12-16 is treated as CC BY 4.0. Images are not bundled under that text
  license.
- **Project Gutenberg readings** — The bundled literary readings are sourced
  from works identified by Project Gutenberg as public domain in the United
  States. Copyright status can differ by country. Source and authorship details
  are stored with every reading and documented in `docs/CONTENT_SOURCES.md`.

For a detailed source inventory and reuse boundaries, see
`docs/CONTENT_SOURCES.md`.

## Runtime and development dependencies

Dependencies retain their own licenses. Notable direct dependencies include:

- React and React DOM — MIT
- Mozilla Readability — Apache-2.0
- LinkeDOM — ISC
- TypeScript — Apache-2.0
- Vite — MIT
- `wordlist-english` — MIT, with the bundled word-list notices described above

The dependency lockfile is the authoritative inventory of exact versions.


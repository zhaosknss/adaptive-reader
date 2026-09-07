# Content Sources

内容按阅读阶段分成三层；pool 只决定候选范围，真正进入 Reader 前仍必须用完整正文通过个人难度、篇幅、句法和预计查词负担检查。

## Success Pool

面向 band 0/1 和仍处于 Success Phase 的用户。当前包含：

- 45 条逐页核对的 Simple English Wikipedia 原文导语快照，集中在自然、日常生活、科技与文化主题；只做节选和空白清理，不改写语言。
- 原有 Project Gutenberg 公版短读中策划等级适合当前用户的部分。
- Simple English Wikipedia 在线 API 可用时，使用 TextExtracts 获取最新导语；API 超时或不可达时直接使用已核对快照，避免核心阅读流程被网络阻断。

快照在 `lib/simple-wiki-snapshots-a.ts`，在线发现和出处封装在 `lib/reusable-content-sources.ts`。Simple English Wikipedia 文本按 CC BY-SA 4.0/GFDL 提供；当前候选记录原页面、许可链接、贡献者署名、抓取时间和 `excerpt / cleaned` 变换，Reader 显示原文链接、署名、许可与“节选”。图片未随正文保存。

## Bridge Pool

面向完成初期顺畅阅读、准备接近普通材料的用户。当前包含：

- 20 条逐页核对的 Simple English Wikipedia 原文导语快照，覆盖历史、人物、社会、文化和科学；典型长度约 60～300 词。
- 在线 Simple English Wikipedia 导语候选。
- 2024-12-16 之后以 CC BY 4.0 发布的 Wikinews 文本候选。Wikinews 已在 2026-05-04 进入永久只读状态，因此这里只把它当作有明确许可的现代新闻档案，不当作持续更新的实时新闻源；不导入图片。

快照在 `lib/simple-wiki-snapshots-b.ts`。Bridge 候选仍接受完整正文难度门槛，不会只因为来源名称含有 Simple 就被视为简单。

## Open Web Pool

普通真实网页仍使用 RSS/Atom 发现元数据，只有系统选中候选时才请求正文并用 Mozilla Readability 清洗。当前固定入口：

| source id | 来源 | 主题 | Feed |
| --- | --- | --- | --- |
| `mit-news` | MIT News | Science & Technology | `https://news.mit.edu/rss/feed` |
| `ars-technica` | Ars Technica | Technology | `https://feeds.arstechnica.com/arstechnica/index` |
| `smithsonian-latest` | Smithsonian Magazine | Culture & Knowledge | `https://www.smithsonianmag.com/rss/latest_articles/` |
| `smithsonian-history` | Smithsonian History | History | `https://www.smithsonianmag.com/rss/history/` |
| `smithsonian-science` | Smithsonian Science | Science | `https://www.smithsonianmag.com/rss/science-nature/` |

每个 Feed 最多取 8 条、响应上限 1.5 MB、超时 5 秒；单源失败隔离。RSS 可用性不等于全文再发布授权，当前只在用户选择后为本机个人阅读提取正文。公开托管或商业化前仍需逐项核对来源条款、robots 与缓存策略。

## 内置公版文学

`lib/builtin-readings.ts` 保存来自 Project Gutenberg 的 9 篇完整短读或已标注节选，覆盖诗歌、寓言、童话、短篇故事、希腊神话和文学散文。来源包括：

- Robert Louis Stevenson, *A Child's Garden of Verses*, eBook 25608
- Christina Rossetti, *Sing-Song*, eBook 76703
- *The Aesop for Children*, eBook 19994
- Joseph Jacobs, *English Fairy Tales*, eBook 7439
- L. Leslie Brooke, *The Story of the Three Little Pigs*, eBook 18155
- Josephine Preston Peabody, *Old Greek Folk Stories Told Anew*, eBook 9313
- William Hazlitt, *Table-Talk*, eBook 66129

这些记录在 Project Gutenberg 标为美国公版；在其他国家分发前仍要核对当地版权状态。

## 研究后暂不采用

- VOA Learning English：官方说明自有文本属于公版，但页面也可能混有 AP/Reuters/AFP 等第三方内容；在没有可靠逐篇权利标识前不自动整站导入。
- Smithsonian Open Access：CC0 主要覆盖馆藏对象数据，API 需要 key，和低等级现代短读的需求不够贴合。
- Europe PMC 开放许可子集：许可可筛选，但医学和科研文本不适合作为 band 0/1 主池。
- 商业 graded readers、教学站和普通新闻正文：没有清楚复用许可时不内置。

新增来源前必须确认：稳定程序化入口、正文许可、署名要求、变换标记、图片是否另有许可，以及真实全文能否通过当前 difficulty pipeline。

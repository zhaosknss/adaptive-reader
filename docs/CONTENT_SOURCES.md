# Content Sources

第一版内容池有两条清晰路径：RSS/Atom 只发现实时文章候选，用户真正开始阅读时才抓取正文；少量公版文学正文随应用提供，用来保证内容类型和低等级可读性。

## 实时来源

| source id | 用户看到的来源 | 主题 | Feed |
| --- | --- | --- | --- |
| `mit-news` | MIT News | Science & Technology | `https://news.mit.edu/rss/feed` |
| `ars-technica` | Ars Technica | Technology | `https://feeds.arstechnica.com/arstechnica/index` |
| `smithsonian-latest` | Smithsonian Magazine | Culture & Knowledge | `https://www.smithsonianmag.com/rss/latest_articles/` |
| `smithsonian-history` | Smithsonian History | History | `https://www.smithsonianmag.com/rss/history/` |
| `smithsonian-science` | Smithsonian Science | Science | `https://www.smithsonianmag.com/rss/science-nature/` |

官方入口：

- MIT News 的站点提供 RSS feed；当前地址已实际返回 `application/rss+xml`。
- Ars Technica 官方 [RSS Feeds](https://arstechnica.com/rss-feeds/) 页面提供全站与栏目 Feed；当前全站地址已实际返回 XML。
- Smithsonian Magazine 官方 [RSS 页面](https://www.smithsonianmag.com/rss/) 提供 Latest、History、Science 等栏目；上述地址已实际返回 XML。

实时来源边界：

- 每个来源每次最多读取 8 条候选，Feed 响应上限 1.5 MB、超时 8 秒。
- IndexedDB 的 `candidates` store 只保存候选元数据，不在刷新 Feed 时批量抓取正文。
- 用户点击“阅读”后，才复用现有 `/api/extract` 抓取目标页面、用 Mozilla Readability 清洗并保存为本机 Article。
- Reader 始终提供“查看原文”链接。RSS 可用性不等于全文再发布授权；当前设计面向本地个人阅读缓存。如果以后公开托管或商业化，必须重新核对各来源条款、robots 与缓存策略。
- 单个来源失败不会清空已有候选；外部来源全部失败时，内置文学和已有本机文章仍可阅读。

来源定义集中在 `lib/content-sources.ts`。新增或替换来源时，先验证官方 Feed、正文可提取性、更新频率和使用条款，再修改该文件。

## 内置公版文学

内置内容集中在 `lib/builtin-readings.ts`，当前使用以下来源版本：

- Robert Louis Stevenson, *A Child's Garden of Verses*, Project Gutenberg eBook 25608
- Christina Rossetti, *Sing-Song*, Project Gutenberg eBook 76703
- *The Aesop for Children*, Project Gutenberg eBook 19994
- Joseph Jacobs, *English Fairy Tales*, Project Gutenberg eBook 7439
- L. Leslie Brooke, *The Story of the Three Little Pigs*, Project Gutenberg eBook 18155
- Josephine Preston Peabody, *Old Greek Folk Stories Told Anew*, Project Gutenberg eBook 9313
- William Hazlitt, *Table-Talk*, Project Gutenberg eBook 66129

这些作品在对应 Project Gutenberg 记录中标为美国公版；在其他国家分发前仍需核对当地版权状态。每篇必须保留作者、书名、原始 URL、策划等级和来源记录，不能把节选或改写冒充完整原文。内置候选继续进入与 RSS 相同的 ranking、归因、Reader、词汇和阅读事件流程，但不会调用 `/api/extract`。

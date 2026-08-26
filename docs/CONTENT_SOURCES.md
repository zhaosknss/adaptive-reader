# Starter Content Sources

第一版内容池只使用 RSS/Atom 发现候选文章，不把第三方完整文章打包进仓库，也不会在刷新 Feed 时批量抓取正文。

## 当前来源

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

## 使用边界

- 每个来源每次最多读取 8 条候选，Feed 响应上限 1.5 MB、超时 8 秒。
- IndexedDB 的 `candidates` store 只保存标题、URL、摘要、作者、发布时间、发现时间和状态。
- 用户点击“阅读”后，才复用现有 `/api/extract`：抓取目标页面、用 Mozilla Readability 清洗并保存为本机 Article。
- Reader 始终提供“查看原文”链接。RSS 可用性不等于全文再发布授权；当前设计面向本地个人阅读缓存。如果以后公开托管或商业化，必须重新核对各来源条款、robots 与缓存策略。
- 单个来源失败不会清空已有候选；全部失败时显示可重试状态，已有本机文章仍可阅读。

来源定义集中在 `lib/content-sources.ts`。新增或替换来源时，先验证官方 Feed、正文可提取性、更新频率和使用条款，再修改该文件。

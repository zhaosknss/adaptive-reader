# Just Read

一个本地优先、手机优先的自适应英文阅读器。

> Don't study English. Just read English.
>
> A feed that learns both what you like and what you can understand.

阅读体验是产品本身。它不是课程、背单词软件、AI tutor 或打卡工具。

## 项目状态

目前完成的是可以日常使用的本地阅读闭环：

1. 在首页粘贴英文标题和正文，或输入公开文章网址自动提取正文。
2. 文章保存到当前浏览器的 IndexedDB。
3. 在手机优先的 Reader 中阅读；拆词不改变原文的标点、空格和段落。
4. 点击单词后显示简短中文释义，并在本地缓存结果。
5. 记录单词曝光与查询；同一篇文章中的同一单词只计一次曝光。
6. 使用本地词频和个人 `WordState` 估算文章难度，并显示低熟悉词比例和平均句长。
7. 可选“太简单 / 正合适 / 太难”，并记录打开、查词、读完、跳过和反馈事件。
8. 文章可标记为读完或跳过，也可以从首页再次打开。
9. 刷新页面或重启本地服务后，文章和阅读状态仍然存在。
10. 首次打开会进行 20～25 词的轻量自适应判断，并保存一条 `VocabularyProfile`。
11. 新遇到单词时会结合本地词频与 VocabularyPrior 初始化 familiarity；真实阅读行为随后逐渐覆盖先验。
12. 完成判断后首页自动显示真实英文候选；点击时才抓取全文，读完或跳过会自然进入下一篇。

当前已有基于可读性、freshness 和简单 diversity 的 Cold-start Feed。还没有 InterestProfile 或长期推荐学习；下一阶段从真实阅读事件建立兴趣模型。

## Windows 本地启动

需要 Node.js 22 或更高版本，并启用 pnpm。

```powershell
pnpm install
pnpm dev
```

打开终端显示的本地地址，默认为 `http://localhost:3000`。

## 开发检查

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## 本地数据

个人数据保存在当前浏览器的 `just-read` IndexedDB 中。清理这个站点的浏览器数据会删除文章、词汇状态和词典缓存。

主要记录：

- `Article`：正文、来源、创建/开始/完成时间，以及 `unread`、`reading`、`finished`、`skipped` 状态。
- `WordState`：规范化单词、`seenCount`、`lookupCount`、`familiarity` 和首次/最近曝光、查询时间。
- `exposures`：以 `article + normalizedWord` 去重，避免刷新或 React 重渲染污染词汇模型。
- `events`：保存打开、查词、读完、跳过和难度反馈，以及当前阅读时长等元数据。
- `vocabularyProfile`：只保存当前用户的一条冷启动词汇先验，不为测评题目批量创建 `WordState`。
- `candidates`：RSS/Atom 发现的轻量候选元数据；只有用户选择后才抓取正文并生成 `Article`。

`familiarity` 只是一个简单、可解释的熟悉概率估计，不代表用户真正“掌握”了某个词。新文章中的重复曝光会轻微提高它，查询会降低它。

文章难度同样只是针对当前用户的粗略估计。它综合低熟悉词、低频词、句长、长句和文章长度，不声称对应固定的 CEFR 等级。

## 词典与网络

Reader 只依赖统一的 `DictionaryProvider` 接口。当前实现查询免费的 MyMemory 翻译接口和 Free Dictionary API，并缓存结果；找不到远程结果时有少量本地兜底释义。

因此，已经保存的文章可以本地打开，但首次查询大多数新词仍然需要网络。后续可以在不改 Reader UI 的情况下替换为许可清楚的本地词典数据。

从网址导入时，本地服务会请求该公开网页，并用 Mozilla Readability 提取标题和正文。它拒绝本机/常见局域网地址、非 HTML、过大页面、过多跳转和过短正文；相同最终网址不会重复保存。

## 代码结构

- `components/HomeFeed.tsx` — 粘贴文章与最近阅读
- `components/AppShell.tsx`、`components/Onboarding.tsx` — 首次入口与手机优先的自适应词汇判断
- `components/Reader.tsx` — 阅读、点词、释义层、跳过与读完
- `lib/assessment.ts`、`lib/assessment-items.ts` — 纯 TypeScript 测评状态机与小型分档词库
- `lib/content-sources.ts`、`lib/feed.ts`、`lib/feed-ranking.ts` — 固定来源、RSS/Atom 解析和可解释冷启动排序
- `app/api/feed/route.ts` — 带来源隔离、体积限制和超时的候选获取接口
- `lib/storage.ts` — IndexedDB、数据迁移与曝光去重
- `lib/text.ts` — 保留原始文本的 token 化
- `lib/dictionary.ts` — 可替换的 `DictionaryProvider`
- `lib/familiarity.ts` — 最小可解释的熟悉度更新
- `lib/frequency.ts` — 可替换的本地 `FrequencyProvider`
- `lib/difficulty.ts` — 可解释的个性化难度估计
- `lib/article-extraction.ts` — Readability 正文清洗
- `app/api/extract/route.ts` — 带超时和错误处理的薄 URL 抓取接口
- `tests/` — 文本、熟悉度、难度和正文提取测试

## 开源组件与许可证状态

- React、Vite/Vinext、TypeScript、ESLint：按各自上游许可证使用。
- `wordlist-english`（MIT）及其 SCOWL 词表：当前只使用频率等级 10 和 20；保留 SCOWL 上游版权与许可要求。
- Mozilla Readability（Apache-2.0）与 LinkeDOM（ISC）：用于服务端正文提取。
- 当前未复制 Lute 或 LinguaCafe 的代码。
- 项目自身的开源许可证尚未确定。在确定许可证和词典/词频数据来源前，不宣称当前仓库已经可公开分发。

## Roadmap

严格按依赖顺序推进：

1. 首次 Onboarding、自适应词汇判断与 VocabularyPrior
2. Starter content pool 与 Cold-start Feed
3. Reader → Next Article 闭环
4. InterestProfile 与可解释 ranking
5. Exploration、diversity 与 PWA

前 3 项已经完成。当前开发阶段、已验证基线和不可破坏的实现边界记录在 `docs/PROJECT_STATE.md`；内容来源边界见 `docs/CONTENT_SOURCES.md`。

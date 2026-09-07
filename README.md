# Just Read

一个本地优先、手机优先的自适应英文阅读器。

项目完全开源：自有源代码采用 [MIT License](LICENSE)。内置词典、词表和阅读材料保留各自的许可证、署名与公版边界，详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) 和 [内容来源说明](docs/CONTENT_SOURCES.md)。

> Don't study English. Just read English.
>
> A feed that learns both what you like and what you can understand.

阅读体验是产品本身。它不是课程、背单词软件、AI tutor 或打卡工具。

## 项目状态

目前完成的是可以日常使用的本地阅读闭环：

1. 点击底部“阅读”先进入极简一级页；点击“开始阅读”后，系统续读当前文章或准备下一篇，不需要挑选候选。
2. 文章保存到当前浏览器的 IndexedDB。
3. 在手机优先的 Reader 中阅读；拆词不改变原文的标点、空格和段落。
4. 点击单词后优先从随应用提供的本地英汉词典显示简短中文释义，并在 IndexedDB 缓存结果。
5. 只有正文段落进入可视区域后才记录其中的单词曝光；同一篇文章中的同一单词只计一次。
6. 使用本地词频和个人 `WordState` 估算文章难度；Reader 只显示简短难度判断，详细指标留在内部计算中。
7. 可选“太简单 / 正合适 / 太难”，并记录打开、查词、读完、跳过和反馈事件。
8. 文末可选择难度并直接进入下一篇；跳过也会继续下一篇。
9. 刷新页面或重启本地服务后，文章和阅读状态仍然存在。
10. 首次打开会进行 20～25 词的轻量自适应判断，并保存一条 `VocabularyProfile`。
11. 新遇到单词时会结合本地词频与 VocabularyPrior 初始化 familiarity；真实阅读行为随后逐渐覆盖先验。
12. 底部只有“阅读 / 我的”；“我的”提供词汇量评级、点过的词、阅读的文章、阅读偏好、外观和设置六个一级入口。
13. “我的 → 外观”支持跟随系统/白天/黑夜，以及深海蓝、青绿色、紫灰色和炭黑色主题；偏好仅保存在当前设备。
14. 内容分为 Success / Bridge / Open Web 三层：低等级先读短而清楚的授权原文，顺畅后再逐渐接近普通百科、新闻档案和实时网页。
15. 内置 65 条逐页核对的 Simple English Wikipedia 原文导语快照；在线 API 不通时仍可连续阅读。每条都保存原页面、许可、署名和节选/清理标记。
16. 公版文学池覆盖诗歌、寓言、童话、短篇故事、希腊神话和文学散文；普通 RSS 保留在 Open Web 层。
17. “我的 → 阅读偏好”可选择一个“最想读”和多个“也感兴趣”；它只提供冷启动倾向，不会过滤其他类型，真实阅读行为会逐渐取得更高权重。

当前 ranking 显式组合 interest、readability、freshness、exploration 和 diversity。可读性目标会随 `VocabularyProfile.estimatedBand` 调整；低等级优先完整但更短、句词更简单的内容，而不是把同一难度文章统一标成“简单”。显式阅读偏好只作为早期先验；产生新的真实阅读行为后，独立的 `InterestProfile` 会根据来源、主题和少量关键词温和调整排序，且行为证据越多，手动偏好的影响越低。它只是一套本地、可解释的偏好估计，不声称准确判断兴趣。

## Windows 本地启动

需要 Node.js 22 或更高版本，并启用 pnpm。

```powershell
pnpm install
pnpm dev
```

打开终端显示的本地地址，默认为 `http://localhost:3000`。

## 安装为应用

项目包含 Web App Manifest、192/512 应用图标和 Service Worker。在支持 PWA 的浏览器中打开后，可以从浏览器菜单选择“安装应用”或“添加到主屏幕”。安装后会以独立窗口打开，并保留“阅读 / 我的”双标签界面。

Service Worker 使用 network-first：联网时优先获取最新版，断网时回退到已经缓存过的站内页面和资源。内置公版文学正文随应用提供；RSS、URL 抓取和本地词典未覆盖的生僻词仍可能需要网络。文章、词汇状态和兴趣模型继续保存在本机 IndexedDB。

## 开发检查

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## 本地数据

个人数据保存在当前浏览器的 `just-read` IndexedDB 中。清理这个站点的浏览器数据会删除文章、词汇状态和词典缓存。

外观模式和主题颜色属于设备级界面偏好，单独保存在浏览器 `localStorage`，不进入阅读与推荐数据模型。

主要记录：

- `Article`：正文、来源、首次候选归因快照、创建/开始/完成时间，以及 `unread`、`reading`、`finished`、`skipped` 状态。
- `WordState`：规范化单词、`seenCount`、`lookupCount`、`familiarity` 和首次/最近曝光、查询时间。
- `exposures`：以 `article + normalizedWord` 去重，避免刷新或 React 重渲染污染词汇模型。
- `events`：保存打开、查词、读完、跳过和难度反馈，以及当前阅读时长等元数据。
- `recommendationEvents`：保存系统实际选择的 candidate、文章、入口、排名、模型版本和各 ranking 分量。
- `interestProfile`：保存来源、主题和关键词的轻量偏好；读完/跳过会结合阅读时长、查词率和难度反馈更新，同一次推荐只处理一次。
- `contentPreferences`：保存“先都看看”或主/次内容偏好，只作为推荐冷启动先验，不作为内容过滤器。
- `vocabularyProfile`：只保存当前用户的一条冷启动词汇先验，不为测评题目批量创建 `WordState`。
- `candidates`：保存 pool、适用 band、内容出处和可选正文快照；普通 RSS 仍只保存轻量元数据。系统选中下一篇后才创建 Article，并通过持久 `articleId` 连接。

`familiarity` 只是一个简单、可解释的熟悉概率估计，不代表用户真正“掌握”了某个词。新文章中的重复曝光会轻微提高它，查询会降低它。

文章难度同样只是针对当前用户的粗略估计。它综合低熟悉词、低频词、句长、长句和文章长度，不声称对应固定的 CEFR 等级。

## 词典与网络

Reader 只依赖统一的 `DictionaryProvider` 接口。当前随应用提供 58,226 条 ECDICT 核心词和 330,741 条扩展词：常用词按首字母加载，扩展词按前两个字母加载，避免扩大覆盖后拖慢每次点词；常见复数、过去式和进行时查不到精确词形时会尝试基础词形。词典数据采用 MIT 许可，许可证保存在 `public/dictionary/ECDICT-LICENSE.txt`。

本地词典命中时不会请求第三方服务。只有未收录的词才尝试 MyMemory 和 Free Dictionary API；远程失败或返回“暂无中文释义”时不会缓存失败占位，以便之后重新查询。

从网址导入时，本地服务会请求该公开网页，并用 Mozilla Readability 提取标题和正文。它拒绝本机/常见局域网地址、非 HTML、过大页面、过多跳转和过短正文；相同最终网址不会重复保存。

## 代码结构

- `components/HomeFeed.tsx` — 阅读一级页和点击后的续读/后台文章准备
- `components/ProfileScreen.tsx`、`components/ProfileDetailScreen.tsx` — “我的”一级目录与四个二级页面
- `components/BottomNav.tsx` — 阅读/我的双标签导航
- `components/ArticleComposer.tsx` — “我的”中的 URL/正文添加入口
- `components/AppShell.tsx`、`components/Onboarding.tsx` — 首次入口与手机优先的自适应词汇判断
- `components/PwaRegistration.tsx`、`public/sw.js`、`public/manifest.webmanifest` — PWA 注册、离线回退和安装信息
- `components/ThemeProvider.tsx`、`components/ThemeSettings.tsx`、`lib/theme.ts` — 日夜模式、主题色、刷新前初始化和本机偏好
- `components/ContentPreferenceSettings.tsx`、`lib/content-preferences.ts` — 主/次阅读偏好、本机持久化和随行为证据衰减的排序先验
- `components/Reader.tsx` — 阅读、点词、释义层、跳过与读完
- `lib/assessment.ts`、`lib/assessment-items.ts` — 纯 TypeScript 测评状态机与小型分档词库
- `lib/content-sources.ts`、`lib/feed.ts`、`lib/feed-ranking.ts` — 固定来源、RSS/Atom 解析和按词汇等级适配的可解释排序
- `lib/content-pools.ts`、`lib/reusable-content-sources.ts` — Success / Bridge / Open Web 阶段门控、Wikimedia 在线发现和离线回退
- `lib/simple-wiki-snapshots-a.ts`、`lib/simple-wiki-snapshots-b.ts` — 已核对的 CC BY-SA 原文导语快照
- `lib/builtin-readings.ts`、`docs/CONTENT_SOURCES.md` — 公版文学正文、体裁/等级元数据与来源记录
- `lib/interest-profile.ts` — 独立兴趣模型、反馈降噪和候选兴趣/探索分量
- `lib/candidate-import.ts` — 候选正文准备、URL 去重和 Candidate/Article 归因
- `app/api/feed/route.ts` — 带来源隔离、体积限制和超时的候选获取接口
- `lib/storage.ts` — IndexedDB、数据迁移与曝光去重
- `lib/visible-exposure.ts` — 集中的段落可视曝光观察与登记
- `lib/text.ts` — 保留原始文本的 token 化
- `lib/dictionary.ts`、`public/dictionary/` — 可替换的 `DictionaryProvider` 与 ECDICT 本地分片
- `scripts/build-local-dictionary.mjs` — 从上游 ECDICT CSV 重新生成本地分片
- `lib/familiarity.ts` — 最小可解释的熟悉度更新
- `lib/frequency.ts` — 可替换的本地 `FrequencyProvider`
- `lib/difficulty.ts` — 可解释的个性化难度估计
- `lib/article-extraction.ts` — Readability 正文清洗
- `app/api/extract/route.ts` — 带超时和错误处理的薄 URL 抓取接口
- `tests/` — 文本、曝光、归因、阅读入口、熟悉度、难度、Feed 和正文提取测试

## 开源许可证

Adaptive Reader 自有源代码采用 MIT License，允许使用、修改和再发布，但必须保留版权和许可声明。内容与数据不自动归入 MIT：

- React、Vite/Vinext、TypeScript、ESLint：按各自上游许可证使用。
- `wordlist-english`（MIT）及其 SCOWL 词表：当前只使用频率等级 10 和 20；保留 SCOWL 上游版权与许可要求。
- Mozilla Readability（Apache-2.0）与 LinkeDOM（ISC）：用于服务端正文提取。
- ECDICT（MIT）：生成 58,226 条核心词和 330,741 条扩展词的按需加载本地英汉词典分片，保留上游许可证。
- 当前未复制 Lute 或 LinguaCafe 的代码。
- Simple English Wikipedia、Wikinews 与 Project Gutenberg 阅读材料继续遵守各自的署名、相同方式共享或公版地域边界。

完整说明见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。欢迎提交 Issue 和 Pull Request；开发与内容贡献要求见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## Roadmap

严格按依赖顺序推进：

1. 首次 Onboarding、自适应词汇判断与 VocabularyPrior
2. Starter content pool 与 Cold-start Feed
3. Reader → Next Article 闭环
4. 双标签直接阅读主界面
5. InterestProfile 与可解释 ranking
6. Exploration、diversity 与 PWA
7. 中性白视觉系统、日夜模式与多主题色
8. 非强制的显式阅读偏好与行为优先的兴趣融合
9. Success / Bridge / Open Web 内容分层、许可出处和低等级可持续内容池

以上阶段已经完成。当前不再靠继续调 difficulty 权重解决低等级内容不足，而是让可复用内容仍经过同一全文门槛。当前开发阶段、已验证基线和不可破坏的实现边界记录在 `docs/PROJECT_STATE.md`；内容来源与许可边界见 `docs/CONTENT_SOURCES.md`。

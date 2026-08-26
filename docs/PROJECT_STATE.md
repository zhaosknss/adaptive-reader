# Adaptive Reader 项目状态

这是跨会话和上下文压缩后的唯一开发交接入口。更新时间：2026-08-26。

## 产品方向

Adaptive Reader 是一个本地优先、手机优先的个性化英文文章 Feed。它同时学习两件相互独立的事：用户喜欢什么，以及用户目前能顺畅理解什么。默认体验应当是：

`首次打开 → 简短词汇判断 → For You → 阅读 → 点词 → 读完/跳过 → 下一篇`

手动粘贴和 URL 导入继续保留，但属于次级的 Add Content，而不是首页主流程。

## 当前阶段

- 已完成阶段 A：检查并保存当前稳定状态。
- 已完成阶段 B/C：Onboarding、自适应 vocabulary assessment 与 VocabularyPrior。
- 已完成阶段 D/E：Starter content pool 与 Cold-start Feed。
- 已完成阶段 F：Reader 读完/跳过后自动准备并进入下一篇。
- 本地基线提交：`e802093`（`chore: establish adaptive reader baseline`），未推送。
- 下一阶段：InterestProfile 与基于真实行为的可解释 ranking。
- 后续顺序：exploration/diversity → PWA。

## 已确认的稳定能力

- React/Vinext Web 项目，一条命令可在 Windows 本地启动。
- `Article` 生命周期支持 `unread / reading / finished / skipped`。
- Reader 保留原始标点、空格与段落，支持点词中文释义和移动端弹层。
- `WordState` 保存 familiarity、seen/lookup 次数和时间；article+word exposure 去重。
- 本地三档词频先验和可解释的个性化文章难度。
- 打开、查词、读完、跳过、难度反馈与阅读时长事件。
- 手动粘贴与 URL 导入；URL 正文继续复用 Mozilla Readability，包含超时、重复 URL、私网地址、正文过短等保护。
- 数据保存在浏览器 IndexedDB `just-read`；当前数据库版本 6，新增 candidates store，原有 articles、words、dictionary、exposures、events、vocabularyProfile 均保留。
- 首次欢迎页与 4～5 轮、每轮 5 词的 staircase assessment 已接入；旧用户可先继续已有文章。
- 测评只保存一条 VocabularyProfile；frequencyThreshold 与现有词频分数同尺度，新词初始 familiarity 与难度估算会读取该 prior。
- 免费词典请求有 4.5 秒超时；远程服务不可用时不再无限加载。
- 阶段 B/C 验证：lint、typecheck、14 项测试、生产 build 通过；浏览器已走完测评、刷新持久化和 Reader 点词回归，并检查 390×844 与 360×800。
- 5 个 StarterSource 通过 RSS/Atom 发现轻量候选；每个来源限 8 条、1.5 MB、8 秒超时，单源失败隔离。
- Cold-start ranking 显式组合个性化 readability、freshness，并做简单 source/topic diversity reranking。
- For You 已成为首页主流程；Add Content 和最近阅读保留为次级能力。
- 实际浏览器已验证：实时 Feed → 按需 Readability → Reader → 读完/跳过 → 下一篇；390×844 与 360×800 Feed 布局通过。
- 阶段 D～F 验证：lint、typecheck、17 项测试和生产 build 通过。

## 阶段 G/H 的实现边界

- 新建独立 InterestProfile，不把兴趣和 Vocabulary/Readability Profile 合并。
- 兴趣特征先使用 source、topic、keywords 和轻量文本特征，不使用付费 LLM。
- impression/open/reading time/completion/skip/quick exit 的权重集中在 feedback model，不散落在 UI。
- completion 同时可能受兴趣和难度影响；更新兴趣时必须结合阅读时间、查词率和文章难度，不能简单 `finished = +1`。
- ranking 接口显式返回 interest/readability/freshness/exploration/diversity 分量，用户 UI 不展示数值。
- RecommendationEvent 先保存在本地，记录候选、分数、选择和模型版本。

## 阶段 G/H 的完成条件

- InterestProfile 与 VocabularyProfile 分开持久化和更新。
- 连续真实阅读行为能让相关来源/主题的排名温和变化，不造成 Feed 大幅跳动。
- ranking 分量可在开发调试数据中检查，正式卡片仍保持轻量。
- lint、typecheck、tests、build 和手机浏览器真实流程通过。

## 长期硬约束

- Vocabulary/Readability Profile 和 Interest Profile 独立；不要汇成单一 userScore。
- RSS/Atom 只负责发现候选内容；全文仍走 URL → fetch → Readability → Article。
- CandidateArticle 与完整 Article 分开，避免批量抓取全文。
- ranking 最终显式组合 interest、readability、freshness、exploration 和 diversity，保留开发调试解释。
- 不依赖付费 LLM，不加入 tutor、聊天、课程、flashcards、游戏化、登录或云同步。
- Reader 始终是核心体验，不因推荐功能堆叠数据面板。

## 常用命令

```powershell
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

如果当前 Codex 环境找不到 Node，将以下目录临时放到本次 PowerShell 会话的 PATH 前面，不修改系统环境变量：

```powershell
$justReadNodeBin = 'C:\Users\www\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin'
$env:PATH = "$justReadNodeBin;$env:PATH"
```

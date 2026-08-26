# Adaptive Reader 项目状态

这是跨会话和上下文压缩后的唯一开发交接入口。更新时间：2026-08-26。

## 产品方向

Adaptive Reader 是一个本地优先、手机优先的个性化英文文章 Feed。它同时学习两件相互独立的事：用户喜欢什么，以及用户目前能顺畅理解什么。默认体验应当是：

`首次打开 → 简短词汇判断 → For You → 阅读 → 点词 → 读完/跳过 → 下一篇`

手动粘贴和 URL 导入继续保留，但属于次级的 Add Content，而不是首页主流程。

## 当前阶段

- 已完成阶段 A：检查并保存当前稳定状态。
- 已完成阶段 B/C：Onboarding、自适应 vocabulary assessment 与 VocabularyPrior。
- 本地基线提交：`e802093`（`chore: establish adaptive reader baseline`），未推送。
- 下一阶段：Starter content pool 与 Cold-start Feed。
- 后续顺序：Reader/Next Article → InterestProfile → ranking → exploration/diversity → PWA。

## 已确认的稳定能力

- React/Vinext Web 项目，一条命令可在 Windows 本地启动。
- `Article` 生命周期支持 `unread / reading / finished / skipped`。
- Reader 保留原始标点、空格与段落，支持点词中文释义和移动端弹层。
- `WordState` 保存 familiarity、seen/lookup 次数和时间；article+word exposure 去重。
- 本地三档词频先验和可解释的个性化文章难度。
- 打开、查词、读完、跳过、难度反馈与阅读时长事件。
- 手动粘贴与 URL 导入；URL 正文继续复用 Mozilla Readability，包含超时、重复 URL、私网地址、正文过短等保护。
- 数据保存在浏览器 IndexedDB `just-read`；当前数据库版本 5，新增 vocabularyProfile store，原有 articles、words、dictionary、exposures、events 均保留。
- 首次欢迎页与 4～5 轮、每轮 5 词的 staircase assessment 已接入；旧用户可先继续已有文章。
- 测评只保存一条 VocabularyProfile；frequencyThreshold 与现有词频分数同尺度，新词初始 familiarity 与难度估算会读取该 prior。
- 免费词典请求有 4.5 秒超时；远程服务不可用时不再无限加载。
- 阶段 B/C 验证：lint、typecheck、14 项测试、生产 build 通过；浏览器已走完测评、刷新持久化和 Reader 点词回归，并检查 390×844 与 360×800。

## 阶段 D/E 的实现边界

- 建立轻量 `ContentSource` / `CandidateArticle` 边界，不建立第二套正文抓取逻辑。
- 第一版只放少量经过验证的公开英文 RSS/Atom 来源；来源发现候选内容，全文仍复用 URL → fetch → Readability → Article。
- 刷新来源时只保存标题、URL、摘要、发布时间等候选元数据，不批量抓取完整正文。
- Onboarding 完成后默认进入 For You，不要求用户理解或配置 RSS。
- 第一批排序以 VocabularyPrior、粗略可读性、freshness 和 diversity 为主；兴趣模型仍留到真实阅读行为产生之后。
- 手动粘贴、URL 导入和历史记录保留在次级入口。

## 阶段 D/E 的完成条件

- 新用户完成测评后，不粘贴文章也能看到真实英文候选内容。
- 选中候选后按需抓取全文、进入现有 Reader，并缓存为 Article。
- 来源失败、重复候选、正文提取失败和空 Feed 都有可恢复处理。
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

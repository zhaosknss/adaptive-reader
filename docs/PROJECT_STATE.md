# Adaptive Reader 项目状态

这是跨会话和上下文压缩后的唯一开发交接入口。更新时间：2026-09-01。

## 产品方向

Adaptive Reader 是一个本地优先、手机优先的个性化英文文章 Feed。它同时学习两件相互独立的事：用户喜欢什么，以及用户目前能顺畅理解什么。默认体验应当是：

`首次打开 → 简短词汇判断 → 阅读一级页“开始阅读” → Reader → 点词 → 难度反馈/下一篇`

手机界面底部只保留“阅读 / 我的”。“我的”首页是词汇量评级、点过的词、阅读的文章、阅读偏好、外观和设置六个一级入口；点击后进入 `/me/...` 二级页面，底栏仍保持“我的”选中。用户不再从候选列表里选文章。

## 当前阶段

- 已完成阶段 A：检查并保存当前稳定状态。
- 已完成阶段 B/C：Onboarding、自适应 vocabulary assessment 与 VocabularyPrior。
- 已完成阶段 D/E：Starter content pool 与 Cold-start Feed。
- 已完成阶段 F：Reader 读完/跳过后自动准备并进入下一篇。
- 已完成数据基础修复：只有真正进入可视区域的正文段落才登记词汇 exposure；打开文章不再把全文算作已见。
- 已完成 LexicalEvent 事实层：exposure、lookup、recognition 使用统一事件结构，WordState 只由集中聚合逻辑更新；失败查词不降低 familiarity，同一文章/词/上下文 30 秒内重复成功查词只保留交互事件、不重复施加负面证据。
- 已完成 exposure 语义加固：段落至少 20% 可见并持续约 700ms 才登记，页面处于后台时暂停计时；articleId + normalizedWord 的持久去重规则保持不变，单次 exposure 对 familiarity 仅作保守的 `+0.002` 更新。
- 已完成 RecommendationEvent 离线重放快照：保存选中文章、前 15 个候选及各分量、ranking 版本与权重、词汇档位和目标难度；读完或跳过后补写前台阅读时间、最大进度、查词数、曝光词数、难度反馈和完成状态。
- 已完成 CandidateArticle → Article 归因：候选会保存 `articleId`，Article 保存首次来源快照；重复点击、Feed 刷新、重定向后的 URL 与已有手动 URL 文章均会复用既有 Article。
- 已完成主界面收敛：阅读标签先显示一级“开始阅读”，点击后才续读或准备文章，候选列表不对用户暴露；Reader 文末保留可选难度反馈和“下一篇”，底部固定“阅读 / 我的”。
- 已完成“我的”信息分层：首页保留词汇量评级、点过的词、阅读的文章、阅读偏好、外观和设置六个一级入口，各自进入独立二级页，二级页仍属于“我的”。
- 已完成“我的”极简分层修正：阅读偏好与外观从设置拆为独立一级入口；设置只保留添加文章和本机数据。偏好页移除开放模式卡片与解释文案，主偏好支持单选/再次取消，次偏好支持多选/再次取消；主题色只显示可辨识色块，词汇量页移除重复说明。
- 已完成主导航与二级页视觉重心修正：“我的”六个入口改为手机 2×3、桌面 3×2 的卡片网格；词汇量、外观和设置采用居中的单任务舞台，偏好与历史列表仍保持从上向下的阅读布局；阅读一级页增加无文案的 `Aa` 视觉标记，Reader 视觉和交互不变。
- 已完成阶段 G/H 第一版：RecommendationEvent、带 candidate/entryPoint 的阅读入口、独立 InterestProfile 和五分量可解释 ranking 已接通。
- 已完成阅读一级入口：进入“阅读”标签只显示“开始阅读”，用户主动点击后才续读或准备下一篇；Reader 内的“下一篇”仍直接连续阅读。
- 已完成 PWA 第一版：manifest、192/512 图标、standalone 启动、应用快捷入口与 network-first Service Worker 已接入；API 不进入缓存。
- 已完成视觉主题阶段：默认改为中性白与深海蓝，支持跟随系统/白天/黑夜，以及深海蓝、青绿色、紫灰色和炭黑色四种主题；入口位于“我的 → 外观”。
- 已完成 Reader 排版收敛：手机正文 18px/1.68、桌面正文 19px/1.68，长标题使用更紧凑的响应式字号；文章开头以主题色阅读引线和难度标签形成层级，底栏选中态保持克制。正文第一段若只是重复标题会在显示时去重，不修改原始文章内容。
- 已完成本地词典：基于 MIT 许可的 ECDICT 生成 58,226 条核心词和 330,741 条扩展词。核心词按首字母加载，扩展词按前两个字母加载；本地命中不请求第三方服务，并支持常见英语词形回退。MyMemory/Free Dictionary 只补充仍未收录的词，失败占位不再进入持久缓存。
- 已完成点词气泡收敛：修复浏览器原生 `fetch` 被错误绑定导致本地词典始终回退的问题；查词与 lookup 记录并行执行，释义不再等待 IndexedDB 写入；Reader 改为贴近所点单词的轻量指向气泡，只显示词性缩写和一个核心中文义。
- 已完成文学内容池第一版：新增 9 篇随应用提供的公版完整短读，覆盖诗歌、寓言、童话、短篇故事、希腊神话和文学散文；实时 RSS/知识文章继续保留。Candidate 可用 `contentId` 直接准备内置正文，不经过网络提取。
- 已完成低等级选文修正：ranking model v3 不再使用固定 `0.3` 难度目标，而是同时依据 VocabularyProfile 分档、完整正文难度、策划等级和舒适篇幅计算 readability；0～1 档当前有 5 篇短内容。
- 已完成显式阅读偏好：阅读偏好页可选一个“最想读”和多个“也感兴趣”；全部取消时自动回到开放探索。偏好只作为冷启动先验，不过滤其他类型；随着 InterestProfile 行为证据增加，手动偏好权重从 0.62 逐步降至最低 0.18。ranking model 更新为 v4。
- 已完成 Vinext 生产预取兼容：内部导航暂用普通文档链接，避免当前 Vinext beta 的 `next/link` RSC prefetch 初始化报错；IndexedDB 数据与阅读状态不受整页导航影响。
- 本地基线提交：`e802093`（`chore: establish adaptive reader baseline`），未推送。
- 下一阶段：先实际安装并日常阅读，用新增行为数据校准 feedback 权重和 exploration/diversity；暂不继续增加页面。

## 已确认的稳定能力

- React/Vinext Web 项目，一条命令可在 Windows 本地启动。
- `Article` 生命周期支持 `unread / reading / finished / skipped`。
- Reader 保留原始标点、空格与段落，支持点词中文释义和移动端弹层。
- `WordState` 保存 familiarity、seen/lookup 次数和时间；原始词汇事实先进入 `LexicalEvent`，再由统一聚合器更新 WordState。Reader 使用带持续可见门槛的 IntersectionObserver，并由 `recordExposures(articleId, words)` 保证 article+word 去重。
- 本地三档词频先验和可解释的个性化文章难度。
- 打开、查词、读完、跳过、难度反馈与阅读时长事件。
- 手动粘贴与 URL 导入；URL 正文继续复用 Mozilla Readability，包含超时、重复 URL、私网地址、正文过短等保护。
- 数据保存在浏览器 IndexedDB `just-read`；当前数据库版本 9，新增 lexicalEvents store，原有 articles、words、dictionary、exposures、events、vocabularyProfile、candidates、recommendationEvents、interestProfile 与 contentPreferences 均保留。
- 首次欢迎页与 4～5 轮、每轮 5 词的 staircase assessment 已接入；旧用户可先继续已有文章。
- 测评只保存一条 VocabularyProfile；frequencyThreshold 与现有词频分数同尺度，新词初始 familiarity 与难度估算会读取该 prior。
- 免费词典请求有 4.5 秒超时；远程服务不可用时不再无限加载。
- 阶段 B/C 验证：lint、typecheck、14 项测试、生产 build 通过；浏览器已走完测评、刷新持久化和 Reader 点词回归，并检查 390×844 与 360×800。
- 5 个 StarterSource 通过 RSS/Atom 发现轻量候选；每个来源限 8 条、1.5 MB、8 秒超时，单源失败隔离。
- 内置文学候选与 RSS 候选进入同一 CandidateArticle、ranking、RecommendationEvent、Article attribution、Reader 和行为反馈闭环。当前运行时 Feed 共返回 9 个内置候选，其中 5 个为 0～1 级；外部 RSS 全部失败时仍有内容可读。
- Candidate 的持久 `articleId` 是主链接；Article 的 attribution 保存首次 candidate/source/topic 快照。URL 会去除 fragment 并规范化 host，避免常见形式差异造成重复文章。
- ranking 显式组合 interest、readability、freshness、exploration 和 diversity；冷启动时 interest 保持中性，产生新反馈后才温和变化。
- 显式阅读偏好只参与 interest 分量的起始估计；“先都看看”保持中性探索，主偏好、次偏好和其他类型均获得非零分数，不会形成硬筛选。
- RecommendationEvent 保存系统实际选中的 candidate、Article、入口、前 15 名候选快照、ranking 版本/权重、词汇档位、目标难度和候选分量；Reader 的 opened/finished/skipped 事件保存 candidateId、recommendationEventId 与 entryPoint，完成后同时回填阅读 outcome。
- InterestProfile 与 VocabularyProfile 分开持久化。兴趣反馈综合完成/跳过、阅读时长、查词率、估计难度和用户难度反馈；过难导致的跳过会降低负面权重，同一 RecommendationEvent 只更新一次。
- 旧历史行为不会被猜测性回填为兴趣；只有迁移后的明确 RecommendationEvent 才更新 InterestProfile。
- 阅读标签已成为唯一主流程；一级页由用户点击“开始阅读”后，系统在后台选择候选并打开 Reader。Add Content、点击过的词、词汇量评级/重测和阅读记录集中到“我的”。
- 实际浏览器已验证：实时 Feed → 按需 Readability → Reader → 读完/跳过 → 下一篇；390×844 与 360×800 Feed 布局通过。
- 阶段 D～F 验证：lint、typecheck、17 项测试和生产 build 通过。
- 可视段落 exposure 修复验证：lint、typecheck、23 项测试和生产 build 通过；390×844 与 360×800 的 Home/Reader 无横向溢出，页面无运行错误。
- Candidate/Article 归因验证：lint、typecheck、31 项测试和生产 build 通过；真实 Smithsonian 候选成功进入 Reader，刷新后仍存在、首页不再重复推荐，并通过 390×844 与 360×800 回归。Ars Technica 当前一条候选未提取出正文，界面正确显示错误且未生成 Article。
- 双标签直接阅读 UI 验证：lint、typecheck、34 项测试和生产 build 通过；390×844 与 360×800 下“阅读 → Reader”“我的 → 重测入口 → 阅读”真实流程通过，无横向溢出和控制台错误，释义层位于底部导航上方。
- “我的”分层界面验证：lint、typecheck、34 项测试和生产 build 通过；四个一级入口及其二级页均可进入和返回，390×844 与 360×800 下底栏持续选中“我的”，无横向溢出和当前运行错误。
- 推荐事件与 InterestProfile 验证：lint、typecheck、42 项测试和生产 build 通过；390×844 与 360×800 下 resume/history 入口、Reader 和底栏回归通过，无横向溢出和当前运行错误。
- 阅读一级页验证：lint、typecheck、42 项测试和生产 build 通过；进入阅读标签不再自动导航，只有点击“开始阅读”才执行续读或后台推荐。
- PWA 第一版验证：lint、typecheck、44 项测试和生产 build 通过；manifest、Service Worker、192/512 图标均由本地服务正确返回，应用 shell 与已访问站内资源使用 network-first 缓存，feed/extract API 始终走网络。
- 主题系统验证：外观与主题色分开保存到本机 `localStorage`，在页面绘制前应用并同步 PWA 状态栏；开发模式不再注册 Service Worker，避免旧缓存干扰样式模块。lint、typecheck、47 项测试和生产 build 通过；390×844 与 360×800 下首页、设置、Reader、主题切换、刷新持久化和点词释义层均无横向溢出或运行错误。
- Reader 排版验证：lint、typecheck、48 项测试和生产 build 通过；真实长标题文章在 390×844 与 1280×900 下完成白天/黑夜视觉回归，无横向溢出和控制台错误，重复标题首段已移除，用户的“跟随系统”外观设置已恢复。
- 本地词典与点词气泡验证：lint、typecheck、55 项测试和生产 build 通过；浏览器真实点击确认核心词 `become → vi. 变成` 和扩展词 `fanlike → adj. 像扇的`，两者均由本地分片命中。桌面和 390×844 手机视口下气泡均贴近单词、无横向溢出，旧的底部释义抽屉已移除。
- 文学内容与分级排序验证：lint、typecheck、58 项测试和生产 build 通过；隔离的新用户环境中连续选择“不认识”后，“开始阅读”实际进入 1 分钟诗歌 `Rain`，`umbrellas` 点词得到 `n. 伞`。390×844 与 360×800 均无横向溢出；修复导航预取后，新的生产预览标签无 console error。
- 显式阅读偏好逻辑验证：lint、typecheck、63 项测试和生产 build 通过；自动测试覆盖默认全类型、持久化、无效值清理、主题映射、非硬筛选、冷启动排序变化，以及行为兴趣最终超过手动偏好。
- LexicalEvent 与推荐回放数据验证：lint、typecheck、67 项测试和生产 build 通过；新增数据库 v8→v9 迁移测试确认既有 WordState 计数与 familiarity 原值保留。390×844 Reader 实测点词释义正常且无横向溢出。
- “我的”极简入口验证：lint、typecheck、67 项测试和生产 build 通过；390×844 下“我的”、阅读偏好、外观、词汇量评级与设置页均无横向溢出。浏览器实测主偏好可取消并互斥替换，次偏好可同时选中并逐项取消。
- 页面重心与卡片入口验证：lint、typecheck、67 项测试和生产 build 通过；浏览器逐页检查 390×844、360×800 与 1280×900，阅读首页、“我的”、词汇量、阅读偏好、外观、设置和 Reader 均无横向溢出或控制台错误。Reader 未修改。

## 阶段 G/H 的已实现边界

- 新建独立 InterestProfile，不把兴趣和 Vocabulary/Readability Profile 合并。
- 兴趣特征先使用 source、topic、keywords 和轻量文本特征，不使用付费 LLM。
- impression/open/reading time/completion/skip/quick exit 的权重集中在 feedback model，不散落在 UI。
- completion 同时可能受兴趣和难度影响；更新兴趣时必须结合阅读时间、查词率和文章难度，不能简单 `finished = +1`。
- ranking 接口显式返回 interest/readability/freshness/exploration/diversity 分量，用户 UI 不展示数值。
- RecommendationEvent 先保存在本地，记录候选 slate、分数、选择、模型版本/权重和随后产生的阅读 outcome。
- 阅读入口事件需记录 `candidateId` 与 `entryPoint`，避免同一 Article 被多个 Candidate 发现时只靠 primary attribution 误判兴趣来源。

## 阶段 G/H 的完成情况

- InterestProfile 与 VocabularyProfile 已分开持久化和更新。
- 自动测试确认正向阅读会温和提高相关来源/主题排序，难度摩擦会降低负面反馈强度。
- ranking 五个分量保存在 RecommendationEvent 中，正式 UI 不展示调试数值。
- lint、typecheck、42 项测试、build 和手机浏览器真实流程已通过。

## 长期硬约束

- Vocabulary/Readability Profile 和 Interest Profile 独立；不要汇成单一 userScore。
- RSS/Atom 只负责发现候选内容；全文仍走 URL → fetch → Readability → Article。
- 内置公版文学是上述规则的明确例外：正文随应用提供，以 `contentId` 进入 Article；必须保留作者、书名、原始 URL、策划等级和版权来源记录，不能把未标注的改写冒充原文。
- CandidateArticle 与完整 Article 分开，避免批量抓取全文。
- 同一 Article 可以被多个 Candidate 指向；Article 的首次 attribution 不被后续候选覆盖。多标签并发导入去重与 candidate/articleId 索引迁移留作存储加固，不在 InterestProfile 中临时补丁处理。
- ranking 最终显式组合 interest、readability、freshness、exploration 和 diversity，保留开发调试解释。
- 不依赖付费 LLM，不加入 tutor、聊天、课程、flashcards、游戏化、登录或云同步。
- Reader 始终是核心体验，不因推荐功能堆叠数据面板。
- 不重新引入候选卡片选择页；ranking 在后台决定文章，用户只需要从一级页开始阅读，随后跳过或继续下一篇。
- Service Worker 不缓存 feed/extract API，也不声称未曾打开过的页面或首次词典查询可以离线使用。
- 阅读数据继续只进入 IndexedDB；日夜模式和主题颜色只是设备级 UI 偏好，不与 VocabularyProfile 或 InterestProfile 混合。
- 显式阅读偏好与 InterestProfile 分开保存；前者是用户可改的起始先验，后者只由真实阅读行为更新，不能把显式选择伪装成已观察到的行为兴趣。

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

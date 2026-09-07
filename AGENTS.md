# Adaptive Reader 开发约定

开始工作前先读 `docs/PROJECT_STATE.md`，它是当前产品方向、已完成状态和下一阶段的唯一交接入口。代码与文档冲突时以代码为准，并在本阶段结束时修正文档。

## 不可破坏的边界

- 继续维护当前项目，不重新初始化，不创建第二套实现。
- 保留已经验证的 Reader、手动粘贴、URL 导入、DictionaryProvider、WordState、个性化难度、ReadingEvent 和 IndexedDB 数据。
- 产品默认路径是 Onboarding → 阅读一级页“开始阅读” → Reader → 难度反馈/下一篇；底部只保留“阅读 / 我的”，手动粘贴和 URL 导入收在“我的”内。
- Vocabulary/Readability Profile 与 Interest Profile 分开建模，只在 ranking 层组合。
- 核心算法优先写成纯 TypeScript；浏览器存储、React 状态和网络访问留在边界层。
- Web 与手机优先，核心交互必须实际检查 390×844 和一个更窄的 Android 尺寸。
- 不引入付费 AI API、AI tutor、聊天、课程、背词、XP、streak、社交、登录或云同步。
- 不推送远端、部署或清除本地浏览器数据，除非用户明确要求。

## 主开发与专项核验分工

- 主任务负责产品判断、代码实现、文案取舍、提交、推送与部署。
- 可机械执行且不影响产品判断的工作，默认交给独立的 `Adaptive Reader · 专项核验` 任务（Luna Max）：运行 lint/typecheck/tests/build、单次浏览器流程核验、截图检查、数量与许可核对、复现明确 bug。
- 专项核验默认只读；除非主任务明确指定允许写入的产物，否则不修改源码、不提交、不推送、不部署、不清除浏览器数据。
- UI 或交互发生变化、用户明确要求，或发布前需要确认真实流程时，才做一次有目标的浏览器回归；纯内容和纯算法改动优先依赖自动测试，避免重复浏览器操作。
- 主任务收到核验结果后负责判断与修复，不把产品决策交给核验任务。

## 阶段与验收

严格按 `docs/PROJECT_STATE.md` 中的阶段推进。每个阶段完成前运行：

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

需要浏览器回归时，按上面的分工只走一次目标明确的真实流程，并检查手机 viewport。每完成一个阶段，更新 `docs/PROJECT_STATE.md` 中的“当前阶段、已确认状态、下一步”；README 只保留对使用者长期有效的信息，不写会很快过期的开发流水账。

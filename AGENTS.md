# Adaptive Reader 开发约定

开始工作前先读 `docs/PROJECT_STATE.md`，它是当前产品方向、已完成状态和下一阶段的唯一交接入口。代码与文档冲突时以代码为准，并在本阶段结束时修正文档。

## 不可破坏的边界

- 继续维护当前项目，不重新初始化，不创建第二套实现。
- 保留已经验证的 Reader、手动粘贴、URL 导入、DictionaryProvider、WordState、个性化难度、ReadingEvent 和 IndexedDB 数据。
- 产品默认路径是 Onboarding → For You Feed → Reader → Next Article；手动粘贴和 URL 导入只是次级的 Add Content 能力。
- Vocabulary/Readability Profile 与 Interest Profile 分开建模，只在 ranking 层组合。
- 核心算法优先写成纯 TypeScript；浏览器存储、React 状态和网络访问留在边界层。
- Web 与手机优先，核心交互必须实际检查 390×844 和一个更窄的 Android 尺寸。
- 不引入付费 AI API、AI tutor、聊天、课程、背词、XP、streak、社交、登录或云同步。
- 不推送远端、部署或清除本地浏览器数据，除非用户明确要求。

## 阶段与验收

严格按 `docs/PROJECT_STATE.md` 中的阶段推进。每个阶段完成前运行：

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

随后在浏览器中走真实流程，并检查手机 viewport。每完成一个阶段，更新 `docs/PROJECT_STATE.md` 中的“当前阶段、已确认状态、下一步”；README 只保留对使用者长期有效的信息，不写会很快过期的开发流水账。

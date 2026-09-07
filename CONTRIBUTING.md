# Contributing

Thanks for helping improve Adaptive Reader.

Before changing code, read `AGENTS.md` and `docs/PROJECT_STATE.md`. The project
keeps the Reader flow small, stores user data locally, and keeps vocabulary,
difficulty, and interest models separate. Please do not add accounts, paid AI
services, tutoring, flashcards, or gamification without prior discussion.

## Local development

Use Node.js 22.13 or newer and pnpm:

```powershell
pnpm install
pnpm dev
```

Before opening a pull request, run:

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

For behavior or UI changes, describe the user flow you tested. Reader changes
should also be checked at 390×844 and at a narrower Android-sized viewport.

## Content contributions

Do not submit copied article text without a clear reuse license or confirmed
public-domain status. Every bundled reading needs source, author, original URL,
license or public-domain basis, attribution, retrieval date, content type, and
any transformation such as excerpting or whitespace cleanup. A permitted source
still has to pass the existing full-text difficulty pipeline.


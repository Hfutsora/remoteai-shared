# Agent Notes

- Keep these instructions in English. This repository owns Remote AI's shared source modules.
- In the parent repository this checkout lives at `shared/`. Preserve those paths and the existing
  desktop local, desktop remote, mobile and web behavior when changing shared code.
- This is a source submodule, not a standalone npm application. Applications consume shared sources;
  shared sources must never import application internals. Keep reusable types and platform transports
  here and pass application-specific services through typed interfaces. Validate in a compatible
  `piperhex/remoteai` checkout with `node shared/scripts/check-boundaries.mjs --host .`.
- `dependencies.json` owns the dependency contract used by exported browser source snapshots. Keep
  React and host UI contexts deduplicated; Native's React Native runtime retains its own dependencies.
- Translation resources belong to `@remoteai/i18n`. Keep existing public package imports, language
  availability and fallback behavior; never introduce a second translation catalog here.
- Preserve the parent application's typography, themes, accessibility and layout conventions.
  UI changes require inspected screenshots across affected entry points. Context menus must support
  both right-click and touch long-press. Use bundled Playwright Chromium with the parent's browser helper.
- Keep the signed Coze runtime pin and fixtures compatible with the parent's desktop integration.
- Validate relevant unit tests, desktop and web production builds, native type checks and i18n ownership
  checks in the parent. Follow its `AGENTS.md` for additional checks required by the changed feature.
- Commit and push verified shared changes here before updating the parent's gitlink. Never include
  unrelated work or force-push. Update generated dependency archives through the parent export tooling.

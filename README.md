# Remote AI Shared

Shared UI components, protocols, browser helpers and cross-platform logic for
[Remote AI](https://github.com/piperhex/remoteai).

This repository preserves the history of the parent's `shared/` directory. It is checked out at that
same path as a required Git submodule, so existing imports and native embedded resources stay valid.
It is currently a source repository: some modules still depend on desktop application adapters and
types. Installing this repository alone is not a supported npm build.

## Development

From a compatible Remote AI checkout:

```sh
git submodule update --init shared
npm ci
npm run check:i18n
npm run build:desktop
npm run check -w @codex-switch/web
npm run check -w @codex-switch/native
```

The integration CI pins a parent revision and checks this repository's current revision at `host/shared`.
Shared logic tests live with their consuming applications; run the relevant suites there as well.
Translation resources remain in the independent `@remoteai/i18n` package, not in this repository.

Commit and push shared changes first, then update the parent gitlink. Independent consumers such as
Admin UI use generated dependency archives from the parent's export scripts. Those archives are
snapshots, not separately editable shared sources.

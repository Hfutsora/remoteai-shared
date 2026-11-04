# Remote AI Shared

Shared UI components, protocols, browser helpers and cross-platform logic for
[Remote AI](https://github.com/piperhex/remoteai).

This repository preserves the history of the parent's `shared/` directory. It is checked out at that
same path as a required Git submodule, so existing imports and native embedded resources stay valid.
Applications depend on these sources; shared modules never depend on application internals. Shared
contracts and platform transports live here, while host-specific business services stay in the apps.
Installing this repository alone is not a supported npm build.

## Development

From a compatible Remote AI checkout:

```sh
git submodule update --init shared packages/i18n apps/web apps/native
npm ci
npm run check:boundaries
npm run check:i18n
npm run build:desktop
npm run export:web && npm ci --prefix apps/web && npm run check:web
npm run export:native && npm ci --prefix apps/native && npm --prefix apps/native run check
```

The integration CI checks this revision at `host/shared` in the parent branch selected by `host_ref`
or the repository variable `REMOTEAI_HOST_REF` (default: `master`).
Shared logic tests live with their consuming applications; run the relevant suites there as well.
Translation resources remain in the independent `@remoteai/i18n` package, not in this repository.

Commit and push shared changes first, then update the parent gitlink. Independent consumers such as
Admin UI use generated dependency archives from the parent's export scripts. Those archives are
snapshots, not separately editable shared sources.

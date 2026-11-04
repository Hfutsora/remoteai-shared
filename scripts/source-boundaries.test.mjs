import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { inspectSourceBoundaries } from './source-boundaries.mjs';

test('shared sources cannot import hosts and applications cannot import sibling or vendored application sources', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'remoteai-boundaries-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (file, content) => {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), content);
  };
  write('shared/view.ts', "export { host } from '../apps/desktop/src/host';");
  write('shared/theme.less', "@import (reference) '../apps/web/src/theme.less';");
  write('apps/web/src/view.ts', "const view = import('../../desktop/src/view');");
  write('apps/desktop/src/view.ts', "type T = import('../../web/src/types').T;");
  write('apps/native/src/view.ts', "import type { T } from '../vendor/apps/desktop/src/types';");
  const options = { shared: path.join(root, 'shared'),
    applications: ['desktop', 'web', 'native'].map(name => path.join(root, 'apps', name)) };
  assert.equal(inspectSourceBoundaries(options).violations.length, 5);
  // An optional sibling need not be initialized for its source dependency to be rejected.
  assert.equal(inspectSourceBoundaries({ shared: path.join(root, 'shared'),
    applications: [path.join(root, 'apps/web')] }).violations.length, 3);
  write('shared/view.ts', "export { core } from './core';");
  write('shared/theme.less', "@import (reference) './theme/tokens.less';");
  write('apps/web/src/view.ts', "import { core } from '../../../shared/core';");
  write('apps/desktop/src/view.ts', "import { invoke } from '@tauri-apps/api/core';");
  write('apps/native/src/view.ts', "import type { T } from '../vendor/shared/types';");
  assert.deepEqual(inspectSourceBoundaries(options).violations, []);
});

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspectSourceBoundaries } from './source-boundaries.mjs';

const shared = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== '--host')) throw new Error('Usage: check-boundaries.mjs [--host path]');
const applications = args.length ? ['desktop', 'web', 'native', 'admin-ui']
  .map(name => path.resolve(args[1], 'apps', name)) : [];
const result = inspectSourceBoundaries({ shared, applications });
for (const violation of result.violations) {
  console.error(`${violation.file}:${violation.line}: application source dependency: ${violation.specifier}`);
}
if (result.violations.length) process.exitCode = 1;
else console.log(`Verified shared and application boundaries across ${result.files} source files.`);

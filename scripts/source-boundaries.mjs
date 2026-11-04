import fs from 'node:fs';
import path from 'node:path';

const SOURCE_EXTENSION = /\.(?:[cm]?[jt]sx?|css|less)$/;
const TEST_SOURCE = /\.(?:test|spec)\./;
const IGNORED_DIRECTORIES = new Set(['.git', 'node_modules', 'vendor', '.workspace']);

function sourceFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (IGNORED_DIRECTORIES.has(entry.name)) return [];
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(filename);
    return SOURCE_EXTENSION.test(filename) && !TEST_SOURCE.test(filename) ? [filename] : [];
  });
}

/** Include runtime imports, type imports, exports, workers and stylesheet dependencies. */
export function sourceReferences(content) {
  const imports = /(?:\b(?:from|import)\s*|\b(?:import|require)\s*\(\s*|new\s+URL\s*\(\s*)['"]([^'"\r\n]+)['"]/g;
  const styles = /(?:@import\s*(?:\([^)]*\)\s*)?|url\(\s*)['"]([^'"\r\n]+)['"]/g;
  return [...content.matchAll(imports), ...content.matchAll(styles)]
    .map(match => ({ specifier: match[1], line: content.slice(0, match.index).split('\n').length }));
}

const inside = (directory, filename) => filename === directory || filename.startsWith(directory + path.sep);

export function inspectSourceBoundaries({ shared, applications = [] }) {
  const roots = [{ directory: path.resolve(shared), shared: true },
    ...applications.map(directory => ({ directory: path.resolve(directory), shared: false }))];
  const violations = [];
  let files = 0;
  for (const entry of roots) {
    const source = entry.shared ? entry.directory : path.join(entry.directory, 'src');
    for (const filename of sourceFiles(source)) {
      if (entry.shared && inside(path.join(entry.directory, 'scripts'), filename)) continue;
      files += 1;
      for (const reference of sourceReferences(fs.readFileSync(filename, 'utf8'))) {
        if (!reference.specifier.startsWith('.')) continue;
        const target = path.resolve(path.dirname(filename), reference.specifier.split('?')[0]);
        const relative = path.relative(entry.directory, target).replaceAll('\\', '/');
        const vendoredApplication = /^vendor\/apps\//.test(relative);
        const siblingApplication = /^\.\.\/(?:desktop|web|native|admin-ui)\//.test(relative);
        const otherApplication = siblingApplication || roots.some(candidate => !candidate.shared && candidate !== entry
          && inside(candidate.directory, target));
        const outsideShared = entry.shared && !inside(entry.directory, target);
        if (outsideShared || otherApplication || vendoredApplication) {
          violations.push({ file: filename, ...reference });
        }
      }
    }
  }
  return { files, violations };
}

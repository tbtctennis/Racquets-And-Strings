import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveComparisonBase } from './lib/comparison-base.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2];

if (!['check', 'write'].includes(mode)) {
  console.error('Usage: node scripts/run-prettier.mjs <check|write>');
  process.exit(2);
}

const names = new Set();
const addFiles = (args, required = false) => {
  let output;
  try {
    output = execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  } catch (error) {
    // Some sandboxed Node runtimes report EPERM after a successful child exit while
    // still returning status 0 and complete stdout. Treat that result as successful.
    if (error?.status !== 0 || typeof error?.stdout !== 'string') {
      if (required) throw error;
      return false;
    }
    output = error.stdout;
  }
  output
    .split('\0')
    .filter(Boolean)
    .forEach((file) => names.add(file));
  return true;
};

// The formatter gate is a first-party tracked-file gate, not merely a diff gate. Diff discovery
// below keeps diagnostics focused in local workflows, while this enumeration guarantees an
// up-to-date branch cannot silently check zero files in CI. Planning history and operational
// sprint records are intentionally protected from mechanical rewrites; opt in when manually
// formatting those documents with FORMAT_INCLUDE_OPERATIONAL_DOCS=1.
addFiles(['ls-files', '-z', '--', '.', ':(exclude).agents/**'], true);

const comparisonBase = process.env.ARCHITECTURE_BASE_SHA;
let comparedCommit = false;
if (comparisonBase) comparedCommit = addFiles(['diff', '--name-only', '-z', `${comparisonBase}...HEAD`]);
const devAnujBase = resolveComparisonBase(root);
if (!comparedCommit && devAnujBase) comparedCommit = addFiles(['diff', '--name-only', '-z', `${devAnujBase}...HEAD`]);
if (!comparedCommit) addFiles(['diff', '--name-only', '-z', 'HEAD~1...HEAD']);
addFiles(['diff', '--name-only', '-z', 'HEAD'], true);
addFiles(['diff', '--cached', '--name-only', '-z'], true);
addFiles(['ls-files', '--others', '--exclude-standard', '-z', '--', '.', ':(exclude).agents/**'], true);

const files = [...names]
  .filter((file) => existsSync(path.join(root, file)) && !file.startsWith('.git/'))
  .filter((file) => !file.startsWith('docs/planning/'))
  .filter((file) => process.env.FORMAT_INCLUDE_OPERATIONAL_DOCS === '1' || !file.startsWith('docs/development/'))
  .sort();

if (!files.length) {
  console.log('No changed first-party files found for Prettier.');
  process.exit(0);
}

const prettier = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'prettier.cmd' : 'prettier');
const operation = mode === 'check' ? '--check' : '--write';
const result = spawnSync(prettier, [operation, '--ignore-unknown', ...files], {
  cwd: root,
  stdio: 'inherit',
});

if (result.error) {
  console.error(`Could not run Prettier: ${result.error.message}`);
  process.exitCode = 1;
} else {
  process.exitCode = result.status ?? 1;
}

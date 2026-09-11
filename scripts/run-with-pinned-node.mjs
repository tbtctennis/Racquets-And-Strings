import { spawn, spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const miseConfig = await readFile(path.join(root, '.mise.toml'), 'utf8');
const configuredVersion = miseConfig.match(/^node\s*=\s*"([^"]+)"\s*$/m)?.[1];
const args = process.argv.slice(2);

if (!configuredVersion) throw new Error('Could not read the pinned Node version from .mise.toml.');
if (args.shift() !== '--' || args.length === 0) {
  throw new Error('Usage: node scripts/run-with-pinned-node.mjs -- <node arguments>');
}

const probeVersion = (executable) => {
  const result = spawnSync(executable, ['--version'], { cwd: root, encoding: 'utf8' });
  if (result.error || result.status !== 0) return null;
  return result.stdout.trim().replace(/^v/, '');
};

let nodePath = process.execPath;
if (process.versions.node !== configuredVersion) {
  const resolved = spawnSync('mise', ['which', 'node'], { cwd: root, encoding: 'utf8' });
  if (resolved.error || resolved.status !== 0 || !resolved.stdout.trim()) {
    throw new Error(`Node ${configuredVersion} is required. Run "mise trust && mise install" in ${root}, then retry.`, {
      cause: resolved.error,
    });
  }
  nodePath = resolved.stdout.trim();
  const resolvedVersion = probeVersion(nodePath);
  if (resolvedVersion !== configuredVersion) {
    throw new Error(
      `mise resolved Node ${resolvedVersion || 'unknown'}, but .mise.toml requires ${configuredVersion}. ` +
        'Run "mise install" and retry.',
    );
  }
  console.log(`Using repository-pinned Node ${configuredVersion} (host is ${process.versions.node}).`);
}

const env = {
  ...process.env,
  PATH: `${path.dirname(nodePath)}${path.delimiter}${process.env.PATH || ''}`,
};
const child = spawn(nodePath, args, { cwd: process.cwd(), env, stdio: 'inherit' });
const exitCode = await new Promise((resolve, reject) => {
  child.once('error', reject);
  child.once('exit', (code, signal) => resolve(code ?? (signal ? 1 : 0)));
});
process.exitCode = exitCode;

import { mkdirSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(readFileSync(resolve(repositoryRoot, 'package.json'), 'utf8'));
const artifactsDirectory = resolve(repositoryRoot, 'artifacts');
const outputPath = resolve(artifactsDirectory, `${packageJson.name}-${packageJson.version}.vsix`);
const executable = process.platform === 'win32' ? 'vsce.cmd' : 'vsce';

mkdirSync(artifactsDirectory, { recursive: true });

const result = spawnSync(executable, ['package', '--no-dependencies', '--out', outputPath], {
  cwd: repositoryRoot,
  stdio: 'inherit',
});

if (result.error) {
  throw result.error;
}

process.exitCode = result.status ?? 1;

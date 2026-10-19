#!/usr/bin/env node
// Isolate the root plugin from textless and use a portable copy on macOS/Linux.
import { mkdtemp, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const temporary = await mkdtemp(join(tmpdir(), 'effortshift-plugin-'));
try {
  for (const path of ['.claude-plugin', 'hooks', 'types', 'commands', 'tests']) {
    await cp(join(root, path), join(temporary, path), { recursive: true, filter: source => !source.includes('/.claude-plugin/types') });
  }
  const env = { ...process.env, CLAUDE_CODE_ENABLE_FUNCTION_HOOKS: '1' };
  for (const args of [['plugin', 'validate', temporary], ['plugin', 'test', temporary]]) {
    const result = spawnSync('claude', args, { cwd: temporary, env, stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) { process.exitCode = result.status ?? 1; break; }
  }
} finally {
  await rm(temporary, { recursive: true, force: true });
}

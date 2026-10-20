import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { installBinary, sha256, shellQuote, sourceHash } from '../tools/native-codex.mjs';

test('native installer preserves other commands and forwards literal arguments', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'effortshift-install-'));
  try {
    const binDir = join(temporary, 'bin');
    const dataDir = join(temporary, "data's space");
    await mkdir(binDir);
    await writeFile(join(binDir, 'codex'), 'official');
    const binary = join(temporary, 'source');
    await writeFile(binary, '#!/bin/sh\nprintf "%s\\n" "$@"\n');
    const launcher = await installBinary(binary, { binDir, dataDir, id: '012345678abc' });
    const args = ['space here', "it's literal", '$(echo unsafe)', '--version'];
    const result = spawnSync(launcher, args, { encoding: 'utf8' });
    assert.equal(result.status, 0);
    assert.deepEqual(result.stdout.trimEnd().split('\n'), args);
    assert.equal(await readFile(join(binDir, 'codex'), 'utf8'), 'official');
    await writeFile(join(dataDir, '012345678abc/codex'), '#!/bin/sh\necho stale\n');
    await assert.rejects(installBinary(binary, { binDir, dataDir, id: '012345678abc' }), /integrity mismatch/);
    await writeFile(launcher, '#!/bin/sh\necho someone else\n');
    await assert.rejects(installBinary(binary, { binDir, dataDir, id: '012345678abc' }), /Preserving/);
    await rm(launcher);
    await symlink(join(binDir, 'codex'), launcher);
    await assert.rejects(installBinary(binary, { binDir, dataDir, id: '012345678abc' }), /Preserving/);
    assert.equal(sha256('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    assert.equal(shellQuote('simple'), "'simple'");
  } finally { await rm(temporary, { recursive: true, force: true }); }
});

test('source integrity detects local changes and excludes only its stamp', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'effortshift-tree-'));
  try {
    await writeFile(join(temporary, 'source.rs'), 'original');
    const before = await sourceHash(temporary);
    await writeFile(join(temporary, '.effortshift-build'), 'stamp');
    assert.equal(await sourceHash(temporary), before);
    await writeFile(join(temporary, 'source.rs'), 'modified');
    assert.notEqual(await sourceHash(temporary), before);
  } finally { await rm(temporary, { recursive: true, force: true }); }
});

test('entrypoint invoked through a symlink still validates its action', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'effortshift-entry-'));
  try {
    const alias = join(temporary, 'alias.mjs');
    await symlink(new URL('../tools/native-codex.mjs', import.meta.url).pathname, alias);
    const result = spawnSync(process.execPath, [alias, 'invalid-action'], { encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Usage:/);
    const imported = spawnSync(process.execPath, ['--input-type=module', '-'], {
      input: `await import(${JSON.stringify(new URL('../tools/native-codex.mjs', import.meta.url).href)});`, encoding: 'utf8',
    });
    assert.equal(imported.status, 0, imported.stderr);
  } finally { await rm(temporary, { recursive: true, force: true }); }
});

test('zsh default uses the panel for sessions and preserves official utility commands', {
  skip: process.platform !== 'darwin' && 'macOS zsh integration',
}, async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'effortshift-shell-'));
  try {
    for (const command of ['codex', 'codex-effortshift']) {
      const path = join(temporary, command);
      await writeFile(path, `#!/bin/sh\nprintf '%s\\n' '${command}' "$@"\n`);
      await chmod(path, 0o755);
    }
    const script = new URL('../native-codex/shell.zsh', import.meta.url).pathname;
    const cases = [
      [[], 'codex-effortshift'],
      [['hello $(literal)', "it's text"], 'codex-effortshift'],
      [['-m', 'exec', 'hello'], 'codex-effortshift'],
      [['resume', '--last'], 'codex-effortshift'],
      [['fork', '--last'], 'codex-effortshift'],
      [['--', 'exec'], 'codex-effortshift'],
      [['--version'], 'codex'],
      [['--help'], 'codex'],
      [['exec', '--json', 'hello'], 'codex'],
      [['-C', 'folder with spaces', 'exec', 'hello'], 'codex'],
      [['plugin', 'list'], 'codex'],
      [['app-server'], 'codex'],
      [['execpolicy', 'check'], 'codex'],
      [['stdio-to-uds', '/tmp/socket'], 'codex'],
      [['cloud-tasks', 'list'], 'codex'],
      [['--remote=example'], 'codex'],
    ];
    for (const [args, expected] of cases) {
      const result = spawnSync('/bin/zsh', ['-f', '-c', 'source "$1"; shift; codex "$@"', 'test', script, ...args], {
        env: { ...process.env, PATH: `${temporary}:${process.env.PATH}` }, encoding: 'utf8',
      });
      assert.equal(result.status, 0, result.stderr);
      assert.deepEqual(result.stdout.trimEnd().split('\n'), [expected, ...args]);
    }
    await writeFile(join(temporary, 'codex-effortshift'), '#!/bin/sh\nprintf \'%s\\n\' codex-effortshift "$CODEX_HOME" "$@"\n');
    const profile = join(temporary, 'rafael profile');
    const result = spawnSync('/bin/zsh', ['-f', '-c', 'source "$1"; shift; codex-rafael() { CODEX_HOME="$EFFORTSHIFT_TEST_PROFILE" codex "$@"; }; codex-rafael "$@"', 'test', script, 'hello $(literal)'], {
      env: { ...process.env, PATH: `${temporary}:${process.env.PATH}`, EFFORTSHIFT_TEST_PROFILE: profile }, encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(result.stdout.trimEnd().split('\n'), ['codex-effortshift', profile, 'hello $(literal)']);
  } finally { await rm(temporary, { recursive: true, force: true }); }
});

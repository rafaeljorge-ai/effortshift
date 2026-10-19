#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile, mkdtemp, rename, rm, copyFile, chmod, lstat, readdir, readlink, realpath } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export const shellQuote = value => `'${value.replaceAll("'", "'\\''")}'`;
export async function fileHash(path) {
  const hash = createHash('sha256');
  for await (const bytes of createReadStream(path)) hash.update(bytes);
  return hash.digest('hex');
}
export async function sourceHash(directory) {
  const hash = createHash('sha256');
  async function visit(relative) {
    for (const entry of (await readdir(join(directory, relative), { withFileTypes: true })).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
      if (!relative && entry.name === '.effortshift-build') continue;
      const path = join(relative, entry.name);
      if (entry.isDirectory()) await visit(path);
      else hash.update(JSON.stringify([path, entry.isSymbolicLink()
        ? ['link', await readlink(join(directory, path))]
        : ['file', await fileHash(join(directory, path))]]));
    }
  }
  await visit('');
  return hash.digest('hex');
}
const exists = async path => lstat(path).then(() => true, error => {
  if (error.code === 'ENOENT') return false;
  throw error;
});
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed (${result.status ?? result.signal})`);
}

export async function installBinary(binary, { binDir, dataDir, id }) {
  if (!/^[a-f0-9]{12}$/.test(id)) throw new Error('Invalid build identity');
  const launcher = join(binDir, 'codex-effortshift');
  const marker = '# EffortShift native Codex launcher';
  if (await exists(launcher)) {
    const stat = await lstat(launcher);
    if (!stat.isFile() || !(await readFile(launcher, 'utf8')).startsWith(`#!/bin/sh\n${marker}\n`))
      throw new Error(`Preserving existing command: ${launcher}`);
  }
  const installed = join(dataDir, id, 'codex');
  await mkdir(dirname(installed), { recursive: true });
  if (await exists(installed)) {
    if (!(await lstat(installed)).isFile() || await fileHash(installed) !== await fileHash(binary))
      throw new Error(`Installed binary integrity mismatch: ${installed}`);
  } else {
    const temporary = `${installed}.tmp-${process.pid}`;
    await copyFile(binary, temporary);
    await chmod(temporary, 0o755);
    await rename(temporary, installed);
  }
  await mkdir(binDir, { recursive: true });
  const temporary = `${launcher}.tmp-${process.pid}`;
  await writeFile(temporary, `#!/bin/sh\n${marker}\nexec ${shellQuote(installed)} "$@"\n`, { mode: 0o755 });
  await rename(temporary, launcher);
  return launcher;
}

async function main() {
  const action = process.argv[2];
  if (!['prepare', 'build', 'install'].includes(action))
    throw new Error('Usage: node tools/native-codex.mjs prepare|build|install [cache-directory]');
  const upstream = JSON.parse(await readFile(join(root, 'native-codex/upstream.json'), 'utf8'));
  if (!/^[a-f0-9]{64}$/.test(upstream.sourceSha256 ?? ''))
    throw new Error('Missing verified patched source fingerprint');
  const patch = await readFile(join(root, 'native-codex/panel.patch'));
  const id = sha256(Buffer.concat([Buffer.from(upstream.sha256), patch])).slice(0, 12);
  // Keep large Rust sources/artifacts on the same volume as this checkout.
  const cache = resolve(process.argv[3] ?? join(root, '../effortshift-native-build'));
  const source = join(cache, `source-${id}`);
  await mkdir(cache, { recursive: true });
  if (!(await exists(source))) {
    const temporary = await mkdtemp(join(cache, '.prepare-'));
    try {
      const archive = join(temporary, 'codex.tar.gz');
      run('curl', ['--fail', '--location', '--retry', '2', '--output', archive, upstream.archive]);
      if (sha256(await readFile(archive)) !== upstream.sha256) throw new Error('Upstream archive integrity mismatch');
      const staging = join(temporary, 'source');
      await mkdir(staging);
      run('tar', ['-xzf', archive, '--strip-components=1', '-C', staging]);
      const patchSnapshot = join(temporary, 'panel.patch');
      await writeFile(patchSnapshot, patch);
      run('patch', ['--batch', '--forward', '-p1', '-i', patchSnapshot], { cwd: staging });
      if (await sourceHash(staging) !== upstream.sourceSha256) throw new Error('Patched source integrity mismatch');
      await writeFile(join(staging, '.effortshift-build'), JSON.stringify({ id }));
      await rename(staging, source);
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
  }
  const stamp = JSON.parse(await readFile(join(source, '.effortshift-build'), 'utf8'));
  if (stamp.id !== id || upstream.sourceSha256 !== await sourceHash(source))
    throw new Error('Source identity mismatch');
  const target = join(cache, 'target');
  const binary = join(target, 'debug/codex');
  if (action !== 'prepare') {
    run('cargo', ['build', '--locked', '-p', 'codex-cli', '--bin', 'codex'], {
      cwd: join(source, 'codex-rs'), env: { ...process.env, CARGO_TARGET_DIR: target },
    });
  }
  if (action === 'install') {
    const launcher = await installBinary(binary, {
      binDir: join(homedir(), '.local/bin'), dataDir: join(homedir(), '.local/share/effortshift/native'), id: (await fileHash(binary)).slice(0, 12),
    });
    run(launcher, ['--version']);
    console.log(`Installed ${launcher}; official codex unchanged.`);
  } else console.log(`Prepared ${source}${action === 'build' ? `; binary ${binary}` : ''}`);
}

if (process.argv[1] && await realpath(process.argv[1]).catch(() => null) === await realpath(fileURLToPath(import.meta.url)))
  main().catch(error => { console.error(error.message); process.exitCode = 1; });

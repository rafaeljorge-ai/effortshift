#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
const root = new URL('../', import.meta.url);
const json = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const pkg = await json('package.json');
for (const path of ['.claude-plugin/plugin.json', 'plugins/codex/.codex-plugin/plugin.json']) {
  const manifest = await json(path);
  assert.equal(manifest.name, 'effortshift', `${path}: plugin identity`);
  assert.equal(manifest.version, pkg.version, `${path}: release version`);
}
const source = await readFile(new URL('src/decision.mjs', root), 'utf8');
assert.equal(await readFile(new URL('plugins/codex/lib/decision.mjs', root), 'utf8'), source, 'Rebuild Codex plugin before publishing');
const tracked = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8' });
if (tracked.status !== 0) throw new Error('Unable to inspect Git index');
const privatePath = /(^|\/)(\.env(?:\.[^/]+)?|auth\.json|credentials\.json|\.superpowers)(\/|$)|^artifacts\/private\//;
const secret = /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9]{30,}\b|\bsk-(?:proj-|ant-)[A-Za-z0-9_-]{30,}/;
for (const path of new Set(tracked.stdout.split('\0').filter(Boolean))) {
  if (path.endsWith('.env.example')) continue;
  assert.ok(!privatePath.test(path), `Private path in Git index: ${path}`);
  // Scan our delivery surfaces; inherited public upstream history stays intact.
  if (!/^(?:src\/|bin\/|web\/|hooks\/|commands\/|types\/|plugins\/|native-codex\/|test\/|tests\/|tools\/(?:check-|build-codex|native-codex|test-browser|test-effortshift)|\.agents\/|\.claude-plugin\/|\.github\/|docs\/(?:planta\/|QA_REPORT\.md|CODEX-(?:NATIVE|TUI)\.md|CLAUDE-CODEX-PARITY\.md|UPSTREAM-SYNC\.md)|README\.md|CHANGELOG\.md|UPSTREAM\.json|package\.json|AGENTS\.md)/.test(path)) continue;
  const contents = await readFile(new URL(path, root), 'utf8');
  assert.ok(!secret.test(contents), `Credential-like content in ${path}`);
}
console.log(`Distribution checks passed (${pkg.version}); no private paths or recognized credentials in delivery surfaces.`);

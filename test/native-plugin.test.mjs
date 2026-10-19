import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, cp, readFile, readdir, rm, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = fileURLToPath(new URL("../", import.meta.url));
const plugin = join(root, "plugins/codex");
const hooks = JSON.parse(await readFile(join(plugin, "hooks/hooks.json"), "utf8"));
const payload = (prompt = "oi") => ({ hook_event_name: "UserPromptSubmit", prompt });
function run(input, { path = plugin, profile = "balanced", shell = false } = {}) {
  const options = {
    input: typeof input === "string" || Buffer.isBuffer(input) ? input : JSON.stringify(input),
    encoding: "utf8", timeout: 5000, maxBuffer: 64 * 1024,
    env: { ...process.env, EFFORTSHIFT_PROFILE: profile, PLUGIN_ROOT: path },
  };
  const child = shell
    ? spawnSync("/bin/sh", ["-c", hooks.hooks.UserPromptSubmit[0].hooks[0].command], options)
    : spawnSync(process.execPath, [join(path, "scripts/hook.mjs")], options);
  assert.equal(child.status, 0, child.stderr || child.error?.message);
  assert.equal(child.error, undefined);
  assert.equal(child.stderr, "");
  const output = JSON.parse(child.stdout);
  // Exact safe subset of command output schema; never effort/model/context/block.
  assert.deepEqual(Object.keys(output).sort(), ["continue", "systemMessage"]);
  assert.equal(output.continue, true);
  assert.equal(typeof output.systemMessage, "string");
  assert.ok(child.stdout.endsWith("\n"));
  return output.systemMessage;
}
async function snapshot(path) {
  const result = {};
  for (const name of (await readdir(path, { recursive: true, withFileTypes: true }))) {
    if (name.isFile()) {
      const full = join(name.parentPath, name.name);
      result[full.slice(path.length)] = createHash("sha256").update(await readFile(full)).digest("hex");
    }
  }
  return result;
}

test("manifest and repo marketplace target the self-contained native package", async () => {
  const manifest = JSON.parse(await readFile(join(plugin, ".codex-plugin/plugin.json"), "utf8"));
  const marketplace = JSON.parse(await readFile(join(root, ".agents/plugins/marketplace.json"), "utf8"));
  assert.equal(manifest.name, "effortshift");
  assert.equal(manifest.version, "0.2.0-alpha.1");
  assert.equal(manifest.skills, "./skills/");
  assert.equal(manifest.hooks, "./hooks/hooks.json");
  assert.equal(marketplace.name, "effortshift");
  assert.deepEqual(marketplace.plugins[0].source, { source: "local", path: "./plugins/codex" });
  assert.deepEqual(Object.keys(hooks.hooks).sort(), ["SessionStart", "UserPromptSubmit"]);
  for (const event of Object.values(hooks.hooks)) {
    assert.equal(event[0].hooks[0].command, 'node "${PLUGIN_ROOT}/scripts/hook.mjs"');
    assert.equal(event[0].hooks[0].type, "command");
  }
  const help = await readFile(join(plugin, "skills/effortshift/SKILL.md"), "utf8");
  assert.match(help, /^---\nname: effortshift\ndescription: .+\n---/);
});

test("SessionStart presents one short advisory without reading supplied paths", () => {
  const message = run({ hook_event_name: "SessionStart", transcript_path: "/does-not-exist/private", cwd: "\u001bPRIVATE" });
  assert.match(message, /recomenda esforço/);
  assert.match(message, /sem aplicá-lo/);
  assert.doesNotMatch(message, /PRIVATE|does-not-exist/);
  assert.ok(message.length < 150);
});

test("recommendations are explicit, consultative and share risk/economy rules", () => {
  for (const [prompt, profile, expected] of [
    ["oi", "balanced", "low"],
    ["Explique este arquivo", "balanced", "medium"],
    ["investigar arquitetura", "balanced", "high"],
    ["Explique este arquivo", "economy", "low"],
    ["corrija este arquivo", "economy", "medium"],
    ["auth tenant migration", "economy", "high"],
    ["oi", "quality", "high"],
  ]) {
    const message = run(payload(prompt), { profile });
    assert.match(message, new RegExp(`Recomendado: ${expected} · não aplicado pelo hook`));
    assert.match(message, /Consultivo · catálogo nativo desconhecido/);
    const lines = message.split("\n");
    assert.equal(lines.length, 4);
    assert.equal(lines[0], `╭─ EffortShift · perfil ${profile}`);
    const levels = ["low", "medium", "high", "xhigh", "max"];
    assert.equal(lines[1], `│ ${levels.map((level) => level === expected
      ? `[${level.toUpperCase()}]` : level.toUpperCase()).join("  ")}`);
    assert.equal((lines[1].match(/\[/g) ?? []).length, 1);
    assert.ok(lines.every((line) => line.length <= 64));
    // Newline separators are intentional; no terminal controls or bidi formatting.
    assert.doesNotMatch(message.replaceAll("\n", ""), /[\p{Cc}\p{Cf}]/u);
  }
});

test("malformed inputs and invalid profile fail open with honest bounded feedback", () => {
  for (const input of ["{", "null", "[]", "1", "{}", { hook_event_name: "Stop" },
    { hook_event_name: "UserPromptSubmit" }, { hook_event_name: "UserPromptSubmit", prompt: {} },
    Buffer.from([0xff]), JSON.stringify(payload("x".repeat(65536))), Buffer.alloc(1024 * 1024)]) {
    assert.match(run(input), /recomendação indisponível/);
  }
  assert.match(run(payload(), { profile: "\u001bPRIVATE" }), /recomendação indisponível/);
  const exact = JSON.stringify(payload());
  assert.match(run(exact + " ".repeat(65536 - Buffer.byteLength(exact))), /Recomendado: low/);
});

test("untrusted controls and fields are never echoed or executed", () => {
  const input = { ...payload('oi\u001b[31m $(touch SHOULD_NOT_EXIST) `touch SHOULD_NOT_EXIST`'),
    model: "\u001bPRIVATE", effort: "max", profile: "quality", transcript_path: "PRIVATE" };
  const message = run(input);
  assert.match(message, /Recomendado: low/);
  assert.doesNotMatch(message, /PRIVATE|touch|\u001b|\$\(/);
  assert.doesNotMatch(message.replaceAll("\n", ""), /[\p{Cc}\p{Cf}]/u);
});

test("copied package works without repository, with shell quoted paths and no file effects", async () => {
  const temporary = await mkdtemp(join(tmpdir(), "effortshift-native-"));
  try {
    const path = join(temporary, 'plugin space \'quote "double $literal');
    await cp(plugin, path, { recursive: true });
    await writeFile(join(temporary, "private-transcript"), "PRIVATE");
    const before = await snapshot(temporary);
    assert.match(run({ ...payload("auth migration"), transcript_path: join(temporary, "private-transcript") }, { path, shell: true }), /Recomendado: high/);
    assert.deepEqual(await snapshot(temporary), before);
  } finally { await rm(temporary, { recursive: true, force: true }); }
});

test("missing classifier reports an internal error without blocking the prompt", async () => {
  const temporary = await mkdtemp(join(tmpdir(), "effortshift-missing-"));
  try {
    await mkdir(join(temporary, "scripts"));
    await cp(join(plugin, "scripts/hook.mjs"), join(temporary, "scripts/hook.mjs"));
    assert.match(run(payload(), { path: temporary }), /erro interno/);
  } finally { await rm(temporary, { recursive: true, force: true }); }
});

test("build integrity is deterministic and stale classifier fails the check", async () => {
  const source = await readFile(join(root, "src/decision.mjs"));
  assert.deepEqual(await readFile(join(plugin, "lib/decision.mjs")), source);
  const integrity = JSON.parse(await readFile(join(plugin, "lib/integrity.json"), "utf8"));
  assert.equal(integrity.sha256, createHash("sha256").update(source).digest("hex"));
  const temporary = await mkdtemp(join(tmpdir(), "effortshift-build-"));
  try {
    await mkdir(join(temporary, "tools"));
    await mkdir(join(temporary, "src"));
    await cp(join(root, "tools/build-codex-plugin.mjs"), join(temporary, "tools/build-codex-plugin.mjs"));
    await writeFile(join(temporary, "src/decision.mjs"), source);
    const build = (...args) => spawnSync(process.execPath, [join(temporary, "tools/build-codex-plugin.mjs"), ...args], { encoding: "utf8" });
    assert.equal(build().status, 0);
    const before = await snapshot(temporary);
    assert.equal(build().status, 0);
    assert.deepEqual(await snapshot(temporary), before);
    assert.equal(build("--check").status, 0);
    await writeFile(join(temporary, "plugins/codex/lib/decision.mjs"), "stale");
    assert.notEqual(build("--check").status, 0);
  } finally { await rm(temporary, { recursive: true, force: true }); }
});

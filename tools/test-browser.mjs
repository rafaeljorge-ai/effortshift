// Browser smoke against a deterministic RPC fixture. No inference or credentials.
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { createServer } from "../src/server.mjs";
import { Session } from "../src/session.mjs";
import { CodexRpc } from "../src/codex-rpc.mjs";

const execute = promisify(execFile);
const fixture = fileURLToPath(new URL("../test/fixtures/app-server.mjs", import.meta.url));
const token = randomBytes(32).toString("hex");
const browserSession = `effortshift-ci-${randomBytes(8).toString("hex")}`;
const temporary = await mkdtemp(join(tmpdir(), "effortshift-browser-"));
const config = join(temporary, "agent-browser.json");
await writeFile(config, "{}\n");
// Avoid ambient provider/profile/restore settings and API credentials.
const browserEnv = Object.fromEntries(
  ["PATH", "HOME", "TMPDIR", "TEMP", "TMP", "SystemRoot", "LOCALAPPDATA", "XDG_CACHE_HOME", "CI"]
    .filter((key) => process.env[key] !== undefined)
    .map((key) => [key, process.env[key]]),
);
const submissions = [];
let rpc;
const session = new Session({
  rpcFactory: () => {
    rpc = new CodexRpc({ command: process.execPath, args: [fixture] });
    rpc.on("notification", (message) => {
      if (message.method === "fixture/turnSubmitted") submissions.push(message.params);
    });
    return rpc;
  },
});
const { server } = createServer({ session, token });
let stage = "inicialização";
let browserStarted = false;

async function browser(...args) {
  // Never forward child stdout/stderr: navigation output may include the bearer.
  const { stdout } = await execute("agent-browser", [
    "--config", config, "--session", browserSession, "--json",
    "--allowed-domains", "127.0.0.1", ...args,
  ], { env: browserEnv, cwd: temporary, timeout: 30000, maxBuffer: 1024 * 1024 });
  const result = JSON.parse(stdout);
  if (!result.success) throw new Error("agent-browser reported failure");
  return result.data;
}
const wait = (expression) => browser("wait", "--fn", expression);
async function checkViewport(width, height) {
  await browser("set", "viewport", String(width), String(height));
  const { result } = await browser("eval", `({
    width: window.innerWidth,
    overflow: document.documentElement.scrollWidth > window.innerWidth,
    hashCleared: location.hash === '',
    uiError: !document.querySelector('#error').hidden,
    assistant: document.querySelector('.message.assistant .message-text')?.textContent,
    accepted: document.querySelector('#decision-status').textContent
  })`);
  assert.deepEqual(result, {
    width, overflow: false, hashCleared: true, uiError: false,
    assistant: "Olá mundo", accepted: "ACEITO PELO SERVIDOR",
  });
  const errors = await browser("errors");
  assert.deepEqual(errors.errors, []);
}

try {
  const { stdout: version } = await execute("agent-browser", ["--version"], { env: browserEnv, cwd: temporary, timeout: 10000 });
  assert.match(version, /\b0\.38\.1\b/);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  stage = "conexão simulada";
  browserStarted = true;
  await browser("open", `http://127.0.0.1:${server.address().port}/#token=${token}`);
  await wait("!document.querySelector('#connect').disabled");
  await browser("click", "#connect");
  await wait("document.querySelector('#connection').textContent === 'Codex conectado'");
  assert.equal(session.snapshot().settings.model, "fixture-model");

  stage = "esforço manual e resposta simulada";
  await browser("select", "#mode", "manual");
  await wait("!document.querySelector('#manualEffort').hidden && !document.querySelector('#manualEffort').disabled");
  await browser("select", "#manualEffort", "high");
  await wait("!document.querySelector('#manualEffort').disabled && document.querySelector('#manualEffort').value === 'high'");
  await browser("fill", "#prompt", "Olá");
  await browser("click", "#send");
  await wait("document.querySelector('.message.assistant .message-text')?.textContent === 'Olá mundo' && document.querySelector('#decision-status').textContent === 'ACEITO PELO SERVIDOR'");
  assert.equal(session.snapshot().decision.status, "confirmed");
  assert.equal(submissions[0].effort, "high");
  assert.equal(submissions[0].input[0].text, "Olá");

  stage = "desktop e mobile";
  await checkViewport(1280, 900);
  await checkViewport(390, 844);

  stage = "interrupção do segundo turno";
  await browser("fill", "#prompt", "hold");
  await browser("click", "#send");
  await wait("!document.querySelector('#interrupt').hidden && !document.querySelector('#interrupt').disabled");
  assert.equal(session.snapshot().status, "running");
  await browser("click", "#interrupt");
  await wait("document.querySelector('#connection').textContent === 'Codex conectado' && document.querySelector('#interrupt').hidden");
  const state = session.snapshot();
  assert.equal(state.status, "ready");
  assert.ok(state.events.some((event) => event.message === "Turno interrupted."));
  assert.equal(submissions.length, 2);
  assert.equal(submissions[1].input[0].text, "hold");
  assert.equal(session.completedTurnIds.size, 2);
  await checkViewport(390, 844);
  console.log("Browser smoke PASS: RPC simulada; manual high, resposta, interrupção, desktop 1280 e mobile 390; sem overflow/hash/erros. Não comprova inferência real.");
} catch {
  // Suppress potentially sensitive execFile errors, including command arguments.
  console.error(`Browser smoke FAIL: ${stage}. Saídas do navegador omitidas para preservar o token local.`);
  process.exitCode = 1;
} finally {
  if (browserStarted) {
    try { await browser("close"); }
    catch {
      console.error("Browser smoke: falha ao encerrar a sessão isolada do navegador.");
      process.exitCode = 1;
    }
  }
  const child = rpc?.child;
  const stopped = child && child.exitCode === null
    ? new Promise((resolve) => child.once("exit", resolve)) : Promise.resolve();
  session.close();
  await new Promise((resolve) => {
    server.close(resolve);
    server.closeAllConnections();
  });
  await stopped;
  await rm(temporary, { recursive: true, force: true });
}

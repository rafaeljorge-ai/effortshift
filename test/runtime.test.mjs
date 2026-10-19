import { test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { CodexRpc } from "../src/codex-rpc.mjs";
import { Session } from "../src/session.mjs";
import { sanitize } from "../src/terminal.mjs";
const factory = () =>
  new CodexRpc({
    command: process.execPath,
    args: [
      fileURLToPath(new URL("./fixtures/app-server.mjs", import.meta.url)),
    ],
    timeout: 1000,
  });
async function connected(t) {
  const s = new Session({ rpcFactory: factory });
  t.after(() => s.close());
  await s.connect();
  return s;
}
function completed(s) {
  return new Promise((resolve) => {
    const listener = (state) => {
      if (state.status === "ready") {
        s.off("change", listener);
        resolve(state);
      }
    };
    s.on("change", listener);
  });
}
test("subprocesso: catálogo, esforço real, streaming, final sem duplicação e uso", async (t) => {
  const s = await connected(t);
  assert.equal(s.state.settings.model, "fixture-model");
  assert.equal(s.state.limits.primary.usedPercent, 12);
  const done = completed(s);
  const submitted = once(s.rpc, "notification");
  const state = await s.prompt("olá");
  const wire = (await submitted)[0];
  assert.equal(wire.params.effort, "low");
  assert.equal(wire.params.model, "fixture-model");
  assert.equal(wire.params.input[0].text, "olá");
  assert.equal(state.decision.status, "confirmed");
  assert.equal(state.decision.effort, "low");
  await done;
  assert.deepEqual(
    s.state.messages.filter((m) => m.role === "assistant").map((m) => m.text),
    ["Olá mundo"],
  );
  assert.equal(s.state.usage.contextPercent, 15);
});
test("single flight reservado antes de await; settings não alteram turno atual; cancelamento", async (t) => {
  const s = await connected(t);
  const first = s.prompt("hold");
  await assert.rejects(s.prompt("second"), { status: 409 });
  s.settings({ profile: "quality" });
  await first;
  assert.equal(s.state.decision.effort, "medium");
  await s.interrupt();
  assert.equal(s.state.status, "ready");
});
test("timeout e shutdown rejeitam pendências", async () => {
  const rpc = factory();
  rpc.timeout = 40;
  await assert.rejects(rpc.request("hang"), /Tempo esgotado/);
  assert.equal(rpc.pending.size, 0);
  assert.equal(rpc.closed, true);
  const other = factory();
  const p = other.request("hang");
  other.close();
  await assert.rejects(p, /encerrada/);
});
test("desconexão tira UI de running", async (t) => {
  const s = await connected(t);
  await s.prompt("hold");
  await assert.rejects(s.rpc.request("disconnect"));
  assert.equal(s.state.status, "error");
  assert.equal(s.state.connected, false);
});
test("aprovação explícita e método desconhecido falha fechado", async (t) => {
  const s = await connected(t);
  const changed = new Promise((resolve) => {
    s.on("change", (state) => {
      if (state.approvals.length) resolve();
    });
  });
  await s.rpc.request("fixture/approval", {
    method: "item/commandExecution/requestApproval",
  });
  await changed;
  assert.equal(s.state.approvals.length, 1);
  const answer = once(s.rpc, "notification");
  s.approve("approval", "decline");
  assert.equal((await answer)[0].params.decision, "decline");
  const denied = once(s.rpc, "notification");
  await s.rpc.request("fixture/approval", { method: "unknown/dangerous" });
  assert.equal((await denied)[0].params.code, -32601);
  assert.equal(s.state.approvals.length, 0);
});
test("terminal neutraliza controles ANSI e OSC", () => {
  const output = sanitize("\x1b[2Joi\x1b]52;c;secret\x07");
  assert.ok(!output.includes("\x1b"));
  assert.ok(!output.includes("\x07"));
});

test("completed antes do ack não ressuscita turno e recuperação não recebe callbacks antigos", async (t) => {
  const s = await connected(t);
  await s.prompt("early");
  assert.equal(s.state.status, "ready");
  assert.equal(s.turnId, null);
  const old = s.rpc;
  s.state.status = "error";
  await s.connect();
  old.emit("disconnect", new Error("old connection"));
  assert.equal(s.state.status, "ready");
  s.state.connected = true;
  s.state.status = "error";
  await s.connect();
  assert.equal(s.state.status, "ready");
});
test("fechar durante conexão rejeita e nunca fica pronto", async () => {
  const s = new Session({ rpcFactory: factory });
  const p = s.connect();
  s.close();
  await assert.rejects(p);
  assert.equal(s.state.connected, false);
  assert.notEqual(s.state.status, "ready");
  await assert.rejects(s.connect(), /encerrada/);
});

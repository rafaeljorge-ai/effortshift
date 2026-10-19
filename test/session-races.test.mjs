import { test } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { Session } from "../src/session.mjs";

// Deferred RPC responses let each ordering run without timing assumptions.
class ControlledRpc extends EventEmitter {
  constructor() {
    super();
    this.calls = [];
    this.turns = [];
  }
  async request(method, params) {
    this.calls.push({ method, params });
    if (method === "model/list")
      return {
        data: [
          {
            model: "model",
            isDefault: true,
            supportedReasoningEfforts: ["low", "medium", "high"].map(
              (reasoningEffort) => ({ reasoningEffort }),
            ),
          },
        ],
      };
    if (method === "thread/start") return { thread: { id: "thread" } };
    if (method === "turn/start")
      return new Promise((resolve, reject) =>
        this.turns.push({ resolve, reject }),
      );
    return {};
  }
  notify() {}
  close() {
    this.closed = true;
  }
  started(id) {
    this.emit("notification", {
      method: "turn/started",
      params: { threadId: "thread", turn: { id } },
    });
  }
  completed(id) {
    this.emit("notification", {
      method: "turn/completed",
      params: { threadId: "thread", turn: { id, status: "completed" } },
    });
  }
}
test("tarefa crítica sem esforços nunca envia turn/start", async (t) => {
  const rpc = new ControlledRpc();
  const s = new Session({ rpcFactory: () => rpc });
  t.after(() => s.close());
  await s.connect();
  s.state.models[0].supportedEfforts = [];
  await assert.rejects(s.prompt("Corrija RLS de tenant"), /piso high/);
  assert.equal(rpc.calls.filter((c) => c.method === "turn/start").length, 0);
  assert.equal(s.state.status, "ready");
  const normal = s.prompt("Olá");
  assert.equal(rpc.calls.at(-1).method, "turn/start");
  assert.ok(!("effort" in rpc.calls.at(-1).params));
  rpc.turns[0].resolve({ turn: { id: "normal" } });
  await normal;
});
test("ack antigo após completed e início novo preserva decisão e interrupt do turno atual", async (t) => {
  const rpc = new ControlledRpc();
  const s = new Session({ rpcFactory: () => rpc });
  t.after(() => s.close());
  await s.connect();
  const first = s.prompt("Primeira tarefa");
  rpc.started("first");
  rpc.completed("first");
  s.settings({ profile: "quality" });
  const second = s.prompt("Segunda tarefa");
  const decision = s.state.decision;
  rpc.started("second");
  rpc.completed("first");
  assert.equal(s.state.status, "running");
  rpc.turns[0].resolve({ turn: { id: "first" } });
  await first;
  assert.equal(s.turnId, "second");
  assert.equal(s.state.decision, decision);
  assert.equal(decision.status, "submitted");
  await s.interrupt();
  assert.equal(rpc.calls.at(-1).params.turnId, "second");
  rpc.turns[1].resolve({ turn: { id: "second" } });
  await second;
  assert.equal(decision.status, "confirmed");
});
test("resposta e erro antigos após reconexão não alteram decisão, turno ou erro novos", async (t) => {
  for (const reject of [false, true]) {
    const old = new ControlledRpc();
    const current = new ControlledRpc();
    const pool = [old, current];
    const s = new Session({ rpcFactory: () => pool.shift() });
    t.after(() => s.close());
    await s.connect();
    const first = s.prompt("Primeira tarefa");
    old.started("old");
    old.completed("old");
    s.state.status = "error";
    await s.connect();
    const second = s.prompt("Segunda tarefa");
    current.started("new");
    const decision = s.state.decision;
    if (reject) {
      old.turns[0].reject(new Error("Erro antigo"));
      await assert.rejects(first, /Erro antigo/);
    } else {
      old.turns[0].resolve({ turn: { id: "old" } });
      await first;
    }
    assert.equal(s.turnId, "new");
    assert.equal(s.state.status, "running");
    assert.equal(s.state.error, null);
    assert.equal(s.state.decision, decision);
    assert.equal(decision.status, "submitted");
    current.turns[0].resolve({ turn: { id: "new" } });
    await second;
  }
});

test("encerramento normal não registra erro de desconexão", async () => {
  const rpc = new ControlledRpc();
  const session = new Session({ rpcFactory: () => rpc });
  await session.connect();
  rpc.close = () => rpc.emit("disconnect", new Error("Sessão encerrada."));
  const errors = [];
  session.on("change", (state) => {
    if (state.error) errors.push(state.error);
  });
  session.close();
  assert.deepEqual(errors, []);
  assert.equal(session.state.status, "idle");
  assert.equal(session.state.connected, false);
});

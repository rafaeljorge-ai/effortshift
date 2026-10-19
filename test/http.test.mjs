import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createServer } from "../src/server.mjs";
import { CodexRpc } from "../src/codex-rpc.mjs";
import { fileURLToPath } from "node:url";
import { Session } from "../src/session.mjs";
async function fixture(t) {
  const runtime = createServer();
  await new Promise((resolve) =>
    runtime.server.listen(0, "127.0.0.1", resolve),
  );
  t.after(() => new Promise((resolve) => runtime.server.close(resolve)));
  const port = runtime.server.address().port;
  return {
    ...runtime,
    port,
    url: `http://127.0.0.1:${port}`,
    headers: {
      Authorization: `Bearer ${runtime.token}`,
      "Content-Type": "application/json",
    },
  };
}
test("HTTP token, origin, Host, health e limite de corpo", async (t) => {
  const r = await fixture(t);
  assert.equal((await fetch(r.url + "/api/health")).status, 200);
  assert.equal((await fetch(r.url + "/api/state")).status, 401);
  assert.equal(
    (await fetch(r.url + "/api/state", { headers: r.headers })).status,
    200,
  );
  assert.equal(
    (
      await fetch(r.url + "/api/state", {
        headers: { ...r.headers, Origin: "https://external.invalid" },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await fetch(r.url + "/api/settings", {
        method: "POST",
        headers: r.headers,
        body: JSON.stringify({ profile: "invalid" }),
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await fetch(r.url + "/api/settings", {
        method: "POST",
        headers: r.headers,
        body: "[",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await fetch(r.url + "/api/settings", {
        method: "POST",
        headers: r.headers,
        body: JSON.stringify({ x: "a".repeat(70000) }),
      })
    ).status,
    413,
  );
  const badHost = await new Promise((resolve, reject) => {
    const req = http.get(
      {
        host: "127.0.0.1",
        port: r.port,
        path: "/api/health",
        headers: { Host: "evil.invalid" },
      },
      (res) => {
        res.resume();
        resolve(res.statusCode);
      },
    );
    req.on("error", reject);
  });
  assert.equal(badHost, 403);
});
test("contrato inicial null e validação settings", () => {
  const s = new Session();
  const state = s.snapshot();
  assert.equal(state.usage.input, null);
  assert.equal(state.limits, null);
  assert.equal(state.capabilities.nativeCodexPanel, false);
  assert.throws(() => s.settings({ shell: "anything" }));
  assert.throws(() => s.settings({ model: "not-in-catalog" }));
  s.state.connected = true;
  assert.throws(() => s.settings({ model: null }));
});

test("HTTP integração conecta, aceita um turno e devolve conflito ao segundo", async (t) => {
  const session = new Session({
    rpcFactory: () =>
      new CodexRpc({
        command: process.execPath,
        args: [
          fileURLToPath(new URL("./fixtures/app-server.mjs", import.meta.url)),
        ],
      }),
  });
  const r = createServer({ session });
  await new Promise((resolve) => r.server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => r.server.close(resolve)));
  const url = `http://127.0.0.1:${r.server.address().port}`;
  const headers = {
    Authorization: `Bearer ${r.token}`,
    "Content-Type": "application/json",
  };
  const post = (path, body) =>
    fetch(url + path, { method: "POST", headers, body: JSON.stringify(body) });
  assert.equal((await post("/api/connect", {})).status, 200);
  assert.equal((await post("/api/prompt", { prompt: "hold" })).status, 200);
  assert.equal((await post("/api/prompt", { prompt: "second" })).status, 409);
  assert.equal((await post("/api/interrupt", {})).status, 200);
  const state = await (await fetch(url + "/api/state", { headers })).json();
  assert.equal(state.status, "ready");
});

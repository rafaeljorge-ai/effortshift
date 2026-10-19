import http from "node:http";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Session } from "./session.mjs";
const webRoot = new URL("../web/", import.meta.url);
export function createServer({
  session = new Session(),
  token = randomBytes(32).toString("hex"),
} = {}) {
  const server = http.createServer(async (req, res) => {
    const json = (status, value) => {
      res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(JSON.stringify(value));
    };
    try {
      const port = server.address()?.port;
      const hosts = [`127.0.0.1:${port}`, `localhost:${port}`];
      if (!hosts.includes(req.headers.host))
        return json(403, { error: "Host inválido." });
      const origins = hosts.map((h) => `http://${h}`);
      if (req.headers.origin && !origins.includes(req.headers.origin))
        return json(403, { error: "Origin não permitido." });
      const url = new URL(req.url, "http://127.0.0.1");
      if (url.pathname === "/api/health" && req.method === "GET")
        return json(200, { ok: true });
      if (url.pathname.startsWith("/api/")) {
        const supplied = Buffer.from(req.headers.authorization ?? "");
        const expected = Buffer.from(`Bearer ${token}`);
        if (
          supplied.length !== expected.length ||
          !timingSafeEqual(supplied, expected)
        )
          return json(401, { error: "Token obrigatório." });
        if (req.method === "GET" && url.pathname === "/api/state")
          return json(200, session.snapshot());
        if (req.method !== "POST")
          return json(400, { error: "Rota ou método inválido." });
        if (
          !/^application\/json(?:;|$)/i.test(req.headers["content-type"] ?? "")
        )
          return json(400, { error: "Use application/json." });
        let size = 0;
        const chunks = [];
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 65536) return json(413, { error: "Corpo excessivo." });
          chunks.push(chunk);
        }
        let body;
        try {
          body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        } catch {
          return json(400, { error: "JSON inválido." });
        }
        if (!body || typeof body !== "object" || Array.isArray(body))
          return json(400, { error: "Corpo inválido." });
        let state;
        switch (url.pathname) {
          case "/api/connect":
            state = await session.connect();
            break;
          case "/api/settings":
            state = session.settings(body);
            break;
          case "/api/prompt":
            state = await session.prompt(body.prompt);
            break;
          case "/api/interrupt":
            state = await session.interrupt();
            break;
          case "/api/approval":
            state = session.approve(body.id, body.decision);
            break;
          default:
            return json(400, { error: "Rota inválida." });
        }
        return json(200, state);
      }
      if (req.method !== "GET") return json(400, { error: "Método inválido." });
      const assets = {
        "/": ["index.html", "text/html"],
        "/app.js": ["app.js", "text/javascript"],
        "/styles.css": ["styles.css", "text/css"],
      };
      const asset = assets[url.pathname];
      if (!asset) return json(400, { error: "Recurso desconhecido." });
      const data = await readFile(fileURLToPath(new URL(asset[0], webRoot)));
      res.writeHead(200, {
        "Content-Type": `${asset[1]}; charset=utf-8`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy":
          "default-src 'self'; connect-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'",
        "Referrer-Policy": "no-referrer",
      });
      res.end(data);
    } catch (e) {
      json(e.status ?? 500, { error: e.message ?? "Erro interno." });
    }
  });
  server.on("close", () => session.close());
  return { server, session, token };
}
export async function serve({
  port = 4783,
  cwd = process.cwd(),
  workspaceWrite = false,
} = {}) {
  const runtime = createServer({
    session: new Session({ cwd, workspaceWrite }),
  });
  await new Promise((resolve, reject) => {
    runtime.server.once("error", reject);
    runtime.server.listen(port, "127.0.0.1", resolve);
  });
  return {
    ...runtime,
    url: `http://127.0.0.1:${runtime.server.address().port}/#token=${runtime.token}`,
  };
}

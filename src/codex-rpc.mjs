import { spawn } from "node:child_process";
import { EventEmitter } from "node:events";
export class CodexRpc extends EventEmitter {
  constructor({
    command = "codex",
    args = ["app-server", "--listen", "stdio://"],
    cwd = process.cwd(),
    timeout = 30000,
  } = {}) {
    super();
    Object.assign(this, { command, args, cwd, timeout });
    this.pending = new Map();
    this.sequence = 0;
    this.closed = false;
  }
  start() {
    if (this.child) return;
    this.child = spawn(this.command, this.args, {
      cwd: this.cwd,
      stdio: ["pipe", "pipe", "pipe"],
      shell: false,
    });
    let buffer = "";
    this.child.stdout.setEncoding("utf8");
    this.child.stdout.on("data", (chunk) => {
      buffer += chunk;
      if (buffer.length > 8 * 1024 * 1024) {
        this.close(new Error("Resposta RPC excessiva."));
        return;
      }
      let i;
      while ((i = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, i);
        buffer = buffer.slice(i + 1);
        if (!line.trim()) continue;
        try {
          this.receive(JSON.parse(line));
        } catch {
          this.close(new Error("Protocolo RPC inválido."));
          return;
        }
      }
    });
    this.child.stderr.on("data", () => {});
    this.child.on("error", (e) =>
      this.close(
        new Error(`Não foi possível iniciar Codex: ${e.code ?? "erro"}`),
      ),
    );
    this.child.on("exit", () =>
      this.close(new Error("Codex App Server desconectado.")),
    );
    this.child.stdin.on("error", () =>
      this.close(new Error("Canal RPC fechado.")),
    );
  }
  send(message) {
    if (this.closed || !this.child) throw new Error("RPC desconectado.");
    this.child.stdin.write(JSON.stringify(message) + "\n");
  }
  request(method, params = {}) {
    if (this.closed) return Promise.reject(new Error("RPC desconectado."));
    this.start();
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Tempo esgotado: ${method}`));
        this.close(new Error("RPC excedeu o prazo; conexão encerrada."));
      }, this.timeout);
      this.pending.set(id, { resolve, reject, timer });
      try {
        this.send({ id, method, params });
      } catch (e) {
        clearTimeout(timer);
        this.pending.delete(id);
        reject(e);
      }
    });
  }
  notify(method, params = {}) {
    this.send({ method, params });
  }
  respond(id, result) {
    this.send({ id, result });
  }
  receive(message) {
    if (message.method) {
      if (message.id !== undefined) {
        if (this.listenerCount("request")) this.emit("request", message);
        else
          this.send({
            id: message.id,
            error: { code: -32601, message: "Método não suportado" },
          });
      } else this.emit("notification", message);
      return;
    }
    const pending = this.pending.get(message.id);
    if (!pending) return;
    clearTimeout(pending.timer);
    this.pending.delete(message.id);
    if (message.error)
      pending.reject(new Error(message.error.message ?? "Erro RPC"));
    else pending.resolve(message.result);
  }
  close(error = new Error("Sessão encerrada.")) {
    if (this.closed) return;
    this.closed = true;
    for (const p of this.pending.values()) {
      clearTimeout(p.timer);
      p.reject(error);
    }
    this.pending.clear();
    this.child?.kill("SIGTERM");
    const child = this.child;
    const timer = setTimeout(() => {
      if (child?.exitCode === null) child.kill("SIGKILL");
    }, 1500);
    timer.unref();
    this.emit("disconnect", error);
  }
}

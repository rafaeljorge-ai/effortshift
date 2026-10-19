import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";
import { CodexRpc } from "./codex-rpc.mjs";
import { decideEffort, EFFORTS } from "./decision.mjs";
export class SessionError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
export class Session extends EventEmitter {
  constructor({
    cwd = process.cwd(),
    workspaceWrite = false,
    rpcFactory = () => new CodexRpc({ cwd }),
  } = {}) {
    super();
    Object.assign(this, { rpcFactory, workspaceWrite });
    this.pendingApprovals = new Map();
    this.turnId = null;
    this.activeTurn = null;
    this.completedTurnIds = new Set();
    this.closed = false;
    this.state = {
      provider: "codex",
      status: "idle",
      connected: false,
      sessionId: null,
      cwd,
      error: null,
      settings: {
        mode: "auto",
        profile: "balanced",
        manualEffort: "medium",
        model: null,
      },
      models: [],
      decision: null,
      usage: {
        input: null,
        cachedInput: null,
        output: null,
        total: null,
        contextPercent: null,
      },
      limits: null,
      messages: [],
      events: [],
      approvals: [],
      capabilities: { nativeCodexPanel: false, claudePlugin: true },
    };
  }
  snapshot() {
    return structuredClone(this.state);
  }
  change() {
    this.emit("change", this.snapshot());
  }
  event(type, message) {
    this.state.events.push({
      id: randomUUID(),
      at: new Date().toISOString(),
      type,
      message,
    });
    this.state.events = this.state.events.slice(-100);
    this.change();
  }
  async connect() {
    if (this.closed) throw new SessionError("Sessão encerrada.", 409);
    if (["connecting", "running"].includes(this.state.status))
      throw new SessionError("Sessão ocupada.", 409);
    if (this.state.connected && this.state.status === "ready")
      return this.snapshot();
    if (this.rpc) {
      this.rpc.removeAllListeners();
      this.rpc.close();
    }
    this.activeTurn = null;
    this.turnId = null;
    this.completedTurnIds.clear();
    this.clearApprovals();
    this.state.connected = false;
    this.state.sessionId = null;
    this.state.status = "connecting";
    this.state.error = null;
    this.change();
    const rpc = (this.rpc = this.rpcFactory());
    rpc.on("notification", (m) => {
      if (this.rpc === rpc) this.notification(m);
    });
    rpc.on("request", (m) => {
      if (this.rpc === rpc) this.approvalRequest(m);
    });
    rpc.on("disconnect", (e) => {
      if (this.rpc !== rpc || this.closed) return;
      this.activeTurn = null;
      this.turnId = null;
      this.state.connected = false;
      this.state.status = "error";
      this.state.error = e.message;
      this.clearApprovals();
      this.change();
    });
    try {
      await rpc.request("initialize", {
        clientInfo: {
          name: "effortshift",
          title: "EffortShift",
          version: "0.2.0-alpha.1",
        },
      });
      rpc.notify("initialized");
      let cursor = null;
      const models = [];
      do {
        const page = await rpc.request("model/list", {
          ...(cursor ? { cursor } : {}),
        });
        models.push(...page.data.filter((m) => !m.hidden));
        cursor = page.nextCursor;
      } while (cursor);
      this.state.models = models.map((m) => ({
        id: m.model ?? m.id,
        label: m.displayName ?? m.id,
        supportedEfforts: (m.supportedReasoningEfforts ?? [])
          .map((e) => e.reasoningEffort)
          .filter((e) => EFFORTS.includes(e)),
      }));
      if (!this.state.models.length)
        throw new Error("Catálogo não contém modelos disponíveis.");
      this.state.settings.model =
        this.state.models.find(
          (m) => m.id === models.find((x) => x.isDefault)?.model,
        )?.id ?? this.state.models[0].id;
      await rpc.request("account/read", { refreshToken: false });
      try {
        const r = await rpc.request("account/rateLimits/read");
        this.state.limits = r.rateLimits ?? null;
      } catch (e) {
        if (rpc.closed) throw e;
        this.event("limits", "Limites indisponíveis.");
      }
      const thread = await rpc.request("thread/start", {
        cwd: this.state.cwd,
        model: this.state.settings.model,
        sandbox: this.workspaceWrite ? "workspace-write" : "read-only",
        approvalPolicy: "on-request",
      });
      if (this.closed) throw new SessionError("Sessão encerrada.", 409);
      this.state.sessionId = thread.thread.id;
      this.state.connected = true;
      this.state.status = "ready";
      this.event(
        "connected",
        "Codex conectado; esforço será enviado por turn/start.",
      );
      return this.snapshot();
    } catch (e) {
      rpc.close();
      if (this.closed || this.rpc !== rpc) throw e;
      this.state.status = "error";
      this.state.error = e.message;
      this.change();
      throw e;
    }
  }
  settings(update) {
    if (!update || typeof update !== "object" || Array.isArray(update))
      throw new SessionError("Configuração inválida.");
    if (
      Object.keys(update).some(
        (k) => !["mode", "profile", "manualEffort", "model"].includes(k),
      )
    )
      throw new SessionError("Campo de configuração desconhecido.");
    const next = { ...this.state.settings, ...update };
    if (this.state.connected && next.model === null)
      throw new SessionError("Modelo conectado não pode ser nulo.");
    if (
      !["auto", "manual"].includes(next.mode) ||
      !["economy", "balanced", "quality"].includes(next.profile) ||
      !EFFORTS.includes(next.manualEffort) ||
      (next.model !== null &&
        !this.state.models.some((m) => m.id === next.model))
    )
      throw new SessionError("Configuração inválida.");
    const model = this.state.models.find((m) => m.id === next.model);
    if (
      next.mode === "manual" &&
      model?.supportedEfforts.length &&
      !model.supportedEfforts.includes(next.manualEffort)
    )
      throw new SessionError("Esforço incompatível com modelo.");
    this.state.settings = next;
    this.change();
    return this.snapshot();
  }
  async prompt(prompt) {
    if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 32000)
      throw new SessionError("Prompt vazio ou excessivo.");
    if (this.state.status === "running")
      throw new SessionError("Já existe um turno em andamento.", 409);
    if (!this.state.connected || this.state.status !== "ready")
      throw new SessionError("Conecte o Codex antes de enviar.", 409);
    const settings = { ...this.state.settings };
    const model = this.state.models.find((m) => m.id === settings.model);
    let decision;
    try {
      decision = decideEffort({
        prompt,
        ...settings,
        supportedEfforts: model.supportedEfforts,
        previousEffort: this.state.decision?.effort,
      });
    } catch (e) {
      throw new SessionError(e.message);
    }
    this.state.status = "running";
    this.turnId = null;
    this.state.error = null;
    const rpc = this.rpc;
    const operation = {
      rpc,
      decision: { ...decision, status: "submitted" },
      turnId: null,
      completed: false,
    };
    this.activeTurn = operation;
    this.state.decision = operation.decision;
    this.state.messages.push({ id: randomUUID(), role: "user", text: prompt });
    this.state.messages = this.state.messages.slice(-100);
    this.change();
    try {
      const result = await rpc.request("turn/start", {
        threadId: this.state.sessionId,
        input: [{ type: "text", text: prompt, text_elements: [] }],
        model: settings.model,
        ...(decision.effort ? { effort: decision.effort } : {}),
      });
      // A completed turn can be followed by another submission before its ack.
      // Only this operation on this connection may update its decision/turn ID.
      if (this.closed || this.rpc !== rpc || this.activeTurn !== operation)
        return this.snapshot();
      if (!operation.completed && this.state.status === "running") {
        operation.turnId = result.turn.id;
        this.turnId = result.turn.id;
      }
      operation.decision.status = "confirmed";
      this.event(
        "effort",
        "turn/start aceito pelo protocolo; não comprova inferência interna.",
      );
      return this.snapshot();
    } catch (e) {
      if (this.closed || this.rpc !== rpc || this.activeTurn !== operation)
        throw e;
      this.activeTurn = null;
      this.turnId = null;
      this.state.status = "error";
      this.state.error = e.message;
      this.change();
      throw e;
    }
  }
  message(id, text, append = false) {
    let message = this.state.messages.find((m) => m.id === id);
    if (!message) {
      message = { id, role: "assistant", text: "" };
      this.state.messages.push(message);
      this.state.messages = this.state.messages.slice(-100);
    }
    message.text = (append ? message.text + text : text).slice(-262144);
  }
  notification({ method, params: p = {} }) {
    if (
      p.threadId &&
      this.state.sessionId &&
      p.threadId !== this.state.sessionId
    )
      return;
    const eventTurnId = p.turnId ?? p.turn?.id;
    const controlsTurn = ["turn/started", "turn/completed", "error"].includes(
      method,
    );
    if (controlsTurn && eventTurnId && this.completedTurnIds.has(eventTurnId))
      return;
    if (
      controlsTurn &&
      eventTurnId &&
      this.activeTurn?.turnId &&
      eventTurnId !== this.activeTurn.turnId
    )
      return;
    if (method === "item/agentMessage/delta")
      this.message(p.itemId, p.delta ?? "", true);
    else if (method === "item/completed" && p.item?.type === "agentMessage")
      this.message(p.item.id, p.item.text ?? "");
    else if (method === "turn/started") {
      if (!this.activeTurn || this.activeTurn.completed) return;
      this.activeTurn.turnId = p.turn?.id ?? this.turnId;
      this.turnId = this.activeTurn.turnId;
    } else if (method === "turn/completed") {
      if (!this.activeTurn || this.activeTurn.completed) return;
      this.activeTurn.completed = true;
      if (eventTurnId) this.completedTurnIds.add(eventTurnId);
      if (this.completedTurnIds.size > 100)
        this.completedTurnIds.delete(
          this.completedTurnIds.values().next().value,
        );
      this.turnId = null;
      this.clearApprovals();
      this.state.status = p.turn?.status === "failed" ? "error" : "ready";
      this.state.error = p.turn?.error?.message ?? null;
      this.event("completed", `Turno ${p.turn?.status ?? "concluído"}.`);
    } else if (method === "thread/tokenUsage/updated") {
      const t = p.tokenUsage?.total;
      const last = p.tokenUsage?.last;
      const context = p.tokenUsage?.modelContextWindow;
      if (t)
        this.state.usage = {
          input: t.inputTokens ?? null,
          cachedInput: t.cachedInputTokens ?? null,
          output: t.outputTokens ?? null,
          total: t.totalTokens ?? null,
          contextPercent:
            context && last
              ? Math.min(100, (last.totalTokens / context) * 100)
              : null,
        };
    } else if (method === "account/rateLimits/updated")
      this.state.limits = p.rateLimits ?? null;
    else if (method === "error") {
      this.state.error = p.error?.message ?? "Erro Codex";
      if (!p.willRetry) this.state.status = "error";
      this.event("error", this.state.error);
    }
    this.change();
  }
  approvalRequest(m) {
    if (
      ![
        "item/commandExecution/requestApproval",
        "item/fileChange/requestApproval",
      ].includes(m.method)
    ) {
      this.rpc.send({
        id: m.id,
        error: {
          code: -32601,
          message: "Solicitação não suportada; recusada com segurança.",
        },
      });
      this.event("denied", `Solicitação não suportada: ${m.method}`);
      return;
    }
    if (this.pendingApprovals.size >= 20) {
      this.rpc.respond(m.id, { decision: "decline" });
      return;
    }
    const id = String(m.id);
    this.pendingApprovals.set(id, m.id);
    this.state.approvals.push({
      id,
      kind: m.method.includes("commandExecution") ? "command" : "fileChange",
      description: JSON.stringify(m.params).slice(0, 8000),
    });
    this.change();
  }
  approve(id, decision) {
    if (
      !["accept", "decline"].includes(decision) ||
      !this.pendingApprovals.has(id)
    )
      throw new SessionError("Aprovação inválida.");
    this.rpc.respond(this.pendingApprovals.get(id), { decision });
    this.pendingApprovals.delete(id);
    this.state.approvals = this.state.approvals.filter((a) => a.id !== id);
    this.change();
    return this.snapshot();
  }
  clearApprovals() {
    this.pendingApprovals.clear();
    this.state.approvals = [];
  }
  async interrupt() {
    if (this.state.status !== "running" || !this.turnId)
      throw new SessionError("Nenhum turno interrompível.", 409);
    await this.rpc.request("turn/interrupt", {
      threadId: this.state.sessionId,
      turnId: this.turnId,
    });
    return this.snapshot();
  }
  close() {
    this.closed = true;
    this.activeTurn = null;
    this.turnId = null;
    this.rpc?.close();
    this.clearApprovals();
    this.state.connected = false;
    this.state.status = "idle";
    this.state.error = null;
    this.change();
  }
}

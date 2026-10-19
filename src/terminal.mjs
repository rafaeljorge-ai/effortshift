import readline from "node:readline";
import { Session } from "./session.mjs";
export const sanitize = (text) =>
  String(text).replace(/[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/g, "");
export function panel(s) {
  const efforts =
    s.models.find((m) => m.id === s.settings.model)?.supportedEfforts ?? [];
  const meter = efforts
    .map((e) => (e === s.decision?.effort ? `[${e.toUpperCase()}]` : `[${e}]`))
    .join(" ");
  const limit = (w) =>
    w
      ? `${w.usedPercent}% usado; janela ${w.windowDurationMins} min`
      : "indisponível";
  return `\n┌ EffortShift · ${s.status} · ${s.settings.model ?? "modelo indisponível"}\n│ ${s.settings.mode} / ${s.settings.profile} · ${meter || "Esforço indisponível"}\n│ Limites: primário ${limit(s.limits?.primary)} · secundário ${limit(s.limits?.secondary)}\n└ Tokens: entrada ${s.usage.input ?? "—"} · cache ${s.usage.cachedInput ?? "—"} · saída ${s.usage.output ?? "—"}`;
}
export async function terminal(options = {}) {
  const session = new Session(options);
  const input = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "EffortShift > ",
  });
  const print = (text) => process.stdout.write(sanitize(text) + "\n");
  print(
    "╭────────────────────────────────────────────╮\n│ EffortShift · Codex · cliente próprio       │\n╰────────────────────────────────────────────╯",
  );
  print(
    `Diretório: ${session.state.cwd}\nSandbox: ${options.workspaceWrite ? "workspace-write (escolha explícita)" : "read-only"}\n/auto [economy|balanced|quality] · /manual esforço · /model id\n/models · /status · /stop · /approve id · /decline id · /quit`,
  );
  const seen = new Map();
  const help =
    "/help · /mode auto|manual · /profile economy|balanced|quality · /effort low|medium|high|xhigh|max\n/model id · /models · /status · /cancel · /approve id · /decline id · /connect · /quit";
  let lastPanel = "";
  let lastDecision = "";
  let lastApprovals = "";
  let lastError = "";
  session.on("change", (s) => {
    const summary = JSON.stringify([
      s.status,
      s.settings,
      s.decision,
      s.limits,
    ]);
    if (summary !== lastPanel) {
      print(panel(s));
      lastPanel = summary;
    }
    const ids = new Set(s.messages.map((m) => m.id));
    for (const id of seen.keys()) if (!ids.has(id)) seen.delete(id);
    if (s.decision) {
      const key = JSON.stringify(s.decision);
      if (key !== lastDecision) {
        print(
          `Esforço ${s.decision.effort ?? "indisponível"} · ${s.decision.status}: ${s.decision.reason}`,
        );
        lastDecision = key;
      }
    }
    for (const m of s.messages.filter((m) => m.role === "assistant")) {
      const old = seen.get(m.id) ?? "";
      if (m.text !== old) {
        process.stdout.write(
          sanitize(
            m.text.startsWith(old) ? m.text.slice(old.length) : "\n" + m.text,
          ),
        );
        seen.set(m.id, m.text);
      }
    }
    const approvals = JSON.stringify(s.approvals);
    if (approvals !== lastApprovals && s.approvals.length) {
      for (const a of s.approvals)
        print(
          `\nPermissão ${a.id} (${a.kind}): ${a.description}\n/approve ${a.id} ou /decline ${a.id}`,
        );
    }
    lastApprovals = approvals;
    if (s.error && s.error !== lastError) print(`\nErro: ${s.error}`);
    lastError = s.error;
    if (s.status === "ready") input.prompt();
  });
  input.on("line", async (line) => {
    const text = line.trim();
    try {
      if (!text) {
        input.prompt();
        return;
      }
      const [command, ...args] = text.split(/\s+/);
      switch (command) {
        case "/quit":
          input.close();
          return;
        case "/status":
          print(panel(session.snapshot()));
          break;
        case "/help":
          print(help);
          break;
        case "/mode":
          session.settings({ mode: args[0] });
          break;
        case "/profile":
          session.settings({ profile: args[0] });
          break;
        case "/effort":
          session.settings({ manualEffort: args[0] });
          break;
        case "/models":
          for (const m of session.state.models)
            print(`${m.id}: ${m.supportedEfforts.join(", ") || "sem esforço"}`);
          break;
        case "/model":
          session.settings({ model: args[0] });
          break;
        case "/auto":
          session.settings({ mode: "auto", profile: args[0] ?? "balanced" });
          break;
        case "/manual":
          session.settings({ mode: "manual", manualEffort: args[0] });
          break;
        case "/cancel":
        case "/stop":
          await session.interrupt();
          break;
        case "/approve":
          session.approve(args[0], "accept");
          break;
        case "/decline":
          session.approve(args[0], "decline");
          break;
        case "/connect":
          await session.connect();
          break;
        default:
          if (command.startsWith("/")) throw new Error("Comando desconhecido.");
          await session.prompt(text);
      }
    } catch (e) {
      print(`Erro: ${e.message}`);
    }
    if (session.state.status !== "running") input.prompt();
  });
  input.on("close", () => session.close());
  // Return immediately so the CLI installs shutdown handlers during handshake.
  void session.connect().catch((e) => {
    if (session.closed) return;
    print(`Conexão falhou: ${e.message}\nUse /connect para tentar novamente.`);
    input.prompt();
  });
  return { session, input };
}

// Advisory only: never inject instructions or claim to change native effort.
const MAX_BYTES = 64 * 1024;

async function readInput() {
  const bytes = Buffer.alloc(MAX_BYTES);
  let size = 0;
  let oversized = false;
  for await (const chunk of process.stdin) {
    if (oversized || size + chunk.length > MAX_BYTES) {
      // Drain without retaining excess bytes so the host doesn't hit EPIPE.
      oversized = true;
      continue;
    }
    chunk.copy(bytes, size);
    size += chunk.length;
  }
  if (oversized) throw new Error("oversize");
  const input = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(0, size)));
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("object required");
  if (!["SessionStart", "UserPromptSubmit"].includes(input.hook_event_name)) throw new Error("event required");
  if (input.hook_event_name === "UserPromptSubmit" && typeof input.prompt !== "string") throw new Error("prompt required");
  return input;
}

let systemMessage;
try {
  const input = await readInput();
  if (input.hook_event_name === "SessionStart") {
    systemMessage = "EffortShift · recomenda esforço, sem aplicá-lo pelo hook · ajuda: $effortshift.";
  } else {
    const { decideEffort, EFFORTS } = await import("../lib/decision.mjs");
    // This is a policy scale, NOT a claim about the current model's catalog.
    const profile = process.env.EFFORTSHIFT_PROFILE ?? "balanced";
    if (!["balanced", "economy", "quality"].includes(profile)) throw new Error("invalid profile");
    // Controls are never echoed; normalize them before local classification.
    const prompt = input.prompt.replace(/[\p{Cc}\p{Cf}]/gu, " ");
    const decision = decideEffort({ prompt, profile, supportedEfforts: EFFORTS });
    const scale = EFFORTS.map((effort) => effort === decision.effort
      ? `[${effort.toUpperCase()}]` : effort.toUpperCase()).join("  ");
    systemMessage = [
      `╭─ EffortShift · perfil ${profile}`,
      `│ ${scale}`,
      `│ Recomendado: ${decision.effort} · não aplicado pelo hook`,
      "╰─ Consultivo · catálogo nativo desconhecido",
    ].join("\n");
  }
} catch {
  // Don't echo untrusted input, paths, exception messages, or private content.
  systemMessage = "EffortShift · recomendação indisponível: entrada inválida ou erro interno · nenhum esforço foi aplicado pelo hook; Codex pode continuar.";
}
process.stdout.write(`${JSON.stringify({ continue: true, systemMessage })}\n`);

export const EFFORTS = ["low", "medium", "high", "xhigh", "max"];
export function decideEffort({
  prompt = "",
  profile = "balanced",
  mode = "auto",
  manualEffort = "medium",
  supportedEfforts = [],
  previousEffort = null,
}) {
  const supported = EFFORTS.filter((e) => supportedEfforts.includes(e));
  const critical =
    /\b(auth|autentica|autoriza|rls|tenant|isolamento|permiss|seguran|security|finance|pagamento|migration|migraç|credencia)/iu.test(
      prompt,
    );
  if (critical && !supported.some((e) => EFFORTS.indexOf(e) >= 2))
    throw new Error(
      "Modelo não suporta o piso high exigido pelo risco; selecione outro modelo.",
    );
  if (!supported.length)
    return {
      effort: null,
      reason: "Modelo não informa esforços compatíveis.",
      risk: critical ? "high" : "normal",
    };
  if (mode === "manual" && !supported.includes(manualEffort))
    throw new Error("Esforço manual incompatível com o modelo.");
  const complex = /\b(arquitet|diagn[oó]stic|refator|investig|complex|architecture|debug)/iu.test(prompt);
  const implementation = /\b(implement|crie|criar|construa|corrija|corrigir|fix|build|develop)/iu.test(prompt);
  let target =
    mode === "manual"
      ? manualEffort
      : profile === "economy"
        ? "low"
        : profile === "quality"
          ? "high"
          : "medium";
  if (mode === "auto" && complex)
    target = "high";
  if (
    /^(continue|continuar|prossiga|continue de onde)/iu.test(prompt.trim()) &&
    supported.includes(previousEffort) &&
    EFFORTS.indexOf(previousEffort) > EFFORTS.indexOf(target)
  )
    target = previousEffort;
  if (
    mode === "auto" &&
    implementation &&
    EFFORTS.indexOf(target) < 1
  )
    target = "medium";
  if (
    mode === "auto" &&
    profile === "balanced" &&
    !critical &&
    !complex &&
    !implementation &&
    /^(oi|ol[aá]|hello|obrigad[oa]|qual [ée]|o que [ée]|quanto [ée]|what is)(?=\s|$|[?.,!])/iu.test(
      prompt.trim(),
    ) &&
    prompt.length < 180
  )
    target = "low";
  if (critical && EFFORTS.indexOf(target) < 2) target = "high";
  const effort =
    supported.find((e) => EFFORTS.indexOf(e) >= EFFORTS.indexOf(target)) ??
    supported.at(-1);
  return {
    effort,
    reason: critical
      ? "Piso de risco: segurança, dados ou permissões."
      : mode === "manual"
        ? "Seleção manual compatível com o catálogo."
        : `Regras locais, perfil ${profile}; sem chamada avaliadora extra.`,
    risk: critical ? "high" : "normal",
  };
}

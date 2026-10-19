import { test } from "node:test";
import assert from "node:assert/strict";
import { decideEffort } from "../src/decision.mjs";
const supportedEfforts = ["low", "medium", "high", "xhigh"];
test("piso crítico prevalece sobre economia e manual", () => {
  for (const mode of ["auto", "manual"])
    assert.equal(
      decideEffort({
        prompt: "Corrija RLS e permissões de tenant",
        profile: "economy",
        mode,
        manualEffort: "low",
        supportedEfforts,
      }).effort,
      "high",
    );
});
test("sem suporte não inventa esforço", () =>
  assert.equal(
    decideEffort({ prompt: "oi", supportedEfforts: [] }).effort,
    null,
  ));
test("manual inválido falha", () =>
  assert.throws(() =>
    decideEffort({
      prompt: "oi",
      mode: "manual",
      manualEffort: "max",
      supportedEfforts,
    }),
  ));
test("continuidade preserva piso anterior", () =>
  assert.equal(
    decideEffort({
      prompt: "continue",
      previousEffort: "high",
      supportedEfforts,
    }).effort,
    "high",
  ));
test("pergunta simples usa low e implementação mantém medium em economy", () => {
  assert.equal(
    decideEffort({ prompt: "O que é ESM?", supportedEfforts }).effort,
    "low",
  );
  assert.equal(
    decideEffort({
      prompt: "Implemente um parser JSON",
      profile: "economy",
      supportedEfforts,
    }).effort,
    "medium",
  );
});
test("piso crítico indisponível falha e termos portugueses têm piso", () => {
  assert.throws(
    () =>
      decideEffort({
        prompt: "Corrija autenticação",
        supportedEfforts: ["low", "medium"],
      }),
    /piso/,
  );
  for (const term of [
    "autenticação",
    "autorização",
    "credenciais",
    "isolamento",
  ])
    assert.equal(
      decideEffort({
        prompt: `Corrija ${term}`,
        supportedEfforts,
        profile: "economy",
      }).effort,
      "high",
    );
});
test("catálogo sem esforços recusa tarefa crítica, mas permite tarefa normal", () => {
  assert.throws(
    () =>
      decideEffort({ prompt: "Corrija RLS de tenant", supportedEfforts: [] }),
    /piso high/,
  );
  assert.equal(
    decideEffort({ prompt: "Olá", supportedEfforts: [] }).effort,
    null,
  );
});
test("saudação não reduz o esforço exigido pelo pedido técnico", () => {
  for (const [prompt, effort] of [
    ["Olá!", "low"],
    ["Oi, crie um parser JSON", "medium"],
    ["Hello, implement a parser", "medium"],
    ["Olá, investigue o parser", "high"],
    ["What is the architecture of this module?", "high"],
    ["Oi, corrija autenticação", "high"],
  ]) {
    assert.equal(decideEffort({ prompt, supportedEfforts }).effort, effort, prompt);
  }
});

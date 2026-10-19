#!/usr/bin/env node
import { resolve } from "node:path";
import { stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { serve } from "../src/server.mjs";
import { terminal } from "../src/terminal.mjs";
const args = process.argv.slice(2);
const command = args[0]?.startsWith("--") ? "serve" : (args.shift() ?? "serve");
const options = {};
try {
  while (args.length) {
    const key = args.shift();
    if (key === "--workspace-write") {
      options.workspaceWrite = true;
      continue;
    }
    if (!["--port", "--cwd"].includes(key) || !args.length)
      throw new Error(`Opção inválida: ${key}`);
    const value = args.shift();
    if (key === "--cwd") options.cwd = resolve(value);
    else {
      if (!/^\d+$/.test(value) || Number(value) > 65535)
        throw new Error("Porta inválida.");
      options.port = Number(value);
    }
  }
  options.cwd ??= process.cwd();
  if (!(await stat(options.cwd)).isDirectory())
    throw new Error("cwd deve ser um diretório.");
  if (command === "doctor") {
    const result = spawnSync("codex", ["--version"], {
      encoding: "utf8",
      shell: false,
    });
    console.log(
      `Node ${process.version}: ${Number(process.versions.node.split(".")[0]) >= 22 ? "OK" : "REQUER >=22"}\nCodex: ${result.status === 0 ? result.stdout.trim() : "indisponível"}\nCWD: ${options.cwd}\nNenhuma configuração ou credencial foi alterada.`,
    );
    if (result.status !== 0) process.exitCode = 1;
  } else if (command === "codex") {
    const runtime = await terminal(options);
    for (const signal of ["SIGINT", "SIGTERM"])
      process.once(signal, () => {
        runtime.input.close();
      });
  } else if (command === "serve") {
    const runtime = await serve(options);
    console.log(
      `EffortShift local · ${options.workspaceWrite ? "workspace-write" : "read-only"}\n${runtime.url}\nURL autenticada: use somente no navegador local, não compartilhe.`,
    );
    for (const signal of ["SIGINT", "SIGTERM"])
      process.once(signal, () => {
        runtime.session.close();
        runtime.server.close();
        runtime.server.closeAllConnections();
      });
  } else throw new Error("Use serve, codex ou doctor.");
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
}

import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const check = process.argv.slice(2);
if (check.length > 1 || (check.length === 1 && check[0] !== "--check")) {
  throw new Error("Usage: node tools/build-codex-plugin.mjs [--check]");
}
const source = await readFile(new URL("../src/decision.mjs", import.meta.url));
const target = new URL("../plugins/codex/lib/decision.mjs", import.meta.url);
const integrity = new URL("../plugins/codex/lib/integrity.json", import.meta.url);
const manifest = `${JSON.stringify({ source: "src/decision.mjs", sha256: createHash("sha256").update(source).digest("hex") }, null, 2)}\n`;
if (check.length) {
  if (!(await readFile(target)).equals(source) || (await readFile(integrity, "utf8")) !== manifest) {
    throw new Error("Codex plugin classifier is stale; run node tools/build-codex-plugin.mjs");
  }
  console.log("Codex plugin classifier integrity verified.");
} else {
  await mkdir(new URL("../plugins/codex/lib/", import.meta.url), { recursive: true });
  await writeFile(target, source);
  await writeFile(integrity, manifest);
  console.log("Codex plugin classifier built deterministically.");
}

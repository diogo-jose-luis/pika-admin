/**
 * Gera FIREBASE_SERVICE_ACCOUNT_BASE64 para colar na Vercel (uma linha, sem avisos).
 *
 * Uso: node scripts/firebase-env-base64.mjs
 *      node scripts/firebase-env-base64.mjs caminho/para/service-account.json
 */
import { readFileSync } from "node:fs";
import path from "node:path";

const defaultFile = "pika-a83e1-firebase-adminsdk-fbsvc-01bd6a9bad.json";
const file = process.argv[2] ?? path.join(process.cwd(), defaultFile);

let raw;
try {
  raw = readFileSync(file, "utf8");
} catch {
  console.error(`Não foi possível ler: ${file}`);
  process.exit(1);
}

JSON.parse(raw);

const base64 = Buffer.from(raw.trim(), "utf8").toString("base64");

console.log("\n=== Vercel: Environment Variables ===\n");
console.log("Name:  FIREBASE_SERVICE_ACCOUNT_BASE64");
console.log("Value: (copiar a linha abaixo — sem espaços antes/depois)\n");
console.log(base64);
console.log(
  "\nNota: Na Vercel, variáveis sensíveis aparecem vazias ao reabrir. Isso é normal.\n",
);

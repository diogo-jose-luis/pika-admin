import { readFileSync } from "node:fs";
import path from "node:path";
import admin from "firebase-admin";

const SERVICE_ACCOUNT_FILENAME =
  "pika-a83e1-firebase-adminsdk-fbsvc-01bd6a9bad.json";

function normalizeEnvValue(value: string): string {
  return value.replace(/^\uFEFF/, "").trim();
}

function parseServiceAccountJson(raw: string): admin.ServiceAccount {
  const parsed = JSON.parse(normalizeEnvValue(raw)) as Record<string, unknown>;
  const hasProject =
    typeof parsed.project_id === "string" || typeof parsed.projectId === "string";
  const hasKey =
    typeof parsed.private_key === "string" || typeof parsed.privateKey === "string";
  const hasEmail =
    typeof parsed.client_email === "string" || typeof parsed.clientEmail === "string";
  if (!hasProject || !hasKey || !hasEmail) {
    throw new Error("JSON da service account incompleto.");
  }
  return parsed as admin.ServiceAccount;
}

function loadServiceAccountFromEnv(): admin.ServiceAccount | null {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (json) {
    return parseServiceAccountJson(json);
  }

  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (base64) {
    const decoded = Buffer.from(normalizeEnvValue(base64), "base64").toString(
      "utf8",
    );
    return parseServiceAccountJson(decoded);
  }

  return null;
}

function loadServiceAccountFromFile(): admin.ServiceAccount {
  const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    ? process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    : path.join(process.cwd(), SERVICE_ACCOUNT_FILENAME);

  const raw = readFileSync(filePath, "utf8");
  return parseServiceAccountJson(raw);
}

function loadServiceAccount(): admin.ServiceAccount {
  const fromEnv = loadServiceAccountFromEnv();
  if (fromEnv) return fromEnv;

  try {
    return loadServiceAccountFromFile();
  } catch {
    throw new Error(
      "Credenciais Firebase em falta. Na Vercel, use FIREBASE_SERVICE_ACCOUNT_BASE64 (recomendado: node scripts/firebase-env-base64.mjs). Localmente, use o ficheiro JSON na raiz do projeto.",
    );
  }
}

export function getFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  return admin.initializeApp({
    credential: admin.credential.cert(loadServiceAccount()),
  });
}

export function getFirestore() {
  getFirebaseAdmin();
  return admin.firestore();
}

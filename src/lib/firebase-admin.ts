import { readFileSync } from "node:fs";
import path from "node:path";
import admin from "firebase-admin";

const SERVICE_ACCOUNT_FILENAME =
  "pika-a83e1-firebase-adminsdk-fbsvc-01bd6a9bad.json";

function resolveServiceAccountPath(): string {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    return process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  }
  return path.join(process.cwd(), SERVICE_ACCOUNT_FILENAME);
}

function loadServiceAccount() {
  const filePath = resolveServiceAccountPath();
  const raw = readFileSync(filePath, "utf8");
  return JSON.parse(raw) as admin.ServiceAccount;
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

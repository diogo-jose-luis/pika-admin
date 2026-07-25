import { FieldValue } from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firebase-admin";

export type PushNotificationInput = {
  /** UID do utilizador Firebase (id do doc em `users`). */
  userId: string;
  title: string;
  body: string;
  /** Página FlutterFlow a abrir ao tocar na notificação. */
  initialPageName?: string;
};

/**
 * Dispara push via coleção FlutterFlow `ff_user_push_notifications`.
 * A Cloud Function existente lê os tokens em `users/{uid}/fcm_tokens` e envia o FCM.
 * Também regista a notificação in-app em `notificacoes` + `notificacao_visualizar`.
 */
export async function sendUserPushNotification(
  input: PushNotificationInput,
): Promise<boolean> {
  const userId = input.userId?.trim();
  const title = input.title?.trim();
  const body = input.body?.trim();
  if (!userId || !title || !body) return false;

  try {
    const db = getFirestore();
    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      console.warn(
        `[push] utilizador ${userId} não encontrado; push ignorado.`,
      );
      return false;
    }

    const initialPageName = input.initialPageName?.trim() || "HomePage";

    await db.collection("ff_user_push_notifications").add({
      notification_title: title,
      notification_text: body,
      notification_sound: "default",
      notification_image_url: "",
      initial_page_name: initialPageName,
      parameter_data: "{}",
      user_refs: userRef.path,
      sender: userRef,
      timestamp: FieldValue.serverTimestamp(),
      num_sent: 0,
    });

    const notifRef = await db.collection("notificacoes").add({
      titulo: title,
      mensagem: body,
      usuario_id: userRef,
      tipo: 1,
      status: 0,
      data_envio: FieldValue.serverTimestamp(),
    });

    await db.collection("notificacao_visualizar").add({
      notificacao_ref: notifRef,
      user_ref: userRef,
      vista: false,
      data_recebida: FieldValue.serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error("[push] falha ao criar notificação push", error);
    return false;
  }
}

export async function sendUserPushNotifications(
  inputs: PushNotificationInput[],
): Promise<{ processed: number }> {
  const unique = new Map<string, PushNotificationInput>();
  for (const item of inputs) {
    const id = item.userId?.trim();
    if (!id) continue;
    if (!unique.has(id)) unique.set(id, item);
  }

  const results = await Promise.all(
    Array.from(unique.values()).map((item) => sendUserPushNotification(item)),
  );

  return { processed: results.filter(Boolean).length };
}

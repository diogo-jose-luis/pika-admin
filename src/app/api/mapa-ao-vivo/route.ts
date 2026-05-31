import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import {
  buildLiveMapData,
  type LiveMapCorridaDoc,
  type LiveMapUserDoc,
} from "@/lib/live-map";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getFirestore();

    const [usersSnap, ridesSnap] = await Promise.all([
      db.collection("users").get(),
      db.collection("corrida_fake").get(),
    ]);

    const users = usersSnap.docs.map((doc) => ({
      id: doc.id,
      data: doc.data() as LiveMapUserDoc,
    }));

    const rides = ridesSnap.docs.map((doc) => ({
      id: doc.id,
      data: doc.data() as LiveMapCorridaDoc,
    }));

    const data = buildLiveMapData(users, rides);

    return NextResponse.json(data);
  } catch (error) {
    console.error("[mapa-ao-vivo GET]", error);
    return NextResponse.json(
      { error: "Não foi possível carregar o mapa ao vivo." },
      { status: 500 },
    );
  }
}

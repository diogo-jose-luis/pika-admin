import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import {
  buildDashboardData,
  parseDashboardDate,
  type DashboardData,
} from "@/lib/dashboard";
import type { CorridaFakeDoc } from "@/lib/ride-history";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const referenceDate = parseDashboardDate(searchParams.get("date"));

    const db = getFirestore();
    const [usersSnap, ridesSnap] = await Promise.all([
      db.collection("users").get(),
      db.collection("corrida_fake").orderBy("data", "desc").get(),
    ]);

    const users = usersSnap.docs.map((doc) => ({
      id: doc.id,
      data: doc.data() as { estado?: number; isDriver?: boolean },
    }));

    const rides = ridesSnap.docs.map((doc) => ({
      id: doc.id,
      data: doc.data() as CorridaFakeDoc & Record<string, unknown>,
    }));

    const data: DashboardData = buildDashboardData(users, rides, referenceDate);

    return NextResponse.json(data);
  } catch (error) {
    console.error("[dashboard]", error);
    return NextResponse.json(
      { error: "Não foi possível carregar o dashboard." },
      { status: 500 },
    );
  }
}

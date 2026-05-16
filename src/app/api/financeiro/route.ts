import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import { buildFinanceData, parseDashboardDate } from "@/lib/finance";
import type { CorridaFakeDoc } from "@/lib/ride-history";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const referenceDate = parseDashboardDate(searchParams.get("date"));

    const db = getFirestore();
    const ridesSnap = await db
      .collection("corrida_fake")
      .orderBy("data", "desc")
      .get();

    const rides = ridesSnap.docs.map((doc) => ({
      id: doc.id,
      data: doc.data() as CorridaFakeDoc & Record<string, unknown>,
    }));

    const data = buildFinanceData(rides, referenceDate);

    return NextResponse.json(data);
  } catch (error) {
    console.error("[financeiro]", error);
    return NextResponse.json(
      { error: "Não foi possível carregar os dados financeiros." },
      { status: 500 },
    );
  }
}

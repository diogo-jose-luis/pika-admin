import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import {
  buildFinanceTransactions,
  defaultTransactionDateRange,
  parseTransactionDateIso,
} from "@/lib/finance";
import type { CorridaFakeDoc } from "@/lib/ride-history";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const defaults = defaultTransactionDateRange();
    const from =
      parseTransactionDateIso(searchParams.get("from")) ?? defaults.from;
    const to = parseTransactionDateIso(searchParams.get("to")) ?? defaults.to;

    if (from > to) {
      return NextResponse.json(
        { error: "A data inicial não pode ser posterior à data final." },
        { status: 400 },
      );
    }

    const db = getFirestore();
    const ridesSnap = await db
      .collection("corrida_fake")
      .orderBy("data", "desc")
      .get();

    const rides = ridesSnap.docs.map((doc) => ({
      id: doc.id,
      data: doc.data() as CorridaFakeDoc & Record<string, unknown>,
    }));

    const transactions = buildFinanceTransactions(rides, from, to);

    return NextResponse.json({
      from,
      to,
      transactions,
      total: transactions.length,
    });
  } catch (error) {
    console.error("[financeiro/transacoes]", error);
    return NextResponse.json(
      { error: "Não foi possível carregar as transações." },
      { status: 500 },
    );
  }
}

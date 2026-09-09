import { unwrapApiData } from "@/lib/auth-types";

export const APPYPAY_STATUSES = [
  "Requested",
  "Pending",
  "Success",
  "Failed",
  "Cancelled",
  "Expired",
] as const;

export type AppyPayChargeStatus = (typeof APPYPAY_STATUSES)[number];

export type AppyPayCharge = {
  id: number | null;
  chargeId: string | null;
  merchantTransactionId: string | null;
  providerTransactionId: string | null;
  referenceNumber: string | null;
  amount: number;
  currency: string;
  description: string | null;
  paymentMethod: string | null;
  phoneNumber: string | null;
  status: string;
  paid: boolean;
  final: boolean;
  successful: boolean;
  statusCode: number | null;
  statusMessage: string | null;
  source: string | null;
  paidAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AppyPayChargesSummary = {
  total: number;
  success: number;
  pending: number;
  failed: number;
  amountPaid: number;
};

export type AppyPayChargesPage = {
  items: AppyPayCharge[];
  paginated: boolean;
  page: number;
  lastPage: number;
  perPage: number;
  total: number;
  summary: AppyPayChargesSummary | null;
};

const FINAL_STATUSES = new Set<string>([
  "Success",
  "Failed",
  "Cancelled",
  "Expired",
]);

const PENDING_STATUSES = new Set<string>(["Requested", "Pending"]);

const FAILED_STATUSES = new Set<string>(["Failed", "Cancelled", "Expired"]);

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1") return true;
  if (value === 0 || value === "0") return false;
  return null;
}

function nestedString(
  record: Record<string, unknown> | null,
  path: string[],
): string | null {
  let current: unknown = record;
  for (const key of path) {
    const obj = asRecord(current);
    if (!obj) return null;
    current = obj[key];
  }
  return asString(current);
}

function payloadRecord(raw: Record<string, unknown>): Record<string, unknown> | null {
  return asRecord(raw.webhook_payload) ?? asRecord(raw.payload);
}

export function parseAppyPayCharge(raw: unknown): AppyPayCharge | null {
  const row = asRecord(raw);
  if (!row) return null;

  const status = asString(row.status) ?? "Pending";
  const paid = asBoolean(row.paid) ?? status === "Success";
  const nested = payloadRecord(row);

  return {
    id: asNumber(row.id),
    chargeId: asString(row.charge_id) ?? asString(row.chargeId),
    merchantTransactionId:
      asString(row.merchant_transaction_id) ??
      asString(row.merchantTransactionId),
    providerTransactionId:
      asString(row.provider_transaction_id) ??
      asString(row.providerTransactionId) ??
      nestedString(nested, ["gpo", "providerTransactionId"]),
    referenceNumber:
      asString(row.reference_number) ??
      asString(row.referenceNumber) ??
      nestedString(nested, ["reference", "referenceNumber"]),
    amount: asNumber(row.amount) ?? 0,
    currency: asString(row.currency) ?? "AOA",
    description: asString(row.description),
    paymentMethod:
      asString(row.payment_method) ?? asString(row.paymentMethod),
    phoneNumber: asString(row.phone_number) ?? asString(row.phoneNumber),
    status,
    paid,
    final: asBoolean(row.final) ?? FINAL_STATUSES.has(status),
    successful: asBoolean(row.successful) ?? false,
    statusCode: asNumber(row.status_code) ?? asNumber(row.code),
    statusMessage:
      asString(row.status_message) ??
      asString(row.message) ??
      asString(row.statusMessage),
    source: asString(row.source),
    paidAt: asString(row.paid_at) ?? asString(row.paidAt),
    createdAt: asString(row.created_at) ?? asString(row.createdAt),
    updatedAt: asString(row.updated_at) ?? asString(row.updatedAt),
  };
}

export function chargeDisplayReference(charge: AppyPayCharge): string {
  return (
    charge.merchantTransactionId ??
    charge.providerTransactionId ??
    charge.referenceNumber ??
    charge.chargeId ??
    (charge.id != null ? `#${charge.id}` : "—")
  );
}

export function chargeMatchesSearch(charge: AppyPayCharge, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    charge.merchantTransactionId,
    charge.providerTransactionId,
    charge.referenceNumber,
    charge.chargeId,
    charge.phoneNumber,
    charge.description,
    charge.status,
    charge.id != null ? String(charge.id) : null,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export function computeChargesSummary(items: AppyPayCharge[]): AppyPayChargesSummary {
  let success = 0;
  let pending = 0;
  let failed = 0;
  let amountPaid = 0;

  for (const item of items) {
    if (item.status === "Success" || item.paid) {
      success += 1;
      amountPaid += item.amount;
      continue;
    }
    if (PENDING_STATUSES.has(item.status)) {
      pending += 1;
      continue;
    }
    if (FAILED_STATUSES.has(item.status)) {
      failed += 1;
    }
  }

  return {
    total: items.length,
    success,
    pending,
    failed,
    amountPaid,
  };
}

function parseSummary(raw: unknown): AppyPayChargesSummary | null {
  const row = asRecord(raw);
  if (!row) return null;
  const total = asNumber(row.total);
  if (total == null) return null;
  return {
    total,
    success: asNumber(row.success) ?? 0,
    pending: asNumber(row.pending) ?? 0,
    failed: asNumber(row.failed) ?? 0,
    amountPaid:
      asNumber(row.amount_paid) ?? asNumber(row.amountPaid) ?? 0,
  };
}

function parseItems(raw: unknown): AppyPayCharge[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(parseAppyPayCharge).filter((item): item is AppyPayCharge => item !== null);
}

function parsePaginator(raw: Record<string, unknown>): AppyPayChargesPage | null {
  const page = asNumber(raw.current_page) ?? asNumber(raw.page);
  const lastPage = asNumber(raw.last_page) ?? asNumber(raw.lastPage);
  const perPage = asNumber(raw.per_page) ?? asNumber(raw.perPage);
  const total = asNumber(raw.total);
  const hasMeta = page != null || lastPage != null || perPage != null;

  if (!hasMeta) return null;

  const items = parseItems(raw.data ?? raw.items ?? raw.charges);
  const resolvedPerPage = perPage ?? (items.length || 20);
  const resolvedPage = page ?? 1;
  const resolvedTotal = total ?? items.length;

  return {
    items,
    paginated: true,
    page: resolvedPage,
    lastPage: lastPage ?? Math.max(1, Math.ceil(resolvedTotal / resolvedPerPage) || 1),
    perPage: resolvedPerPage,
    total: resolvedTotal,
    summary: parseSummary(raw.summary),
  };
}

export function parseAppyPayChargesResponse(payload: unknown): AppyPayChargesPage {
  const data = unwrapApiData<unknown>(payload);

  if (Array.isArray(data)) {
    const items = parseItems(data);
    return {
      items,
      paginated: false,
      page: 1,
      lastPage: 1,
      perPage: items.length || 20,
      total: items.length,
      summary: computeChargesSummary(items),
    };
  }

  const record = asRecord(data);
  if (!record) {
    return {
      items: [],
      paginated: false,
      page: 1,
      lastPage: 1,
      perPage: 20,
      total: 0,
      summary: null,
    };
  }

  const fromPaginator = parsePaginator(record);
  if (fromPaginator && (fromPaginator.items.length > 0 || fromPaginator.total >= 0)) {
    if (!fromPaginator.summary && !fromPaginator.paginated) {
      fromPaginator.summary = computeChargesSummary(fromPaginator.items);
    }
    return fromPaginator;
  }

  const items = parseItems(record.items ?? record.charges ?? record.data);
  const summary = parseSummary(record.summary);
  return {
    items,
    paginated: false,
    page: 1,
    lastPage: 1,
    perPage: items.length || 20,
    total: summary?.total ?? items.length,
    summary: summary ?? computeChargesSummary(items),
  };
}

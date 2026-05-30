import { resolveApiBaseUrl } from "@/lib/apiBaseUrl";
import { NextRequest, NextResponse } from "next/server";

const FORWARD_HEADERS = [
  "authorization",
  "content-type",
  "accept",
  "accept-language",
];

function publicUpstreamPath(targetUrl: URL): string {
  return `${targetUrl.origin}${targetUrl.pathname}`;
}

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
): Promise<NextResponse> {
  const apiBase = resolveApiBaseUrl();
  const path = pathSegments.join("/");
  const targetUrl = new URL(path, `${apiBase}/`);

  request.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  const headers = new Headers();
  for (const name of FORWARD_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (!headers.has("accept")) {
    headers.set("accept", "application/json");
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      init.body = await request.arrayBuffer();
    } else {
      init.body = await request.text();
    }
  }

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl.toString(), init);
  } catch (error) {
    console.error("[api-proxy] fetch failed", targetUrl.toString(), error);
    return NextResponse.json(
      {
        message:
          "Não foi possível contactar a API. Verifique se o servidor Laravel está acessível.",
        upstream_url: publicUpstreamPath(targetUrl),
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }

  const responseBody = await upstream.arrayBuffer();
  const upstreamPath = publicUpstreamPath(targetUrl);

  if (upstream.ok) {
    const responseHeaders = new Headers();
    const upstreamType = upstream.headers.get("content-type");
    if (upstreamType) responseHeaders.set("content-type", upstreamType);
    return new NextResponse(responseBody, {
      status: upstream.status,
      headers: responseHeaders,
    });
  }

  const rawText = new TextDecoder().decode(responseBody).trim();
  let upstreamPayload: unknown = null;

  if (rawText) {
    try {
      upstreamPayload = JSON.parse(rawText);
    } catch {
      upstreamPayload = { message: rawText.slice(0, 2000) };
    }
  }

  const upstreamMessage =
    upstreamPayload &&
    typeof upstreamPayload === "object" &&
    upstreamPayload !== null &&
    "message" in upstreamPayload &&
    typeof (upstreamPayload as { message: unknown }).message === "string"
      ? (upstreamPayload as { message: string }).message
      : null;

  let message = upstreamMessage;

  if (!message && rawText) {
    message = rawText.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 500);
  }

  if (!message) {
    message =
      upstream.status >= 500
        ? `A API respondeu com erro ${upstream.status} sem corpo na resposta. Consulte storage/logs/laravel.log no servidor.`
        : `A API respondeu com erro ${upstream.status}.`;
  }

  return NextResponse.json(
    {
      message,
      upstream_status: upstream.status,
      upstream_url: upstreamPath,
      upstream: upstreamPayload,
    },
    { status: upstream.status },
  );
}

type RouteContext = { params: Promise<{ path: string[] }> };

async function handle(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    const { path } = await context.params;
    return await proxyRequest(request, path);
  } catch (error) {
    console.error("[api-proxy] unhandled", error);
    return NextResponse.json(
      {
        message: "Erro interno no proxy da API.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;

import { resolveApiBaseUrl } from "@/lib/apiBaseUrl";
import {
  isBotChallengeText,
  looksLikeHtmlDocument,
  sanitizeApiErrorText,
  UPSTREAM_BOT_CHALLENGE_CODE,
  UPSTREAM_BOT_CHALLENGE_MESSAGE,
} from "@/lib/api-error";
import { NextRequest, NextResponse } from "next/server";

const FORWARD_HEADERS = [
  "authorization",
  "content-type",
  "accept",
  "accept-language",
];

const PROXY_USER_AGENT = "PikaAdmin/1.0 (api-proxy)";

function publicUpstreamPath(targetUrl: URL): string {
  return `${targetUrl.origin}${targetUrl.pathname}`;
}

function botChallengeResponse(
  upstreamStatus: number,
  upstreamPath: string,
): NextResponse {
  return NextResponse.json(
    {
      message: UPSTREAM_BOT_CHALLENGE_MESSAGE,
      code: UPSTREAM_BOT_CHALLENGE_CODE,
      upstream_status: upstreamStatus,
      upstream_url: upstreamPath,
    },
    { status: 502 },
  );
}

function isUpstreamBotChallenge(text: string, location: string | null): boolean {
  if (location && /lsrecap|recaptcha/i.test(location)) return true;
  return isBotChallengeText(text);
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
  headers.set("user-agent", PROXY_USER_AGENT);
  headers.set("x-requested-with", "XMLHttpRequest");

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
          "Não foi possível contactar a API. Verifique se o servidor está acessível.",
        upstream_url: publicUpstreamPath(targetUrl),
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }

  const responseBody = await upstream.arrayBuffer();
  const upstreamPath = publicUpstreamPath(targetUrl);
  const upstreamType = upstream.headers.get("content-type");
  const location = upstream.headers.get("location");
  const rawText = new TextDecoder().decode(responseBody).trim();

  if (isUpstreamBotChallenge(rawText, location)) {
    console.error("[api-proxy] upstream bot challenge", {
      status: upstream.status,
      url: targetUrl.toString(),
      location,
      contentType: upstreamType,
    });
    return botChallengeResponse(upstream.status, upstreamPath);
  }

  if (looksLikeHtmlDocument(rawText, upstreamType)) {
    return NextResponse.json(
      {
        message: sanitizeApiErrorText(rawText),
        upstream_status: upstream.status,
        upstream_url: upstreamPath,
      },
      { status: 502 },
    );
  }

  if (upstream.ok) {
    const responseHeaders = new Headers();
    if (upstreamType) responseHeaders.set("content-type", upstreamType);
    return new NextResponse(responseBody, {
      status: upstream.status,
      headers: responseHeaders,
    });
  }

  let upstreamPayload: unknown = null;

  if (rawText) {
    try {
      upstreamPayload = JSON.parse(rawText);
    } catch {
      upstreamPayload = { message: sanitizeApiErrorText(rawText) };
    }
  }

  const upstreamMessage =
    upstreamPayload &&
    typeof upstreamPayload === "object" &&
    upstreamPayload !== null &&
    "message" in upstreamPayload &&
    typeof (upstreamPayload as { message: unknown }).message === "string"
      ? sanitizeApiErrorText((upstreamPayload as { message: string }).message)
      : null;

  let message = upstreamMessage;

  if (!message && rawText) {
    message = sanitizeApiErrorText(rawText).slice(0, 500);
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

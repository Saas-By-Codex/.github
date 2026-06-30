import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getActiveContext, type ActiveContext } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { ForbiddenError } from "@/lib/rbac";

/**
 * Shared wrapper for authenticated JSON API routes.
 *
 * Responsibilities (in order):
 *   1. rate limit by IP + route
 *   2. authenticate + resolve active org context
 *   3. run the handler, translating known errors to clean HTTP responses
 */
export async function withApi(
  req: Request,
  handler: (ctx: ActiveContext, req: Request) => Promise<NextResponse | Response>,
  opts: { limit?: number } = {},
): Promise<Response> {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const route = new URL(req.url).pathname;

  const rl = rateLimit(`${ip}:${route}`, { limit: opts.limit ?? 60 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again shortly." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  const ctx = await getActiveContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return await handler(ctx, req);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: err.flatten() },
        { status: 422 },
      );
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    console.error(`API error on ${route}:`, err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

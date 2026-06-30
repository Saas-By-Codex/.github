import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/health — liveness/readiness probe (checks DB connectivity).
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      demoMode: process.env.DEMO_MODE !== "false",
      time: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ status: "degraded" }, { status: 503 });
  }
}

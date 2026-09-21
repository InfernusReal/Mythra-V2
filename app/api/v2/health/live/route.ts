import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";

export function GET() {
  return NextResponse.json({ status: "ok", releaseVersion: getEnv().RELEASE_VERSION }, { headers: { "cache-control": "no-store" } });
}

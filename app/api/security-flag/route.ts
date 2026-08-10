import { NextResponse } from "next/server";
import { isFeatureEnabled } from "@/lib/feature-flags";

export const revalidate = 30; // cache for 30s

export async function GET() {
  try {
    const enabled = await isFeatureEnabled("security-system");
    return NextResponse.json({ enabled });
  } catch {
    // If DB fails, fail closed (security off) or fail open? Let's say off to allow login during DB hiccup
    return NextResponse.json({ enabled: false });
  }
}

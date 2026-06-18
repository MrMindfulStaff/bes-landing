import { runPersonaCycle } from "@/lib/persona-engine";

export const runtime = "nodejs";
export const maxDuration = 60;

// Driven by Vercel Cron (which sends Authorization: Bearer $CRON_SECRET).
// Also manually triggerable with the same header for seeding/testing.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const result = await runPersonaCycle();
  return Response.json(result);
}

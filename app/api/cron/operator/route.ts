import { runOperatorCycle } from "@/lib/operator";

export const runtime = "nodejs";
export const maxDuration = 300;

// The Operator (runs BES as Reginald). Driven by Vercel Cron (Authorization: Bearer $CRON_SECRET).
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  return Response.json(await runOperatorCycle());
}

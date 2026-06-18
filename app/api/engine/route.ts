import { authorizeEngine, unauthorized, notConfigured } from "@/lib/engine";

export const runtime = "nodejs";

// Health/auth check — lets the engine confirm its key is valid.
export async function GET(req: Request) {
  if (!process.env.ENGINE_API_KEY) return notConfigured();
  if (!authorizeEngine(req)) return unauthorized();
  return Response.json({
    ok: true,
    service: "bes-engine-api",
    endpoints: [
      "POST /api/engine/post",
      "POST /api/engine/event",
      "POST /api/engine/lead",
      "GET  /api/engine/members",
    ],
  });
}

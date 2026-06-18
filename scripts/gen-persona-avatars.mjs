// Generate photo-real avatars for the BES Mentor personas via OpenAI gpt-image-1.
// Saves to public/personas/<slug>.png.  node scripts/gen-persona-avatars.mjs

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

// OPENAI_API_KEY from content-engine/.env (never printed)
let key = process.env.OPENAI_API_KEY;
if (!key) {
  const env = readFileSync("../../content-engine/.env", "utf8");
  key = (env.match(/^OPENAI_API_KEY=(.*)$/m)?.[1] || "").replace(/^"|"$/g, "").trim();
}
if (!key) throw new Error("OPENAI_API_KEY not found");

const personas = JSON.parse(readFileSync("lib/personas.json", "utf8"));
mkdirSync("public/personas", { recursive: true });

for (const p of personas) {
  process.stdout.write(`Generating ${p.slug}... `);
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-image-1", prompt: p.avatarPrompt, size: "1024x1024", n: 1 }),
  });
  if (!res.ok) {
    console.log(`FAILED ${res.status}: ${(await res.text()).slice(0, 200)}`);
    continue;
  }
  const json = await res.json();
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) { console.log("no image returned"); continue; }
  writeFileSync(`public/personas/${p.slug}.png`, Buffer.from(b64, "base64"));
  console.log("saved.");
}
console.log("Done.");

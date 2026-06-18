// Create/refresh the BES Mentor persona accounts (service role).
// Idempotent: creates the auth user if missing, always updates the profile.
//   node scripts/create-personas.mjs
// Requires .env.migrate (vercel env pull) + deployed /personas/<slug>.png avatars.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const line of readFileSync(".env.migrate", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const personas = JSON.parse(readFileSync("lib/personas.json", "utf8"));

// existing accounts by email
const existing = new Map();
for (let page = 1; page <= 10; page++) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
  if (error) throw error;
  data.users.forEach((u) => u.email && existing.set(u.email.toLowerCase(), u.id));
  if (data.users.length < 200) break;
}

for (const p of personas) {
  let uid = existing.get(p.email.toLowerCase());
  if (!uid) {
    const { data, error } = await admin.auth.admin.createUser({
      email: p.email,
      email_confirm: true,
      user_metadata: { full_name: p.name, is_persona: true },
    });
    if (error) { console.log(`✗ ${p.name}: ${error.message}`); continue; }
    uid = data.user.id;
    console.log(`+ created ${p.name}`);
  } else {
    console.log(`= ${p.name} exists`);
  }

  const { error: upErr } = await admin
    .from("profiles")
    .update({
      full_name: p.name,
      headline: p.headline,
      bio: p.bio,
      industry: p.industry,
      location: p.location,
      avatar_url: `https://jointhebes.com/personas/${p.slug}.png`,
      is_persona: true,
      onboarding_completed: true,
    })
    .eq("id", uid);
  if (upErr) console.log(`  profile update failed: ${upErr.message}`);
  else console.log(`  profile set (${p.headline})`);
}
console.log("Done.");

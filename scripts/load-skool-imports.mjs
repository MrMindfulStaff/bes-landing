// Load the consolidated Skool roster into the skool_imports staging table.
// Idempotent: clears unapplied rows, then inserts the full roster.
//
//   node scripts/load-skool-imports.mjs
//
// Requires .env.migrate (vercel env pull) and ../skool-roster-full.csv.

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

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c === "\r") { /* skip */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const nameKey = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const rows = parseCsv(readFileSync("../skool-roster-full.csv", "utf8")).filter((r) => r.some((c) => c.trim()));
const h = rows[0];
const col = (name) => h.indexOf(name);
const recs = rows.slice(1).map((r) => ({
  full_name: r[col("name")] || "",
  name_key: nameKey(r[col("name")] || ""),
  email: (r[col("email")] || "").trim().toLowerCase() || null,
  bio: r[col("bio")] || null,
  location: r[col("location")] || null,
  handle: r[col("handle")] || null,
  joined: r[col("joined")] || null,
  source: r[col("source")] || null,
}));

// refresh unapplied rows only (keep applied history)
const { error: delErr } = await admin.from("skool_imports").delete().is("applied_at", null);
if (delErr) throw delErr;

const { error, count } = await admin.from("skool_imports").insert(recs, { count: "exact" });
if (error) throw error;

console.log(`Loaded ${count ?? recs.length} staged members (with email: ${recs.filter((r) => r.email).length}).`);

// Migrate Skool members -> BES platform accounts.
// DRY RUN by default. Pass --run to actually create accounts.
//
//   node scripts/migrate-members.mjs            # dry run (no writes)
//   node scripts/migrate-members.mjs --run      # create accounts
//
// Reads keys from .env.migrate (vercel env pull), CSV from ../community_members.csv.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const RUN = process.argv.includes("--run");
const CSV_PATH = process.argv.find((a) => a.endsWith(".csv")) || "../community_members.csv";

// --- load env from .env.migrate ---
const env = {};
for (const line of readFileSync(".env.migrate", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Missing Supabase URL/service key in .env.migrate");

const admin = createClient(url, key, { auth: { persistSession: false } });

// --- minimal CSV parser (handles quoted fields) ---
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

const raw = parseCsv(readFileSync(CSV_PATH, "utf8")).filter((r) => r.some((c) => c.trim()));
const header = raw[0];
const idx = (name) => header.indexOf(name);
const iFirst = idx("FirstName"), iLast = idx("LastName"), iEmail = idx("Email"), iJoined = idx("JoinedDate");

const members = raw.slice(1).map((r) => ({
  first: (r[iFirst] || "").trim(),
  last: (r[iLast] || "").trim(),
  email: (r[iEmail] || "").trim().toLowerCase(),
  joined: (r[iJoined] || "").trim(),
})).filter((m) => m.email.includes("@"));

// existing accounts (paginate)
const existing = new Set();
for (let page = 1; page <= 10; page++) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
  if (error) throw error;
  data.users.forEach((u) => u.email && existing.add(u.email.toLowerCase()));
  if (data.users.length < 200) break;
}

const mask = (e) => e.replace(/^(.).*(@.*)$/, "$1***$2");
const toCreate = members.filter((m) => !existing.has(m.email));
const already = members.filter((m) => existing.has(m.email));
const internal = members.filter((m) => /@(reignos|mindfulstaff)\.com$/.test(m.email));

console.log(`CSV: ${CSV_PATH}`);
console.log(`Members in file (valid email): ${members.length}`);
console.log(`Already have a BES account (skip): ${already.length}`);
console.log(`Would create: ${toCreate.length}`);
console.log(`Internal/team emails (reignos/mindfulstaff): ${internal.length}`);
if (internal.length) internal.forEach((m) => console.log(`   ⚑ ${m.first} ${m.last} <${mask(m.email)}>`));
console.log("");

if (!RUN) {
  console.log("DRY RUN — no accounts created. Re-run with --run to create the following:");
  toCreate.forEach((m) => console.log(`   + ${m.first} ${m.last} <${mask(m.email)}>`));
  process.exit(0);
}

let ok = 0, skipped = 0, failed = 0;
for (const m of toCreate) {
  const full_name = `${m.first} ${m.last}`.trim() || null;
  const { error } = await admin.auth.admin.createUser({
    email: m.email,
    email_confirm: true,
    user_metadata: { full_name, migrated_from: "skool", joined_skool: m.joined || null },
  });
  if (error) {
    if (/registered|exists/i.test(error.message)) { skipped++; }
    else { failed++; console.log(`   ✗ ${mask(m.email)}: ${error.message}`); }
  } else { ok++; }
}
console.log(`\nCreated: ${ok} | Skipped(existing): ${skipped} | Failed: ${failed}`);

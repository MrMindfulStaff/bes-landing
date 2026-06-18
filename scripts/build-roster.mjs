// Merge the Skool export (names + the 6 available emails + join dates) with the
// scraped bios/handles/locations into one consolidated roster CSV.
// Output is written OUTSIDE the git repo to keep member emails out of version control.
//
//   node scripts/build-roster.mjs

import { readFileSync, writeFileSync } from "node:fs";

const EXPORT = "../community_members.csv";
const OUT = "../skool-roster-full.csv";

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

const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const csvField = (s) => {
  const v = String(s ?? "");
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
};

// --- export: name -> {email, joined} ---
const rows = parseCsv(readFileSync(EXPORT, "utf8")).filter((r) => r.some((c) => c.trim()));
const h = rows[0];
const iF = h.indexOf("FirstName"), iL = h.indexOf("LastName"), iE = h.indexOf("Email"), iJ = h.indexOf("JoinedDate");
const exportByName = new Map();
for (const r of rows.slice(1)) {
  const full = `${(r[iF] || "").trim()} ${(r[iL] || "").trim()}`.trim();
  exportByName.set(norm(full), { email: (r[iE] || "").trim().toLowerCase(), joined: (r[iJ] || "").trim() });
}

// --- bios ---
const bios = JSON.parse(readFileSync("scripts/skool-bios.json", "utf8"));

const out = [["name", "email", "bio", "location", "handle", "joined", "source"]];
let withEmail = 0, matched = 0;
for (const b of bios) {
  const ex = exportByName.get(norm(b.name)) || { email: "", joined: "" };
  if (ex.email) withEmail++;
  if (exportByName.has(norm(b.name))) matched++;
  out.push([b.name, ex.email, b.bio, b.location, b.handle, ex.joined, b.source]);
}

writeFileSync(OUT, out.map((r) => r.map(csvField).join(",")).join("\n") + "\n");
console.log(`Wrote ${OUT}`);
console.log(`Rows: ${bios.length} | matched to export: ${matched}/${bios.length} | with email: ${withEmail}`);
const unmatched = bios.filter((b) => !exportByName.has(norm(b.name))).map((b) => b.name);
if (unmatched.length) console.log(`Unmatched names (check spelling): ${unmatched.join(", ")}`);

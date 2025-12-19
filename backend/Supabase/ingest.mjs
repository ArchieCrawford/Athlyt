import "dotenv/config";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function parseCSV(csv) {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length);
  const header = lines[0].split(",").map((s) => s.trim());
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    const row = [];
    let cur = "";
    let inQ = false;
    for (let j = 0; j < lines[i].length; j++) {
      const ch = lines[i][j];
      if (ch === '"' && lines[i][j + 1] === '"') {
        cur += '"';
        j++;
      } else if (ch === '"') {
        inQ = !inQ;
      } else if (ch === "," && !inQ) {
        row.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    row.push(cur);
    const obj = {};
    for (let k = 0; k < header.length; k++) obj[header[k]] = row[k] ?? "";
    out.push(obj);
  }
  return out;
}

function norm(s) {
  return (s ?? "").toString().replace(/\s+/g, " ").trim();
}

function splitName(full) {
  const f = norm(full);
  if (!f) return { first: null, last: null, full: null };
  const parts = f.split(" ");
  if (parts.length === 1) return { first: parts[0], last: null, full: f };
  return { first: parts[0], last: parts.slice(1).join(" "), full: f };
}

const inputCSV = process.argv[2];
if (!inputCSV) {
  console.error("Usage: node ingest.mjs <path-to-csv>");
  process.exit(1);
}

const csv = fs.readFileSync(inputCSV, "utf8");
const rows = parseCSV(csv);

const payload = rows.map((r) => {
  const name = splitName(r.coach_name || r.coach_full_name || r.name || "");
  return {
    sport: norm(r.sport),
    division: norm(r.division) || null,
    school: norm(r.school),
    coach_first_name: name.first,
    coach_last_name: name.last,
    coach_full_name: name.full,
    title: norm(r.title) || null,
    email: norm(r.email) || null,
    phone: norm(r.phone) || null,
    state: norm(r.state) || null,
    source_url: norm(r.source_url || r.url),
    last_seen_at: new Date().toISOString(),
  };
});

const CHUNK = 1000;

for (let i = 0; i < payload.length; i += CHUNK) {
  const chunk = payload.slice(i, i + CHUNK);

  const { error } = await supabase
    .from("coach_contacts")
    .upsert(chunk, { onConflict: "sport,school,email,coach_full_name" });

  if (error) {
    console.error("Upsert failed:", error);
    process.exit(1);
  }

  console.log(`Upserted ${Math.min(i + CHUNK, payload.length)} / ${payload.length}`);
}

console.log("Done.");

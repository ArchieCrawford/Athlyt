import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";

// Load env from current dir or parent fallback
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const triedPaths = [
  path.join(__dirname, ".env"),
  path.join(__dirname, "..", ".env"),
];
let loadedEnv = null;
for (const p of triedPaths) {
  if (fs.existsSync(p)) {
    loadedEnv = p;
    loadEnv({ path: p });
    break;
  }
}

// Paths and logging helpers
const HOME = "https://www.collegecoaches.us/";
const LOG_DIR = path.join(process.cwd(), "logs");
fs.mkdirSync(LOG_DIR, { recursive: true });
const logFile = path.join(LOG_DIR, `scrape_${Date.now()}.log`);
const logStream = fs.createWriteStream(logFile, { flags: "a" });
const log = (...args) => {
  const line = `[${new Date().toISOString()}] ${args.join(" ")}`;
  console.log(line);
  logStream.write(line + "\n");
};

// Basic env validation before talking to Supabase
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  log("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
  throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const DIVISIONS = ["Division I", "Division II", "Division III"];

const norm = (s) => (s ?? "").toString().replace(/\s+/g, " ").trim();
const extractEmail = (t) => (t.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i) || [null])[0];
const extractPhone = (t) => (t.match(/(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/) || [null])[0];
const extractState = (t) => (t.match(/\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/) || [null])[0];

async function gotoAndWaitForData(page, url, { timeoutMs = 90000 } = {}) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: timeoutMs });

  const selectors = [
    "table",
    "table tbody tr",
    "[data-flux-card]",
    "text=/Division\\s*(I|II|III)/i",
  ];

  let lastErr;
  for (const sel of selectors) {
    try {
      await page.waitForSelector(sel, { timeout: 20000 });
      return;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("Data did not appear (no known selectors found)");
}

async function withRetries(fn, tries = 3, delayMs = 1500) {
  let err;
  for (let i = 1; i <= tries; i++) {
    try {
      return await fn(i);
    } catch (e) {
      err = e;
      await new Promise((r) => setTimeout(r, delayMs * i));
    }
  }
  throw err;
}

function toCSV(rows) {
  const headers = ["sport","division","school","coach_name","title","email","phone","state","source_url","last_seen_at"];
  const esc = (v) => {
    const s = (v ?? "").toString();
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.join(",")];
  for (const r of rows) lines.push(headers.map((h) => esc(r[h])).join(","));
  return lines.join("\n");
}

async function clickDivision(page, divisionLabel) {
  const btn = page.locator(`text=${divisionLabel}`).first();
  await btn.click({ timeout: 15000 });
  // Give the page a moment to swap results after tab click
  await page.waitForTimeout(1200);
}

async function autoScroll(page, maxSteps = 35) {
  let last = -1;
  for (let i = 0; i < maxSteps; i++) {
    const h = await page.evaluate(() => document.body.scrollHeight);
    if (h === last) break;
    last = h;
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(650);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function scrapeVisibleDirectory(page, sport, division, sourceUrl) {
  await autoScroll(page);

  const result = await page.evaluate(() => {
    const tables = Array.from(document.querySelectorAll("table"));
    if (tables.length) {
      const t = tables[0];
      const rows = Array.from(t.querySelectorAll("tr")).map((tr) =>
        Array.from(tr.querySelectorAll("th,td")).map((td) => (td.innerText || "").trim())
      );
      return { mode: "table", rows };
    }

    const candidates = [];
    const sels = [".card",".coach-card",".directory-card",".listing-card","[class*='card']","[class*='coach']","[class*='listing']"];
    for (const sel of sels) document.querySelectorAll(sel).forEach((n) => candidates.push(n));
    const uniq = Array.from(new Set(candidates)).filter((n) => n?.innerText?.trim());
    if (uniq.length) {
      return { mode: "cards", chunks: uniq.map((n) => n.innerText.split("\n").map((x) => x.trim()).filter(Boolean)) };
    }

    const lines = document.body.innerText.split("\n").map((x) => x.trim()).filter(Boolean);
    return { mode: "lines", lines };
  });

  const out = [];

  if (result.mode === "table") {
    const rows = result.rows;
    const header = rows[0]?.map((h) => h.toLowerCase()) || [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const joined = r.join(" ");
      const email = extractEmail(joined);
      if (!email) continue;

      const school = r[header.findIndex((h) => h.includes("school"))] || r[0] || "";
      const coach = r[header.findIndex((h) => h.includes("coach"))] || r[1] || "";
      const title = r[header.findIndex((h) => h.includes("title"))] || "";
      const phone = extractPhone(joined);
      const state = extractState(joined);

      out.push({
        sport,
        division,
        school: norm(school),
        coach_name: norm(coach),
        title: norm(title) || null,
        email: norm(email),
        phone: norm(phone) || null,
        state: norm(state) || null,
        source_url: sourceUrl,
        last_seen_at: new Date().toISOString(),
      });
    }
  } else {
    const blocks = result.mode === "cards"
      ? result.chunks
      : (() => {
          const b = [];
          let cur = [];
          for (const line of result.lines) {
            cur.push(line);
            if (extractEmail(line)) { b.push(cur); cur = []; }
            if (cur.length > 60) cur = [];
          }
          return b;
        })();

    for (const chunk of blocks) {
      const joined = chunk.join(" ");
      const email = extractEmail(joined);
      if (!email) continue;

      const phone = extractPhone(joined);
      const state = extractState(joined);

      const coach_name = chunk[0] || null;
      const title = chunk.find((x) => /coach/i.test(x) && !/@/.test(x)) || null;

      let school = null;
      if (chunk.length >= 2) school = chunk[1];
      if (school && /@/.test(school)) school = null;

      out.push({
        sport,
        division,
        school: norm(school) || "Unknown",
        coach_name: norm(coach_name) || null,
        title: norm(title) || null,
        email: norm(email),
        phone: norm(phone) || null,
        state: norm(state) || null,
        source_url: sourceUrl,
        last_seen_at: new Date().toISOString(),
      });
    }
  }

  const deduped = [];
  const seen = new Set();
  for (const r of out) {
    const k = `${r.sport}|${r.division}|${r.school}|${r.email}|${r.coach_name || ""}`;
    if (seen.has(k)) continue;
    seen.add(k);
    deduped.push(r);
  }
  return deduped;
}

async function upsertAll(rows) {
  const CHUNK = 1000;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await supabase
      .from("coach_contacts")
      .upsert(chunk, { onConflict: "sport,division,school,email,coach_name" });
    if (error) {
      if (/no unique or exclusion constraint/i.test(error.message || "")) {
        const hint =
          "Supabase table coach_contacts needs a unique constraint on (sport, division, school, email, coach_name). Example: CREATE UNIQUE INDEX coach_contacts_uq ON coach_contacts (sport, division, school, email, coach_name);";
        log("ERROR: missing unique constraint for upsert. Add it and rerun.");
        log(hint);
      }
      throw error;
    }
    const done = Math.min(i + CHUNK, rows.length);
    log(`Upserted ${done} / ${rows.length}`);
  }
  log("Upsert complete");
}

async function main() {
  log(`Starting scrape. Log file: ${logFile}`);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(90000);
  page.setDefaultTimeout(30000);

  // Block heavy assets/analytics to speed up and reduce never-idle requests
  await page.route("**/*", (route) => {
    const req = route.request();
    const type = req.resourceType();
    const url = req.url();
    if (type === "image" || type === "font" || type === "media") {
      return route.abort();
    }
    if (/(google-analytics|googletagmanager|doubleclick|facebook|segment|mixpanel)/i.test(url)) {
      return route.abort();
    }
    return route.continue();
  });

  await gotoAndWaitForData(page, HOME, { timeoutMs: 90000 });

  const sports = await page.evaluate(() => {
    const a = Array.from(document.querySelectorAll("a"));
    const links = a
      .map((x) => ({ text: (x.innerText || "").trim(), href: x.href }))
      .filter((x) => x.href && /collegecoaches\.us\/.+\.html/.test(x.href) && /(men|women)/i.test(x.text));
    const uniq = [];
    const seen = new Set();
    for (const l of links) {
      const k = l.href;
      if (seen.has(k)) continue;
      seen.add(k);
      uniq.push(l);
    }
    return uniq;
  });

  log(`Found ${sports.length} sport links to scrape`);

  const allRows = [];
  for (const sportLink of sports) {
    const sport = sportLink.text;
    for (const division of DIVISIONS) {
      await withRetries(async (attempt) => {
        log(`Scraping ${sport} / ${division} (attempt ${attempt})`);
        await gotoAndWaitForData(page, sportLink.href, { timeoutMs: 90000 });
        await page.waitForTimeout(400);
        await clickDivision(page, division);

        const rows = await scrapeVisibleDirectory(page, sport, division, sportLink.href);
        allRows.push(...rows);

        log(`${sport} / ${division}: scraped ${rows.length} rows`);
      });
    }
  }

  await browser.close();

  fs.writeFileSync("collegecoaches_all.csv", toCSV(allRows));
  fs.writeFileSync("collegecoaches_all.json", JSON.stringify(allRows, null, 2));

  log(`Total scraped rows: ${allRows.length}`);
  await upsertAll(allRows);
  log("Done. Files: collegecoaches_all.csv, collegecoaches_all.json");
}

main()
  .catch((e) => {
    log("FAILED:", e?.message || e);
    process.exit(1);
  })
  .finally(() => {
    log("Exiting");
    logStream.end();
  });

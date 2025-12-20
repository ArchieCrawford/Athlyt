import fs from "fs";
import path from "path";

const root = process.cwd();

const IGNORE_DIRS = new Set([
  ".git",
  ".expo",
  ".next",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".turbo",
  ".vercel",
  ".idea",
  ".vscode",
  "android",
  "ios",
  ".DS_Store",
]);

const IGNORE_FILES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
]);

function isIgnored(name, fullPath, stats) {
  if (stats.isDirectory() && IGNORE_DIRS.has(name)) return true;
  if (stats.isFile() && IGNORE_FILES.has(name)) return true;
  return false;
}

function rel(p) {
  return path.relative(root, p).replaceAll("\\", "/");
}

function safeStat(p) {
  try {
    return fs.lstatSync(p);
  } catch {
    return null;
  }
}

function walk(dir, prefix = "", lines = [], fileIndex = new Map()) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  entries.sort((a, b) => {
    const ad = a.isDirectory();
    const bd = b.isDirectory();
    if (ad !== bd) return ad ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const filtered = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    const st = safeStat(full);
    if (!st) continue;
    if (isIgnored(e.name, full, st)) continue;
    filtered.push({ e, full, st });
  }

  filtered.forEach(({ e, full, st }, idx) => {
    const isLast = idx === filtered.length - 1;
    const branch = isLast ? "└─ " : "├─ ";
    const nextPrefix = prefix + (isLast ? "   " : "│  ");

    if (e.isDirectory()) {
      lines.push(`${prefix}${branch}${e.name}/`);
      walk(full, nextPrefix, lines, fileIndex);
    } else {
      lines.push(`${prefix}${branch}${e.name}`);

      // index file names to spot duplicates across dirs
      const name = e.name;
      const list = fileIndex.get(name) ?? [];
      list.push(rel(full));
      fileIndex.set(name, list);
    }
  });

  return { lines, fileIndex };
}

function hashOfFile(p) {
  // optional: quick signature based on size + mtime (fast, not cryptographic)
  const st = safeStat(p);
  if (!st) return null;
  return `${st.size}:${st.mtimeMs.toFixed(0)}`;
}

function buildDuplicateReport(fileIndex) {
  const dups = [];
  for (const [name, paths] of fileIndex.entries()) {
    if (paths.length > 1) dups.push({ name, paths });
  }
  dups.sort((a, b) => b.paths.length - a.paths.length || a.name.localeCompare(b.name));

  const lines = [];
  lines.push(`## Duplicate filenames (same name in multiple locations)`);
  lines.push(`(Not necessarily identical content — this just flags “same filename in multiple folders.”)`);
  lines.push("");

  if (dups.length === 0) {
    lines.push("_No duplicate filenames found._");
    return lines.join("\n");
  }

  for (const d of dups) {
    lines.push(`- **${d.name}** (${d.paths.length})`);
    for (const p of d.paths) lines.push(`  - ${p}`);
  }

  return lines.join("\n");
}

function buildSupabaseSummary(fileIndex) {
  // highlight common “duplicate Supabase project” patterns
  const needles = [
    "supabase/config.toml",
    "supabase/migrations",
    "supabase/functions",
    "supabase/seed.sql",
    "schema.sql",
  ];

  const found = [];
  for (const [name, paths] of fileIndex.entries()) {
    if (name === "config.toml" || name === "schema.sql") {
      for (const p of paths) found.push(p);
    }
  }

  const lines = [];
  lines.push(`## Supabase-ish hotspots`);
  lines.push(`Use this to spot multiple Supabase roots (e.g. one at /supabase and another under /backend).`);
  lines.push("");

  const allPaths = Array.from(fileIndex.values()).flat();
  const matches = allPaths
    .filter((p) =>
      needles.some((n) => p.endsWith(n) || p.includes(n.replaceAll("/", "/")))
    )
    .sort();

  if (matches.length === 0) {
    lines.push("_No obvious Supabase paths matched._");
    return lines.join("\n");
  }

  for (const m of matches) lines.push(`- ${m}`);
  return lines.join("\n");
}

function main() {
  const date = new Date().toISOString().slice(0, 10);
  const outFile = path.join(root, `DIR_TREE_${date}.md`);

  const header = [];
  header.push(`# Repo Directory Map (${date})`);
  header.push("");
  header.push(`Root: \`${root.replaceAll("\\", "/")}\``);
  header.push("");
  header.push(`## Directory tree`);
  header.push("```");
  header.push("./");
  const { lines, fileIndex } = walk(root, "", [], new Map());
  header.push(...lines);
  header.push("```");
  header.push("");
  header.push(buildSupabaseSummary(fileIndex));
  header.push("");
  header.push(buildDuplicateReport(fileIndex));
  header.push("");

  fs.writeFileSync(outFile, header.join("\n"), "utf8");
  console.log(`Wrote: ${outFile}`);
}

main();

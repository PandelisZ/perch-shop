// Runs the Playwright suite against every build and prints which tests pass.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const root = process.env.SHOP_ROOT ?? "http://localhost:4173/";
const variants = JSON.parse(readFileSync("variants.json", "utf8"));
const rows = [];
for (const [name, slug] of Object.entries(variants)) {
  const url = new URL(slug ? `${slug}/` : "", root).href;
  const run = spawnSync("npx", ["playwright", "test", "--reporter=json"], {
    env: { ...process.env, SHOP_URL: url },
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  const report = JSON.parse(run.stdout);
  const specs = report.suites.flatMap((s) => s.specs);
  const failed = specs.filter((s) => !s.ok).map((s) => s.title.slice(0, 2));
  rows.push({ build: name, passed: `${specs.length - failed.length}/${specs.length}`, failed: failed.join(" ") || "-" });
}
console.table(rows);

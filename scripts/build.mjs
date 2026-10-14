// Builds dist/: one copy of the shop per build, each at its own opaque path.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const base = process.env.BASE_PATH ?? "/perch-shop/";
const variants = JSON.parse(readFileSync("variants.json", "utf8"));
rmSync("dist", { recursive: true, force: true });
mkdirSync("dist");
cpSync("site/app.js", "dist/app.js");
cpSync("site/styles.css", "dist/styles.css");

Object.values(variants).forEach((slug, index) => {
  const dir = join("dist", slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "index.html"),
    `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Perch</title>
<link rel="stylesheet" href="${base}styles.css" />
</head>
<body>
<div id="app"></div>
<script>window.PERCH_BUILD = ${index};</script>
<script src="${base}app.js"></script>
</body>
</html>
`,
  );
});
writeFileSync(join("dist", ".nojekyll"), "");
console.log(`Built ${Object.keys(variants).length} builds under ${base}`);

import { copyFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const docs = join(process.cwd(), "docs");
if (!existsSync(docs)) {
  throw new Error("docs/ missing after vite build");
}
copyFileSync(join(docs, "index.html"), join(docs, "404.html"));
writeFileSync(join(docs, ".nojekyll"), "");
const orgSrc = join(process.cwd(), "src/data/organizations.json");
copyFileSync(orgSrc, join(docs, "organizations.json"));
writeFileSync(
  join(docs, "README.txt"),
  "UWSWOK Resources static export for GitHub Pages (main /docs). Base path /UWSWOK-Resources/.\n"
);
console.log("postbuild: 404.html, .nojekyll, organizations.json written to docs/");

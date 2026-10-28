import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
const files = execFileSync("git", ["ls-files", "*.md"], { encoding: "utf8" }).trim().split(/\r?\n/).filter(Boolean);
const failures = [];
let links = 0;
for (const file of files) {
  const content = readFileSync(file, "utf8").replace(/```[\s\S]*?```/g, "");
  for (const match of content.matchAll(/\[[^\]]*\]\((?:<([^>]+)>|([^\s)]+))(?:\s+"[^"]*")?\)/g)) {
    const link = match[1] || match[2];
    if (/^(?:[a-z][a-z\d+.-]*:|#|\/\/)/i.test(link)) continue;
    const relative = decodeURIComponent(link.split("#")[0].split("?")[0]);
    if (!relative) continue;
    links++;
    if (!existsSync(resolve(dirname(file), relative))) failures.push(`${file}: ${link}`);
  }
}
if (failures.length) { console.error(failures.join("\n")); process.exitCode = 1; }
else console.log(`${files.length} Markdown files; ${links} local file links resolved. External URLs and heading anchors are not checked.`);

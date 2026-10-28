import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

// OSV queries contain public Maven coordinates only, never environment variables.
const directory = resolve(process.env.AUDIT_OUTPUT_DIR || "dist/security");
await mkdir(directory, { recursive: true });
const inventory = resolve(directory, "java-dependencies.txt");
if (!process.env.AUDIT_DEPENDENCIES_FILE) {
  if (process.platform === "win32") throw new Error("On Windows, export dependency:list with Maven and set AUDIT_DEPENDENCIES_FILE to that file.");
  execFileSync(process.env.MAVEN_COMMAND || "mvn", [
    "-B", "-f", "services/api/pom.xml", "dependency:list", "-DincludeScope=runtime",
    `-DoutputFile=${inventory}`,
  ], { stdio: "inherit" });
}
const content = await readFile(process.env.AUDIT_DEPENDENCIES_FILE || inventory, "utf8");
const queries = content.split(/\r?\n/).flatMap((line) => {
  const match = line.trim().match(/^([^:\s]+):([^:\s]+):jar:(?:[^:\s]+:)?([^:\s]+):(compile|runtime)\b/);
  return match ? [{ package: { ecosystem: "Maven", name: `${match[1]}:${match[2]}` }, version: match[3] }] : [];
});
if (!queries.length) throw new Error("No resolved Maven dependencies; audit cannot pass empty");
const alerts = [];
for (let start = 0; start < queries.length; start += 100) {
  const batch = queries.slice(start, start + 100);
  const response = await fetch("https://api.osv.dev/v1/querybatch", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ queries: batch }), signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`OSV query failed: ${response.status}`);
  const result = await response.json();
  if (result.results?.length !== batch.length) throw new Error("Incomplete OSV response");
  result.results.forEach((item, index) => {
    for (const vulnerability of item.vulns || []) alerts.push({ dependency: batch[index], ...vulnerability });
  });
}
await writeFile(resolve(directory, "java-audit.json"), JSON.stringify({
  observedAt: new Date().toISOString(), source: "OSV querybatch", count: queries.length, alerts,
}, null, 2) + "\n");
console.log(`Audited ${queries.length} resolved dependencies; ${alerts.length} package/advisory matches. Review reachability in docs/DEPENDENCY_AUDIT.md.`);

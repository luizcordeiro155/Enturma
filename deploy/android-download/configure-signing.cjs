const fs = require("node:fs");
const path = require("node:path");

const project = process.cwd();
const android = path.join(project, "apps", "mobile", "android");
const appDir = path.join(android, "app");
const gradle = path.join(appDir, "build.gradle");
const keystore = path.join(appDir, "enturma-release.keystore");

const encoded = process.env.ANDROID_KEYSTORE_BASE64;
const storePassword = process.env.ANDROID_KEYSTORE_PASSWORD;
const keyAlias = process.env.ANDROID_KEY_ALIAS || "enturma";
const keyPassword = process.env.ANDROID_KEY_PASSWORD;

for (const [name, value] of Object.entries({
  ANDROID_KEYSTORE_BASE64: encoded,
  ANDROID_KEYSTORE_PASSWORD: storePassword,
  ANDROID_KEY_PASSWORD: keyPassword,
})) {
  if (!value) throw new Error(`${name} não foi configurado.`);
}

fs.writeFileSync(keystore, Buffer.from(encoded, "base64"));

let source = fs.readFileSync(gradle, "utf8");
if (!source.includes("signingConfigs {")) {
  throw new Error("Bloco signingConfigs não encontrado no build.gradle gerado.");
}

const releaseConfig = `
        release {
            storeFile file("enturma-release.keystore")
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias System.getenv("ANDROID_KEY_ALIAS") ?: "enturma"
            keyPassword System.getenv("ANDROID_KEY_PASSWORD")
        }
`;

source = source.replace(
  /signingConfigs\s*\{/,
  (match) => `${match}${releaseConfig}`,
);

const releaseBlock = /release\s*\{([\s\S]*?)\n\s*\}/m;
const found = source.match(releaseBlock);
if (!found) throw new Error("buildTypes.release não encontrado.");

let body = found[1];
if (/signingConfig\s+signingConfigs\.debug/.test(body)) {
  body = body.replace(
    /signingConfig\s+signingConfigs\.debug/,
    "signingConfig signingConfigs.release",
  );
} else if (!/signingConfig\s+signingConfigs\.release/.test(body)) {
  body = `\n            signingConfig signingConfigs.release${body}`;
}
source = source.replace(releaseBlock, `release {${body}\n        }`);

fs.writeFileSync(gradle, source);
console.log("Assinatura release do Android configurada.");

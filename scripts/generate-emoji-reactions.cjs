// Keep the API allowlist in sync with the picker. Run after updating emojibase-data.
// Dataset: Emojibase / CLDR, MIT. See docs/EMOJI_LICENSE.txt.
const fs = require("node:fs");
const path = require("node:path");
const data = require("emojibase-data/pt/compact.json");
const values = data
  .flatMap((e) => [e, ...(e.skins || [])])
  .map((e) => e.unicode);
const catalog = [
  ...new Set(values.flatMap((s) => [s, s.replaceAll("\ufe0f", "")])),
];
fs.writeFileSync(
  path.join(
    __dirname,
    "../services/api/src/main/resources/emoji-reactions.txt",
  ),
  catalog.join("\n") + "\n",
);

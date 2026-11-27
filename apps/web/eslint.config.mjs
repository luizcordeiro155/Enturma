import { defineConfig, globalIgnores } from "eslint/config";
import next from "eslint-config-next/core-web-vitals";
import ts from "eslint-config-next/typescript";
export default defineConfig([
  ...next,
  ...ts,
  // public/vendor holds third-party builds served as they are
  globalIgnores([".next/**", "next-env.d.ts", "public/vendor/**"]),
]);

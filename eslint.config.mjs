import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Prevent direct console usage - use logger utility instead
      "no-console": ["error", {
        allow: ["assert", "clear", "count", "countReset", "dir", "dirxml", "group", "groupEnd", "groupCollapsed", "profile", "profileEnd", "table", "time", "timeEnd", "timeLog", "timeStamp", "trace"]
      }],
      // Custom message for better developer experience
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.object.name='console'][callee.property.name=/^(log|error|warn|info|debug)$/]",
          message: "Use the logger utility from '@/lib/logger' instead of console. Example: logger.debug() for development logs, logger.error() for errors."
        }
      ]
    }
  }
];

export default eslintConfig;

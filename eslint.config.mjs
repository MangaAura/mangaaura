import { defineConfig, globalIgnores } from "eslint/config";
import nextConfig from "eslint-config-next";
import nextTs from "eslint-config-next/typescript";
import importPlugin from "eslint-plugin-import";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import reactPlugin from "eslint-plugin-react";

const eslintConfig = defineConfig([
  ...nextConfig,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    "dist/**",
    "coverage/**",
    ".vercel/**",
    "prisma/migrations/**",
    "*.config.*",
  ]),
  {
    name: "mangaaura-custom-rules",
    files: ["**/*.{js,jsx,ts,tsx,mjs,cjs}"],
    plugins: {
      import: importPlugin,
      "react-hooks": reactHooksPlugin,
      react: reactPlugin,
    },
    rules: {
      "import/no-anonymous-default-export": "warn",
      "import/no-duplicates": "warn",
      "import/order": [
        "warn",
        {
          groups: [
            ["builtin", "external"],
            ["internal", "parent", "sibling", "index"],
          ],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react/no-unescaped-entities": "warn",
      "react-hooks/purity": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "prefer-const": "warn",
      "no-var": "error",
    },
  },
]);

export default eslintConfig;

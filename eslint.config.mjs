import { defineConfig } from "eslint/config";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import prettierPlugin from "eslint-plugin-prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([{
    ignores: ["**/node_modules/**", "**/.next/**", "**/dist/**", "**/build/**"],

    extends: compat.extends(
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended"
    ),

    plugins: {
        "@typescript-eslint": typescriptEslint,
        prettier: prettierPlugin
    },

    languageOptions: {
        globals: {
            ...globals.node,
        },
        parser: tsParser,
        ecmaVersion: 2021,
        sourceType: "module",
    },

    rules: {
        // ✅ Prettier handles formatting
        "prettier/prettier": "error",

        // ⚡ Only ESLint rules that don't conflict with Prettier
        "no-console": "off",
        "no-floating-decimal": "error",
        "no-lonely-if": "error",
        "no-var": "error",
        "prefer-const": "error",
        "yoda": "error",
        "max-nested-callbacks": ["error", { max: 4 }],
        "max-statements-per-line": ["error", { max: 2 }],

        // TypeScript-specific
        "@typescript-eslint/no-empty-function": "warn",
        "@typescript-eslint/no-unused-vars": "warn",
        "@typescript-eslint/no-shadow": ["error", {
            allow: ["err", "resolve", "reject", "s", "c", "f", "l"]
        }],

        // Turn off all formatting rules that conflict with Prettier
        semi: "off",
        quotes: "off",
        "brace-style": "off",
        "comma-dangle": "off",
        "comma-spacing": "off",
        "space-in-parens": "off",
        "space-infix-ops": "off",
        "space-unary-ops": "off",
        "object-curly-spacing": "off",
        "arrow-spacing": "off",
        "keyword-spacing": "off",
        "space-before-function-paren": "off",
        "space-before-blocks": "off",
        "spaced-comment": "off",

        // Turn off conflicting base rules
        "no-empty-function": "off",
        "no-shadow": "off",
        "no-unused-vars": "off",
    },
}]);

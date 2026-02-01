// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["build/**", "node_modules/**", "vitest.config.ts"] },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["eslint.config.js"],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Avoid any - use unknown for truly unknown values
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-argument": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-return": "error",

      // Require explicit return types on exported functions (public APIs)
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
          allowDirectConstAssertionInArrowFunctions: true,
        },
      ],

      // Prefer readonly for immutability
      "@typescript-eslint/prefer-readonly": "error",

      // Named exports only - no default exports
      "no-restricted-syntax": [
        "error",
        {
          selector: "ExportDefaultDeclaration",
          message: "Prefer named exports for consistency and better refactoring support.",
        },
      ],

      // Unused vars with underscore pattern
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      // Prefer nullish coalescing and optional chaining
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",

      // Consistent type imports
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
        },
      ],

      // Prefer interface for extendable shapes (public APIs)
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],

      // Naming conventions - relaxed for API compatibility
      "@typescript-eslint/naming-convention": [
        "error",
        // PascalCase for types, interfaces, classes, enums
        {
          selector: ["typeLike"],
          format: ["PascalCase"],
        },
        // Allow snake_case in destructuring (API compatibility)
        {
          selector: "variable",
          modifiers: ["destructured"],
          format: null,
        },
        // Allow snake_case for object literal properties (API compatibility)
        {
          selector: "objectLiteralProperty",
          format: null,
        },
        // Allow snake_case for object literal methods (handler map keys)
        {
          selector: "objectLiteralMethod",
          format: null,
        },
        // camelCase or UPPER_CASE for regular variables
        {
          selector: "variable",
          format: ["camelCase", "UPPER_CASE", "PascalCase"],
          leadingUnderscore: "allow",
        },
        // camelCase for functions and methods
        {
          selector: ["function", "method"],
          format: ["camelCase"],
          leadingUnderscore: "allow",
        },
        // camelCase for parameters
        {
          selector: "parameter",
          format: ["camelCase"],
          leadingUnderscore: "allow",
        },
      ],

      // Prefer @ts-expect-error over @ts-ignore
      "@typescript-eslint/prefer-ts-expect-error": "error",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-expect-error": "allow-with-description",
          "ts-ignore": true,
          "ts-nocheck": true,
          "ts-check": false,
        },
      ],

      // Require Array<T> for complex types, T[] for simple
      "@typescript-eslint/array-type": [
        "error",
        {
          default: "array-simple",
          readonly: "array-simple",
        },
      ],

      // Consistent generic type naming
      "@typescript-eslint/no-unnecessary-type-arguments": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      "@typescript-eslint/no-redundant-type-constituents": "error",
    },
  }
);

"use strict";

// Import the ESLint plugin locally
const safeKysely = require("./eslint-plugin-safe-kysely");

module.exports = [
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      ecmaVersion: "latest",
    },
    // Using the eslint-plugin-safe-kysely plugin defined locally
    plugins: { "safe-kysely": safeKysely },
    rules: {
      "safe-kysely/enforce-where-clause": "error",
    },
  },
];

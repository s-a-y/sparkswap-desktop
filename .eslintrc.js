// tsconfigRootDir is relative to the current working directory, so for the
// editor to find the tsconfig.json file, we have to use __dirname to make
// the path relative to the eslintrc file.
// https://github.com/typescript-eslint/typescript-eslint/issues/251
module.exports = {
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "env": {
    "mocha": true
  },
  "extends": [
    "standard",
    "react-app",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "no-restricted-imports": ["error", {
      "patterns": ["**/shared"]
    }],
    "no-useless-constructor": "off",
    "indent": "off",
    "lines-between-class-members": "off",
    "@typescript-eslint/no-useless-constructor": "error",
    "@typescript-eslint/member-delimiter-style": ["error", {
      "multiline": {
          "delimiter": "comma",
          "requireLast": false
      },
      "singleline": {
          "delimiter": "comma",
          "requireLast": false
      }
    }],
    "@typescript-eslint/indent": ["error", 2],
    "@typescript-eslint/explicit-member-accessibility": ["error", {
      "accessibility": "no-public"
    }],
    "@typescript-eslint/no-unused-vars": ["error", {
      "argsIgnorePattern": "^_"
    }],
    "@typescript-eslint/explicit-function-return-type": ["error", {
      "allowExpressions": true
    }],
    "camelcase": "off",
    "@typescript-eslint/camelcase": ["error", {
      "ignoreDestructuring": true
    }]
  }
}

module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "module"
  },
  plugins: ["react-hooks", "strict-hooks"],
  rules: {
    "strict-hooks/explicit-exhaustive-deps-disable": "warn",
    "react-hooks/exhaustive-deps": "warn"
  }
};

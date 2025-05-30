module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "module"
  },
  plugins: ["react-hooks", "strict-hooks"],
  rules: {
    "strict-hooks/require-exhaustive-deps-comment": ["warn", {
      enabledHooks: ["useEffect", "useMemo", "useCallback"],
      requireCommentPerDependency: true
    }],
    "react-hooks/exhaustive-deps": "warn"
  }
};

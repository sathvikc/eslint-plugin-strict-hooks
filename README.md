# eslint-plugin-strict-hooks

Hooks’ dependency arrays are critical for correctness: omitting a variable can lead to stale values or missed updates, and disabling React’s exhaustive-deps rule without explanation makes debugging harder. **eslint-plugin-strict-hooks** steps in exactly when you choose to bypass `react-hooks/exhaustive-deps` via an inline comment. It enforces that you document:

1. **Which** dependencies you are intentionally leaving out.
2. **Why** it’s safe to omit them.

Without this plugin, silent omissions can hide bugs—components using outdated variables, unexpected re-renders, or maintenance headaches when code evolves.

## Features

* **Styled annotations**: Recognize `// eslint-disable-line react-hooks/exhaustive-deps -- depName: reason` comments.
* **Detect missing mentions**: Warn if a dependency used in the hook callback is not mentioned in the disable comment.

## Installation

```bash
npm install --save-dev eslint-plugin-strict-hooks eslint-utils
# or
yarn add --dev eslint-plugin-strict-hooks eslint-utils
```

Make sure you also have React Hooks rules available (from `eslint-plugin-react-hooks`) in your project:

```bash
npm install --save-dev eslint-plugin-react-hooks
# or
yarn add --dev eslint-plugin-react-hooks
```

## Usage

Add `strict-hooks` alongside `react-hooks` in your ESLint config. Our plugin adds an extra layer on top of the standard `exhaustive-deps` checks—it does **not** replace or disable them.

```json
{
  "plugins": ["react-hooks", "strict-hooks"],
  "rules": {
    // Keep the built-in exhaustive-deps rule enabled
    "react-hooks/exhaustive-deps": "warn",

    // Add this rule to enforce documented disables
    "strict-hooks/explicit-exhaustive-deps-disable": "warn"
  }
}
```

## Rule: `strict-hooks/explicit-exhaustive-deps-disable`

Require a comment explanation when disabling exhaustive-deps.

### Valid

```js
useEffect(() => {
  fetchData();
}, []); // eslint-disable-line react-hooks/exhaustive-deps -- fetchData: memoized
```

### Invalid

```js
useEffect(() => {
  fetchData();
}, []); // eslint-disable-line react-hooks/exhaustive-deps
```

*Error:* `You've disabled exhaustive-deps, but you need to document why 'fetchData' is safe to omit.`

## Configuration

Currently, `eslint-plugin-strict-hooks` has no configuration options—just enable the rule directly.

```json
{
  "plugins": ["strict-hooks"],
  "rules": {
    "strict-hooks/explicit-exhaustive-deps-disable": "warn"
  }
}
```

## Contributing

1. Fork the repo
2. Install dependencies: `yarn install`
3. Run tests in sandbox: `npm run test:sandbox`
4. Submit a PR against `main`

## Future Additions & Limitations

**Future Additions**

* Support for `eslint-disable-next-line react-hooks/exhaustive-deps` comments across multiple lines.
* Autofix suggestions to automatically append missing dependencies with placeholders.
* Configurable support for custom hook names (e.g. `useDebouncedEffect`).
* Optional JSON output of dependency diffs for CI integrations.
* TypeScript-specific enhancements, such as respecting type-only imports and interface properties.

**Current Limitations**

* Only recognizes inline `// eslint-disable-line` comments, not `disable-next-line` or block disables.
* No built-in autofix; suggestions must be applied manually.
* Assumes JavaScript/JSX source; some edge cases in TypeScript projects may not be fully covered.
* Does not track destructured nested properties beyond direct member expressions.
* Relies on ESLint scope analysis; unusual AST transforms or preprocessors may produce false positives/negatives.

## License

MIT - see [LICENSE](LICENSE)

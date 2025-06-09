"use strict";

const path = require("path");
const { ESLint } = require("eslint");

(async function() {
  const pluginRoot  = process.cwd();
  const sandboxPath = path.resolve(pluginRoot, "sandbox");

  // Load your strict-hooks plugin entrypoint
  const strictHooksPlugin = require(path.resolve(pluginRoot, "index.js"));

  // Stub only the exhaustive-deps rule inside a react-hooks plugin
  const reactHooksStub = {
    rules: {
      // this stub satisfies ESLint's lookup; we immediately turn it off below
      "exhaustive-deps": {
        meta: {
          docs: { description: "stub", category: "Possible Errors" },
          schema: []
        },
        create: () => ({})
      }
    }
  };

  // Instantiate ESLint with both plugins registered
  const eslint = new ESLint({
    cwd: sandboxPath,
    useEslintrc: false,
    baseConfig: {
      parserOptions: { ecmaVersion: 2020, sourceType: "module" },
      env: { es6: true, browser: true, node: true },

      plugins: ["strict-hooks", "react-hooks"],
      rules: {
        // turn the real rule off (this stubbed one will never run)
        "react-hooks/exhaustive-deps": "off",
        // enable your rule
        "strict-hooks/explicit-exhaustive-deps-disable": "warn"
      }
    },

    // Inject both plugins into the ESLint runtime
    plugins: {
      "strict-hooks": strictHooksPlugin,
      "react-hooks": reactHooksStub
    }
  });

  // Lint & format
  const results   = await eslint.lintFiles(["test.js"]);
  const formatter = await eslint.loadFormatter("stylish");
  console.log(formatter.format(results));
})();

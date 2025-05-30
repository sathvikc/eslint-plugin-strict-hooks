const { execSync } = require("child_process");
const path = require("path");

const pluginRoot = process.cwd();
const sandboxPath = path.resolve(pluginRoot, "sandbox");

try {
  console.log("🔁 Unlinking previous global plugin (if any)...");
  execSync("yarn unlink", { cwd: pluginRoot, stdio: "inherit" });
} catch {}

console.log("🔗 Linking plugin globally...");
execSync("yarn link", { cwd: pluginRoot, stdio: "inherit" });

console.log("🚚 Moving to sandbox...");
console.log("🔁 Unlinking in sandbox...");
try {
  execSync("yarn unlink eslint-plugin-strict-hooks", { cwd: sandboxPath, stdio: "inherit" });
} catch {}

console.log("🔗 Linking plugin into sandbox...");
execSync("yarn link eslint-plugin-strict-hooks", { cwd: sandboxPath, stdio: "inherit" });

console.log("🧪 Running ESLint on sandbox test file...");
execSync("npx eslint test.js", { cwd: sandboxPath, stdio: "inherit" });

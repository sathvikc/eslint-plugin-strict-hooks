console.log('PLUGIN LOADED')

module.exports = {
  rules: {
    "require-exhaustive-deps-comment": require("./lib/rules/require-exhaustive-deps-comment")
  }
};

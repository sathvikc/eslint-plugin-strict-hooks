"use strict";

// ✅ Persistent cache across `create()` calls
const fileSeenHooks = new Map();
const IGNORED_GLOBALS = new Set(["useEffect", "useMemo", "useCallback", "useLayoutEffect", "Component"]);

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Require comments with dependency names when disabling exhaustive-deps",
      category: "Best Practices",
      recommended: false
    },
    messages: {
      missingComment: "Disabling 'react-hooks/exhaustive-deps' requires '-- depName [optional reason]'.",
      missingDepMention: "Dependency '{{dep}}' is used in hook but not mentioned in comment.",
      staleDep: "Dependency '{{dep}}' is no longer used in hook but still mentioned in comment.",
      unnecessaryDisable: "No missing dependencies detected — remove 'eslint-disable-line react-hooks/exhaustive-deps'."
    },
    hasSuggestions: true,
    schema: [
      {
        type: "object",
        properties: {
          enabledHooks: { type: "array", items: { type: "string" } },
          disabledHooks: { type: "array", items: { type: "string" } },
          requireCommentPerDependency: { type: "boolean" },
          respectUpstreamRule: { type: "boolean" }
        },
        additionalProperties: false
      }
    ]
  },

  create(context) {
    const sourceCode = context.getSourceCode();
    const config = context.options[0] || {};
    const enabledHooks = new Set(config.enabledHooks || ["useEffect", "useMemo", "useCallback", "useLayoutEffect"]);
    const disabledHooks = new Set(config.disabledHooks || []);
    const requirePerDep = config.requireCommentPerDependency !== false;

    function extractMentionedDeps(commentText) {
      const raw = commentText.split("--")[1] || "";
      const tokens = raw.split(/[,\n]/)
        .map(s => s.trim().split(":")[0])
        .map(s => s.split(/\s+/)[0])
        .filter(Boolean);

      return [...new Set(tokens)];
    }

    function getDisableComment(node) {
      const allComments = sourceCode.getAllComments();
      return allComments.find(comment =>
        comment.type === "Line" &&
        comment.loc.start.line === node.loc.end.line &&
        comment.value.trim().startsWith("eslint-disable-line react-hooks/exhaustive-deps")
      );
    }

    function extractHookDeps(node) {
      if (!node.arguments || node.arguments.length !== 2) return [];
      const depsNode = node.arguments[1];
      if (!depsNode || depsNode.type !== "ArrayExpression") return [];
      return depsNode.elements
        .filter(el => el && el.type === "Identifier")
        .map(el => el.name);
    }

    function extractUsedIdentifiers(hookNode) {
      const identifiers = new Set();
      const visited = new WeakSet();

      const callback = hookNode.arguments?.[0];
      if (
        !callback ||
        (callback.type !== "FunctionExpression" && callback.type !== "ArrowFunctionExpression")
      ) return [];

      function walk(node) {
        if (!node || typeof node !== "object" || visited.has(node)) return;
        visited.add(node);

        if (node.type === "Identifier" && node.name !== undefined) {
          identifiers.add(node.name);
        }

        for (const key in node) {
          if (!Object.prototype.hasOwnProperty.call(node, key)) continue;
          const value = node[key];
          if (Array.isArray(value)) {
            value.forEach(walk);
          } else if (value && typeof value === "object" && value.type) {
            walk(value);
          }
        }
      }

      if (callback.body?.type === "BlockStatement") {
        for (const statement of callback.body.body) {
          walk(statement);
        }
      } else {
        walk(callback.body);
      }

      const used = Array.from(identifiers).filter(name => !IGNORED_GLOBALS.has(name) && name !== undefined);

      return used;
    }

    return {
      CallExpression(node) {
        const callee = node.callee.name;
        const line = node.loc?.start?.line;
        const filename = context.getFilename();

        if (!fileSeenHooks.has(filename)) {
          fileSeenHooks.set(filename, new Set());
        }
        const seenHooks = fileSeenHooks.get(filename);
        const hookKey = `${callee}@${line}`;
        if (seenHooks.has(hookKey)) return;
        seenHooks.add(hookKey);

        if (disabledHooks.has(callee)) return;
        if (!enabledHooks.has(callee)) return;

        const disableComment = getDisableComment(node);
        if (!disableComment) return;

        const text = disableComment.value.trim();
        if (!text.includes("--")) {
          context.report({
            loc: disableComment.loc,
            messageId: "missingComment"
          });
          return;
        }

        const mentioned = extractMentionedDeps(text);
        const usedIds = extractUsedIdentifiers(node);
        const hookDeps = extractHookDeps(node);
        const ignoredDeps = usedIds.filter(id => !hookDeps.includes(id));
        const staleMentions = mentioned.filter(dep => !usedIds.includes(dep));

        if (!ignoredDeps.length && !mentioned.length) {
          context.report({
            loc: disableComment.loc,
            messageId: "unnecessaryDisable"
          });
        }

        ignoredDeps.forEach(dep => {
          if (!mentioned.includes(dep)) {
            context.report({
              loc: disableComment.loc,
              messageId: "missingDepMention",
              data: { dep },
              suggest: [
                {
                  desc: `Add '${dep}' to comment`,
                  fix: fixer => {
                    const insert = requirePerDep ? `${dep}: [reason]` : dep;
                    const updated = text + (text.endsWith("--") ? " " : ", ") + insert;
                    return fixer.replaceText(disableComment, `// ${updated}`);
                  }
                }
              ]
            });
          }
        });

        staleMentions.forEach(dep => {
          context.report({
            loc: disableComment.loc,
            messageId: "staleDep",
            data: { dep }
          });
        });
      },

      'Program:exit'() {
        // 🔥 Clean up cache for this file
        fileSeenHooks.delete(context.getFilename());
      }
    };
  }
};

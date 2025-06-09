"use strict";

const {
  INCLUDED_HOOKS,
  findDisableComment,
  extractMentionedDeps,
  extractHookDeps,
  extractUsedIdentifiers,
} = require('./utils');

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require intentional comment when disabling react-hooks/exhaustive-deps',
      category: 'Best Practices',
      recommended: false,
      ruleId: 'explicit-exhaustive-deps-disable'
    },
    messages: {
      missingDeps: 'You\'ve disabled exhaustive-deps, but you need to document why \'{{deps}}\' {{verb}} safe to omit.',
    },
    schema: [],
  },

  /**
   * @param {import('eslint').Rule.RuleContext} context
   * @returns {import('eslint').Rule.RuleListener}
   */
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      CallExpression(node) {
        const name = node.callee.name;

        if (!INCLUDED_HOOKS.includes(name)) return;

        const disabledComment = findDisableComment(node, sourceCode);

        if (!disabledComment) return;

        const hookDeps = extractHookDeps(node, sourceCode);
        const usedIdentifiers = extractUsedIdentifiers(node, sourceCode);
        const mentioned = extractMentionedDeps(disabledComment);
        
        const missing = usedIdentifiers.filter(d => !hookDeps.includes(d) && !mentioned.includes(d));

        if (missing.length === 0) return;

        context.report({
          node,
          messageId: 'missingDeps',
          data: {
            deps: missing.join(', '),
            verb: missing.length > 1 ? 'are' : 'is',
          },
        });
      }
    };
  }
};

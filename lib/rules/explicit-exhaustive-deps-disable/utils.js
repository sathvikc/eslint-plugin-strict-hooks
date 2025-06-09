"use strict";

const { getStaticValue } = require("eslint-utils");

const INCLUDED_HOOKS = [
  'useEffect',
  'useCallback',
  'useMemo',
  'useLayoutEffect',
  'useInsertionEffect',
];

/**  
 * Find an inline disable‐line comment for react-hooks/exhaustive-deps  
 * attached to a hook call.  
 *  
 * @param {ESTree.CallExpression} node  
 * @param {import('eslint').SourceCode} sourceCode  
 * @returns {import('eslint').Token|null}  the comment node, or null if none  
 */
function findDisableComment(node, sourceCode) {
  // Walk up until we hit exactly an ExpressionStatement or VariableDeclaration
  let stmt = node;
  while (
    stmt &&
    stmt.type !== "ExpressionStatement" &&
    stmt.type !== "VariableDeclaration"
  ) {
    stmt = stmt.parent;
  }
  if (!stmt) return null;

  // Grab trailing comments on that statement
  const comments = sourceCode.getCommentsAfter(stmt) || [];
  return (
    comments.find(c =>
      c.type === "Line" &&
      c.loc.start.line === stmt.loc.end.line &&
      /eslint-disable-line\s+react-hooks\/exhaustive-deps/.test(c.value)
    ) || null
  );
}

/**
 * Extracts dependency names mentioned after the first "--" in a disable comment.
 * Supports multiple "--" in the payload by rejoining after the first marker.
 *
 * @param {string} commentText - The raw comment value
 * @returns {string[]} Array of dependency names (e.g. ["foo", "bar"])
 */
function extractMentionedDeps(comment) {
  const commentText = comment.value;
  // Split on the first "--" marker, keep everything after it
  const parts = commentText.split(/--/);
  if (parts.length < 2) return []; // no "--" at all

  // Rejoin anything after the first "--" in case reasons contain "--"
  const payload = parts.slice(1).join("--").trim();
  if (!payload) return []; // "--" present but nothing after it

  // Extract all valid identifier tokens (including nested like user.id)
  const matches = payload.match(/[\w$.]+/g);
  return matches || [];
}

/**
 * Given a CallExpression node for a hook,
 * return an array of everything listed in its deps array.
 *
 * Supports both simple identifiers and member expressions (e.g. user.id).
 */
function extractHookDeps(node, sourceCode) {
  const depsArg = node.arguments[1];
  if (!depsArg || depsArg.type !== "ArrayExpression") {
    return [];
  }

  return depsArg.elements
    .filter(el => el && (el.type === "Identifier" || el.type === "MemberExpression"))
    .map(el => {
      if (el.type === "Identifier") {
        return el.name;
      } else {
        // for MemberExpression, just grab the source text (e.g. "user.id")
        return sourceCode.getText(el);
      }
    });
}

/**
 * Collect every identifier reference in the hook callback’s closure,
 * skipping those that statically evaluate to a primitive.
 *
 * @param {ESTree.FunctionExpression|ESTree.ArrowFunctionExpression} callback
 * @param {import('eslint').SourceCode} sourceCode
 * @returns {string[]}
 */
function extractUsedIdentifiers(node, sourceCode) {
  const callback = node.arguments[0];
  const hookName = node.callee.name;

  // Figure out if this call is stored in a variable:
  //    e.g. const handleClick = useCallback(...)
  let varName;
  if (
    node.parent &&
    node.parent.type === "VariableDeclarator" &&
    node.parent.id.type === "Identifier"
  ) {
    varName = node.parent.id.name;
  }

  // ensure we have a block body
  if (!callback.body || callback.body.type !== "BlockStatement") {
    return [];
  }

  const { start, end } = callback.body.loc;

  // grab the scope for the callback
  const scope = sourceCode.scopeManager.acquire(callback);
  if (!scope) return [];

  const deps = new Set();

  // walk up through scopes but focus on "through" refs for the callback
  for (const ref of scope.through) {
    const idNode = ref.identifier;
    const name = idNode.name;
    const { line } = idNode.loc.start;

    // only consider references whose definition *use* is inside the callback
    if (line < start.line || line > end.line) continue;

    // skip the hook itself
    if (name === hookName) continue;
    // skip the variable the hook is assigned to
    if (name === varName) continue;

    // skip globally‐resolved names (console, window, etc.)
      //    ref.resolved will be undefined if it’s undeclared,
      //    but if it’s a built‐in, resolved.scope.type === 'global'
    if (ref.resolved && ref.resolved.scope.type === 'global') {
      continue;
    }

    // skip primitives that statically evaluate
    const staticEval = getStaticValue(idNode, sourceCode.getScope(idNode));
    if (
      staticEval &&
      (typeof staticEval.value === "string" ||
       typeof staticEval.value === "number" ||
       typeof staticEval.value === "boolean")
    ) {
      continue;
    }

    // skip any unresolved refs (avoid defs lookup on null)
    if (!ref.resolved) {
      continue;
    }

    // generic member-expression logic
    if (
      idNode.parent.type === "MemberExpression" &&
      idNode.parent.object === idNode &&
      idNode.parent.property.type === "Identifier"
    ) {
      const objName = name;
      const propName = idNode.parent.property.name;
      // safely grab defs array (may be empty)
      const defs = Array.isArray(ref.resolved.defs) ? ref.resolved.defs : [];
      const varDef = defs[0]?.node; // VariableDeclarator
      const init = varDef && varDef.init;

      if (init && init.type === "ArrayExpression") {
        // any array method → just record the array variable
        deps.add(objName);
      } else if (init && init.type === "ObjectExpression") {
        // if this object literal defines that key, record full obj.prop
        const hasOwn = init.properties.some(prop => {
          return (
            prop.key.type === "Identifier" &&
            prop.key.name === propName
          );
        });
        deps.add(hasOwn ? `${objName}.${propName}` : objName);
      } else {
        // fallback: assume this is your own custom method
        deps.add(`${objName}.${propName}`);
      }
    } else {
      deps.add(name);
    }
  }

  return Array.from(deps);
}

module.exports = {
  INCLUDED_HOOKS,
  findDisableComment,
  extractMentionedDeps,
  extractHookDeps,
  extractUsedIdentifiers,
};
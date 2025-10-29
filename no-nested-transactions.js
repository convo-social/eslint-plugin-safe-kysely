module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow nested transactions and usage of other connections inside transactions.",
    },
    schema: [],
  },
  create(context) {
    const sourceCode = context.getSourceCode();

    // Skip if no transaction-related code
    if (!/transaction\(\)/.test(sourceCode.text)) {
      return {};
    }

    // Track when we're inside a transaction callback
    const transactionScopes = [];

    function checkIfTransactionCallback(node) {
      // Check if this function is a callback to .transaction().execute()
      // Pattern: db.transaction().execute(async (trx) => {...})
      const parent = node.parent;
      if (parent && parent.type === "CallExpression") {
        const callExpression = parent;
        if (
          callExpression.callee.type === "MemberExpression" &&
          callExpression.callee.property.name === "execute"
        ) {
          const executeCallee = callExpression.callee.object;
          if (
            executeCallee.type === "CallExpression" &&
            executeCallee.callee.type === "MemberExpression" &&
            executeCallee.callee.property.name === "transaction"
          ) {
            // This is a transaction callback
            transactionScopes.push({
              node: node,
              trxParam: node.params[0] ? node.params[0].name : null,
            });
          }
        }
      }
    }

    function exitFunctionCallback(node) {
      if (transactionScopes.length > 0) {
        const lastScope = transactionScopes[transactionScopes.length - 1];
        if (node === lastScope.node) {
          transactionScopes.pop();
        }
      }
    }

    return {
      ArrowFunctionExpression: checkIfTransactionCallback,
      FunctionExpression: checkIfTransactionCallback,
      "ArrowFunctionExpression:exit": exitFunctionCallback,
      "FunctionExpression:exit": exitFunctionCallback,

      CallExpression(node) {
        // Check if this is a .transaction() call and we're already inside a transaction
        if (
          transactionScopes.length > 0 &&
          node.callee.type === "MemberExpression" &&
          node.callee.property.name === "transaction"
        ) {
          context.report({
            node: node,
            message:
              "Using .transaction() inside a transaction can cause deadlocks or unexpected behavior.",
          });
        }

        // If we're inside a transaction, check for problematic patterns
        if (transactionScopes.length > 0) {
          const currentScope = transactionScopes[transactionScopes.length - 1];

          // Check for query execution on a different Kysely instance (not the trx parameter)
          // This catches cases like: db.selectFrom('table').execute() inside a transaction
          if (
            node.callee.type === "MemberExpression" &&
            ["execute", "executeTakeFirst", "executeTakeFirstOrThrow", "executeFirstOrThrow"].includes(
              node.callee.property.name
            )
          ) {
            // Walk up the chain to find the root object
            let current = node.callee.object;
            let depth = 0;
            const maxDepth = 20;

            while (current && depth < maxDepth) {
              if (current.type === "Identifier") {
                // Check if this identifier is NOT the transaction parameter
                if (currentScope.trxParam && current.name !== currentScope.trxParam) {
                  // This is likely a separate Kysely instance
                  context.report({
                    node: node,
                    message: `Query executed on '${current.name}' instead of transaction parameter '${currentScope.trxParam}'. This will use a separate connection and bypass the transaction.`,
                  });
                }
                break;
              } else if (current.type === "MemberExpression") {
                current = current.object;
              } else if (current.type === "CallExpression") {
                current = current.callee;
              } else {
                // Reached something that's not the transaction parameter (e.g., ThisExpression)
                if (currentScope.trxParam) {
                  context.report({
                    node: node,
                    message: `Query executed on a different connection instead of transaction parameter '${currentScope.trxParam}'. This will use a separate connection and bypass the transaction.`,
                  });
                }
                break;
              }
              depth++;
            }
          }
        }
      },
    };
  },
};

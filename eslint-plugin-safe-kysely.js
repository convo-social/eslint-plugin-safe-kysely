const enforceWhereClauseRule = require("./enforce-where-clause");
const noNestedTransactionsRule = require("./no-nested-transactions");

const plugin = {
  rules: {
    "enforce-where-clause": enforceWhereClauseRule,
    "no-nested-transactions": noNestedTransactionsRule,
  },
};

module.exports = plugin;

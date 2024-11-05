const enforceWhereClauseRule = require("./enforce-where-clause");
const plugin = { rules: { "enforce-where-clause": enforceWhereClauseRule } };
module.exports = plugin;

# eslint-plugin-safe-kysely

eslint-plugin-safe-kysely is an ESLint plugin designed to enhance the safety of database operations in applications using Kysely. It ensures that any call chain containing updateTable or deleteFrom includes a where clause to prevent unintentional data modification or deletion of entire tables.

## Installation
1.	Install ESLint (if not already installed):
    
```bash
npm install eslint --save-dev
```    
2.	Install eslint-plugin-safe-kysely:

```bash
npm install eslint-plugin-safe-kysely --save-dev
```

## Usage
Add eslint-plugin-safe-kysely to your ESLint configuration:
```json
{
  "plugins": ["safe-kysely"],
  "rules": {
    "safe-kysely/enforce-where-clause": "error"
  }
}
```

## Rule: enforce-where-clause
This rule ensures that any updateTable or deleteFrom method calls are followed by a where clause in the call chain. This helps prevent unintended updates or deletions of all rows in a table.

### Example Code

#### Invalid
The following examples will trigger the enforce-where-clause rule:
```javascript
// Missing `where` clause with updateTable
x.updateTable("table").execute();

// Missing `where` clause with deleteFrom
x.deleteFrom("table").execute();

// Missing `where` in an async function
async function a(trx) {
  return await trx.updateTable("table").executeFirstOrThrow();
}
```

#### Valid
The following examples pass the enforce-where-clause rule:

```javascript
// Correct usage with where clause
trx.updateTable("table").set({ foo: bar }).where("something", "=", something).executeFirstOrThrow();

x.updateTable("table").where({ foo: "bar" }).execute();

async function b(trx) {
  await trx.updateTable("table").where({ foo: bar }).executeFirstOrThrow();
}
```
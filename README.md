# eslint-plugin-safe-kysely

eslint-plugin-safe-kysely is an ESLint plugin designed to enhance the safety of database operations in applications using Kysely. It provides rules to:
- Ensure that any call chain containing `updateTable` or `deleteFrom` includes a `where` clause to prevent unintentional data modification or deletion of entire tables
- Prevent nested transactions and separate connection usage inside transactions, which can cause deadlocks or bypass transaction isolation

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
    "safe-kysely/enforce-where-clause": "error",
    "safe-kysely/no-nested-transactions": "error"
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

## Rule: no-nested-transactions
This rule prevents two common transaction anti-patterns that can cause deadlocks or bypass transaction isolation:
1. **Nested transactions** - Starting a new transaction inside an existing transaction callback
2. **Separate connection usage** - Executing queries on a different Kysely instance instead of using the transaction parameter

### Example Code

#### Invalid
The following examples will trigger the no-nested-transactions rule:

```javascript
// Nested transaction - can cause deadlocks
async function nestedTransaction() {
  await db.transaction().execute(async (trx) => {
    await trx.updateTable("users").set({ name: "John" }).where("id", "=", 1).execute();

    // Error: Nested transaction detected
    await db.transaction().execute(async (trx2) => {
      await trx2.insertInto("logs").values({ message: "Updated" }).execute();
    });
  });
}

// Using separate connection - bypasses transaction
async function separateConnection() {
  await db.transaction().execute(async (trx) => {
    // Error: Query executed on 'db' instead of transaction parameter 'trx'
    await db.updateTable("users").set({ name: "John" }).where("id", "=", 1).execute();
  });
}

// Using this.db - bypasses transaction
async function thisConnection() {
  await this.kyselyDatabase.transaction().execute(async (trx) => {
    // Error: Query executed on 'this.kyselyDatabase' instead of 'trx'
    await this.kyselyDatabase.selectFrom("users").execute();
  });
}
```

#### Valid
The following examples pass the no-nested-transactions rule:

```javascript
// Correct usage - all queries use the transaction parameter
async function correctTransactionUsage() {
  await db.transaction().execute(async (trx) => {
    await trx.updateTable("users").set({ name: "John" }).where("id", "=", 1).execute();
    await trx.insertInto("logs").values({ message: "Updated" }).execute();
    await trx.selectFrom("users").where("id", "=", 1).execute();
  });
}
```
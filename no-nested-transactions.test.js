const { RuleTester } = require("eslint");
const rule = require("./no-nested-transactions");

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
});

ruleTester.run(
  "no-nested-transactions",
  rule,
  {
    valid: [
      {
        code: `
          async function updateUser() {
            await db.transaction().execute(async (trx) => {
              await trx.updateTable('users').set({ name: 'John' }).where('id', '=', 1).execute();
            });
          }
        `,
      },
      {
        code: `
          async function complexTransaction() {
            await db.transaction().execute(async (trx) => {
              await trx.insertInto('users').values({ name: 'Jane' }).execute();
              await trx.updateTable('accounts').set({ balance: 100 }).where('userId', '=', 1).execute();
            });
          }
        `,
      },
      {
        code: `
          // Not in a transaction context
          await db.selectFrom('users').execute();
        `,
      },
    ],
    invalid: [
      {
        code: `
          async function nestedTransaction() {
            await db.transaction().execute(async (trx) => {
              await trx.updateTable('users').set({ name: 'John' }).where('id', '=', 1).execute();
              await db.transaction().execute(async (trx2) => {
                await trx2.insertInto('logs').values({ message: 'Updated' }).execute();
              });
            });
          }
        `,
        errors: [
          {
            message: "Query executed on 'db' instead of transaction parameter 'trx'. This will use a separate connection from the pool and bypass the transaction.",
          },
          {
            message: "Nested transaction detected. Using .transaction() inside a transaction can cause deadlocks or unexpected behavior.",
          },
        ],
      },
      {
        code: `
          async function separateConnection() {
            await db.transaction().execute(async (trx) => {
              await db.updateTable('users').set({ name: 'John' }).where('id', '=', 1).execute();
            });
          }
        `,
        errors: [
          {
            message: "Query executed on 'db' instead of transaction parameter 'trx'. This will use a separate connection from the pool and bypass the transaction.",
          },
        ],
      },
      {
        code: `
          async function multipleSeparateConnections() {
            await db.transaction().execute(async (trx) => {
              await trx.updateTable('users').set({ name: 'John' }).where('id', '=', 1).execute();
              await db.selectFrom('users').execute();
              await db.insertInto('logs').values({ message: 'test' }).execute();
            });
          }
        `,
        errors: [
          {
            message: "Query executed on 'db' instead of transaction parameter 'trx'. This will use a separate connection from the pool and bypass the transaction.",
          },
          {
            message: "Query executed on 'db' instead of transaction parameter 'trx'. This will use a separate connection from the pool and bypass the transaction.",
          },
        ],
      },
    ],
  }
);

console.log("All tests passed!");

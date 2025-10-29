// enforce-where-clause

// FAILS
x.updateTable("table").execute();

x.deleteFrom("table").execute();

async function a(trx) {
  return await trx.updateTable("table").executeFirstOrThrow();
}
async function d(trx) {
  return await trx.deleteFrom("table").executeFirstOrThrow();
}

async function c() {
  await this.kyselyDatabase.transaction().execute(async (trx) => {
    await trx
      .updateTable("table")
      .set({
        value: "value",
      })
      .executeTakeFirstOrThrow();
  });
}

// PASSES
trx.updateTable("table").set({ foo: bar }).where("something", "=", something).executeFirstOrThrow();

x.updateTable("table").where({ foo: "bar" }).execute();

x.updateTable("").where();

async function b(trx) {
  await trx.updateTable("table").where({ foo: bar }).executeFirstOrThrow();
}

trx.updateTable("table").set({ foo: bar }).where("something", "=", something).execute();

async function c() {
  await this.kyselyDatabase.transaction().execute(async (trx) => {
    await trx
      .updateTable("table")
      .where({ foo: "bar" })
      .set({
        value: "value",
      })
      .executeTakeFirstOrThrow();
  });
}

// no-nested-transactions

// FAILS
async function nestedTransactionBad() {
  await db.transaction().execute(async (trx) => {
    await trx.updateTable("users").set({ name: "John" }).where("id", "=", 1).execute();
    await db.transaction().execute(async (trx2) => {
      await trx2.insertInto("logs").values({ message: "Updated" }).execute();
    });
  });
}

async function separateConnectionBad() {
  await db.transaction().execute(async (trx) => {
    await db.updateTable("users").set({ name: "John" }).where("id", "=", 1).execute();
  });
}

// PASSES
async function correctTransactionUsage() {
  await db.transaction().execute(async (trx) => {
    await trx.updateTable("users").set({ name: "John" }).where("id", "=", 1).execute();
    await trx.insertInto("logs").values({ message: "Updated" }).execute();
  });
}

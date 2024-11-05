// Fails
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

// Passes
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

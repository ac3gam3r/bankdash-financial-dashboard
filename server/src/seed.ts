// /server/src/seed.ts
import { eq } from "drizzle-orm";
import "dotenv/config";
import path from "path";
import { db, schema } from "./db";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { hashPassword } from "./auth";

async function main() {
  // 1) Ensure tables exist
  await migrate(db, {
    migrationsFolder: path.resolve(__dirname, "../drizzle"),
  });

  // 2) Clean tables in FK-safe order
  await db.delete(schema.transactions).run();
  await db.delete(schema.accounts).run();
  if (schema.bonuses) {
    await db.delete(schema.bonuses).run();
  }
  await db.delete(schema.categories).run();
  await db.delete(schema.users).run();

 // 3) Seed user
const passwordHash = await hashPassword("secret123");

await db.insert(schema.users).values({
  email: "demo@bankdash.app",
  passwordHash,
}).run();

const user = await db
  .select()
  .from(schema.users)
  .where(eq(schema.users.email, "demo@bankdash.app"))
  .get();


  // 4) Seed categories
  const catRows = [
    { name: "Groceries", type: "expense" },
    { name: "Dining",    type: "expense" },
    { name: "Utilities", type: "expense" },
    { name: "Income",    type: "income"  },
    { name: "Transfer",  type: "transfer"},
  ];
  await db.insert(schema.categories).values(catRows).run();

  const categories = await db.select().from(schema.categories).all();

  // 5) Seed accounts (example starter data)
  const acctRows = [
    { name: "Checking", type: "bank",   balance: 1500 },
    { name: "Savings",  type: "bank",   balance: 5000 },
    { name: "Visa",     type: "credit", balance: -200 },
  ];
  await db.insert(schema.accounts).values(acctRows).run();

  const accounts = await db.select().from(schema.accounts).all();

// 6) Seed a sample transaction
const groceriesCat = categories.find(c => c.name === "Groceries");
const checkingAcct = accounts.find(a => a.name === "Checking");
if (groceriesCat && checkingAcct) {
  await db.insert(schema.transactions).values({
    accountId: checkingAcct.id,
    categoryId: groceriesCat.id,
    description: "Milk & veggies",
    amount: -42.35,
    date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
    notes: "seeded",
  }).run();
}


  console.log("Seed complete. demo@bankdash.app / secret123");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

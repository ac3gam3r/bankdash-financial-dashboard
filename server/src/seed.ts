import "dotenv/config";
import { db, schema } from "./db";
import { eq } from "drizzle-orm";
import { hashPassword } from "./auth";

async function main() {
  await db.delete(schema.transactions).run();
  await db.delete(schema.accounts).run();
  await db.delete(schema.bonuses).run();
  await db.delete(schema.categories).run();
  await db.delete(schema.users).run();

  // user
  const passwordHash = await hashPassword("secret123");
  const [user] = await db.insert(schema.users).values({ email: "demo@bankdash.app", passwordHash }).returning();

  // categories
  const cats = await db.insert(schema.categories).values([
    { name: "Groceries", type: "expense" },
    { name: "Dining", type: "expense" },
    { name: "Utilities", type: "expense" },
    { name: "Income", type: "income" },
    { name: "Transfer", type: "transfer" },
  ]).returning();

  const [accChecking] = await db.insert(schema.accounts).values([
    { name: "Checking 1232", type: "checking", last4: "1232", balance: 2000, institution: "Your Bank" },
    { name: "BSB Savings", type: "savings", last4: "1100", balance: 15100, institution: "Buckeye State Bank" },
    { name: "Freedom Unlimited", type: "credit", last4: "9429", balance: -300, institution: "Chase" },
  ]).returning();

  const cat = (name: string) => cats.find(c => c.name === name)!.id;

  await db.insert(schema.transactions).values([
    { accountId: accChecking.id, date: "2025-09-05", description: "Kroger", amount: -43.04, categoryId: cat("Groceries") },
    { accountId: accChecking.id, date: "2025-09-04", description: "Subway (Google Pay)", amount: -10.71, categoryId: cat("Dining") },
    { accountId: accChecking.id, date: "2025-09-03", description: "Utility Bill", amount: -120.25, categoryId: cat("Utilities") },
    { accountId: accChecking.id, date: "2025-09-02", description: "Amex Send: Add Money", amount: 500.00, categoryId: cat("Transfer") },
    { accountId: accChecking.id, date: "2025-09-01", description: "Paycheck", amount: 2500.00, categoryId: cat("Income") },
  ]);

  await db.insert(schema.bonuses).values([
    { bank: "Capital One", title: "Checking $300", amount: 300, status: "active", openedAt: "2025-08-14" },
    { bank: "Buckeye State Bank", title: "14% APY promo", amount: 0, status: "active", notes: "90-day promo, lock-in 180d" },
    { bank: "Connexus", title: "$300 Checking", amount: 300, status: "planning" },
  ]);

  console.log("Seed complete. demo@bankdash.app / secret123");
}
main();

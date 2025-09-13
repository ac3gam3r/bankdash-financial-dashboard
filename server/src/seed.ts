import "dotenv/config";
import { db, schema } from "./db";
import { eq } from "drizzle-orm";

async function main() {
  // clear
  await db.delete(schema.transactions).run();
  await db.delete(schema.accounts).run();
  await db.delete(schema.bonuses).run();

  // accounts
  const accs = await db.insert(schema.accounts).values([
    { name: "BSB Savings", type: "savings", last4: "1100", balance: 15100 },
    { name: "Capital One Savings", type: "savings", last4: "2200", balance: 25208 },
    { name: "Checking 1232", type: "checking", last4: "1232", balance: 2000 },
    { name: "Freedom Unlimited", type: "credit", last4: "9429", balance: -300 },
    { name: "Brokerage", type: "investment", last4: "7777", balance: 105200 },
  ]).returning();

  const checkingId = accs.find(a => a.name.includes("Checking"))!.id;

  // recent transactions
  await db.insert(schema.transactions).values([
    { accountId: checkingId, date: "2025-09-05", description: "Kroger", amount: -43.04, category: "Groceries" },
    { accountId: checkingId, date: "2025-09-04", description: "Subway (Google Pay)", amount: -10.71, category: "Dining" },
    { accountId: checkingId, date: "2025-09-03", description: "Amex Send: Add Money", amount: 500.00, category: "Transfer" },
    { accountId: checkingId, date: "2025-09-02", description: "Utility Bill", amount: -120.25, category: "Utilities" },
    { accountId: checkingId, date: "2025-09-01", description: "Paycheck", amount: 2500.00, category: "Income" },
  ]);

  await db.insert(schema.bonuses).values([
    { bank: "Capital One", title: "Checking $300", amount: 300, status: "active" },
    { bank: "Buckeye State Bank", title: "14% APY promo", amount: 0, status: "active" },
    { bank: "Connexus", title: "$300 Checking", amount: 300, status: "planning" },
  ]);

  console.log("Seed complete.");
}

main();

import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const accounts = sqliteTable("accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type").notNull(), // checking, savings, credit, investment
  last4: text("last4"),
  balance: real("balance").notNull().default(0),
});

export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull().references(() => accounts.id),
  date: text("date").notNull(), // ISO string
  description: text("description").notNull(),
  amount: real("amount").notNull(), // negative = debit, positive = credit
  category: text("category").default("Uncategorized"),
});

export const bonuses = sqliteTable("bonuses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  bank: text("bank").notNull(),
  title: text("title").notNull(),
  amount: real("amount").notNull(),
  status: text("status").notNull().default("planning") // planning|active|earned
});

// (optional) relations if needed later
export const accountsRelations = relations(accounts, ({ many }) => ({
  transactions: many(transactions),
}));

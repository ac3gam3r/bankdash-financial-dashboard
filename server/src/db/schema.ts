import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at").notNull().default(() => new Date().toISOString()),
});

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  type: text("type").notNull().default("expense"), // income | expense | transfer
});

export const accounts = sqliteTable("accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type").notNull(), // checking, savings, credit, investment
  last4: text("last4"),
  balance: real("balance").notNull().default(0),
  institution: text("institution"),
});

export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull().references(() => accounts.id),
  date: text("date").notNull(), // ISO date string
  description: text("description").notNull(),
  amount: real("amount").notNull(), // negative=debit
  categoryId: integer("category_id").references(() => categories.id),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(() => new Date().toISOString()),
});

export const recurringRules = sqliteTable("recurring_rules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  pattern: text("pattern").notNull(),  // e.g., /Kroger/i
  categoryId: integer("category_id").references(() => categories.id),
  type: text("type").notNull().default("contains"), // contains|regex
});

export const bonuses = sqliteTable("bonuses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  bank: text("bank").notNull(),
  title: text("title").notNull(),
  amount: real("amount").notNull().default(0),
  status: text("status").notNull().default("planning"), // planning|active|earned
  openedAt: text("opened_at"),
  deadline: text("deadline"),
  notes: text("notes"),
});

// relations (optional)
export const accountsRelations = relations(accounts, ({ many }) => ({
  transactions: many(transactions),
}));

import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  varchar,
  decimal,
  timestamp,
  integer,
  boolean,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enhanced accounts table with comprehensive credit card and banking features
export const accounts = pgTable("accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  accountName: text("account_name").notNull(),
  accountType: text("account_type").notNull(), // checking, savings, credit, investment, loan
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull(),
  bankName: text("bank_name").notNull(),
  // Note: Account and routing numbers removed for security - never store sensitive banking data unencrypted
  
  // Credit card specific fields
  creditLimit: decimal("credit_limit", { precision: 12, scale: 2 }),
  availableCredit: decimal("available_credit", { precision: 12, scale: 2 }),
  minimumPayment: decimal("minimum_payment", { precision: 10, scale: 2 }),
  statementBalance: decimal("statement_balance", { precision: 12, scale: 2 }),
  paymentDueDate: date("payment_due_date"),
  annualFee: decimal("annual_fee", { precision: 8, scale: 2 }).default('0'),
  interestRate: decimal("interest_rate", { precision: 5, scale: 4 }), // APR as decimal
  
  // Rewards program
  rewardRate: decimal("reward_rate", { precision: 5, scale: 4 }), // Base reward rate
  rewardType: text("reward_type"), // cashback, points, miles
  totalRewards: decimal("total_rewards", { precision: 10, scale: 2 }).default('0'),
  rewardsValue: decimal("rewards_value", { precision: 10, scale: 2 }).default('0'), // Cash value of rewards
  
  // Account status and metadata
  isActive: boolean("is_active").default(true),
  openedDate: date("opened_date"),
  closedDate: date("closed_date"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enhanced transactions table with comprehensive tracking
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description").notNull(),
  merchantName: text("merchant_name"),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  date: timestamp("date").notNull(),
  type: text("type").notNull(), // debit, credit, transfer, fee
  
  // Rewards and cashback tracking
  rewardsEarned: decimal("rewards_earned", { precision: 8, scale: 2 }).default('0'),
  rewardCategory: text("reward_category"), // Category for bonus rewards (e.g., "dining", "gas")
  bonusRewardRate: decimal("bonus_reward_rate", { precision: 5, scale: 4 }), // Special category rate
  
  // Travel and location tracking
  location: text("location"), // City, state or country
  isTravel: boolean("is_travel").default(false),
  tripId: varchar("trip_id"), // Link to trips table
  
  // Transaction metadata
  isRecurring: boolean("is_recurring").default(false),
  recurringPaymentId: varchar("recurring_payment_id"), // Link to recurring payments
  referenceNumber: text("reference_number"),
  checkNumber: text("check_number"),
  
  // Tax and business tracking
  isTaxDeductible: boolean("is_tax_deductible").default(false),
  isBusinessExpense: boolean("is_business_expense").default(false),
  taxCategory: text("tax_category"),
  
  // Transaction status
  status: text("status").default('posted'), // pending, posted, canceled
  isPending: boolean("is_pending").default(false),
  
  tags: text("tags").array(), // Custom tags for organization
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enhanced categories with more attributes
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"), // Allow user-specific categories
  name: text("name").notNull(),
  parentCategoryId: varchar("parent_category_id"), // For subcategories
  color: text("color").notNull(),
  icon: text("icon").notNull(),
  description: text("description"),
  
  // Category behavior
  isDefault: boolean("is_default").default(false), // System default categories
  isTaxDeductible: boolean("is_tax_deductible").default(false),
  isBusinessCategory: boolean("is_business_category").default(false),
  
  // Budget tracking
  monthlyBudget: decimal("monthly_budget", { precision: 10, scale: 2 }),
  
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Credit score tracking for manual monthly entries
export const creditScores = pgTable("credit_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  score: integer("score").notNull(), // FICO score
  bureau: text("bureau").notNull(), // Experian, Equifax, TransUnion
  scoreType: text("score_type").default('FICO 8'), // FICO 8, VantageScore, etc.
  reportDate: date("report_date").notNull(),
  
  // Additional score details
  creditUtilization: decimal("credit_utilization", { precision: 5, scale: 2 }), // Percentage
  accountsOpen: integer("accounts_open"),
  accountsClosed: integer("accounts_closed"),
  hardInquiries: integer("hard_inquiries"),
  avgAccountAge: decimal("avg_account_age", { precision: 5, scale: 2 }), // Years
  
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bank bonuses tracking for tax reporting
export const bankBonuses = pgTable("bank_bonuses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  accountId: varchar("account_id"), // Link to account if applicable
  bankName: text("bank_name").notNull(),
  bonusAmount: decimal("bonus_amount", { precision: 10, scale: 2 }).notNull(),
  bonusType: text("bonus_type").notNull(), // signup, referral, promotion
  
  // Requirements tracking
  requirementsMet: boolean("requirements_met").default(false),
  requirementsDescription: text("requirements_description"),
  
  // Important dates
  signupDate: date("signup_date"),
  bonusReceivedDate: date("bonus_received_date"),
  requirementsDeadline: date("requirements_deadline"),
  
  // Tax information
  taxYear: integer("tax_year"),
  form1099Received: boolean("form_1099_received").default(false),
  taxableAmount: decimal("taxable_amount", { precision: 10, scale: 2 }),
  
  status: text("status").default('pending'), // pending, earned, received, expired
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Credit card signup bonuses tracking
export const creditCardBonuses = pgTable("credit_card_bonuses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  accountId: varchar("account_id"), // Link to credit card account
  cardName: text("card_name").notNull(),
  bankName: text("bank_name").notNull(),
  
  // Bonus details
  bonusAmount: decimal("bonus_amount", { precision: 10, scale: 2 }).notNull(),
  bonusType: text("bonus_type").notNull(), // points, miles, cashback
  bonusValue: decimal("bonus_value", { precision: 10, scale: 2 }), // Cash equivalent
  
  // Requirements
  spendRequirement: decimal("spend_requirement", { precision: 10, scale: 2 }),
  timeFrameMonths: integer("time_frame_months"),
  currentSpend: decimal("current_spend", { precision: 10, scale: 2 }).default('0'),
  requirementsMet: boolean("requirements_met").default(false),
  
  // Important dates
  applicationDate: date("application_date"),
  approvalDate: date("approval_date"),
  spendDeadline: date("spend_deadline"),
  bonusReceivedDate: date("bonus_received_date"),
  
  // Annual fee tracking
  annualFee: decimal("annual_fee", { precision: 8, scale: 2 }).default('0'),
  feeWaivedFirstYear: boolean("fee_waived_first_year").default(false),
  
  status: text("status").default('pending'), // pending, earned, received, expired
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Recurring payments and subscriptions tracking
export const recurringPayments = pgTable("recurring_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  accountId: varchar("account_id"), // Account used for payment
  
  name: text("name").notNull(), // Service name
  description: text("description"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default('USD'),
  
  // Frequency details
  frequency: text("frequency").notNull(), // monthly, yearly, weekly, quarterly
  dayOfMonth: integer("day_of_month"), // For monthly payments
  
  // Dates
  startDate: date("start_date").notNull(),
  endDate: date("end_date"), // For fixed-term subscriptions
  nextPaymentDate: date("next_payment_date"),
  lastPaymentDate: date("last_payment_date"),
  
  // Service details
  category: text("category").notNull(), // streaming, utilities, insurance, etc.
  website: text("website"),
  customerServicePhone: text("customer_service_phone"),
  
  // Status and tracking
  isActive: boolean("is_active").default(true),
  isPaused: boolean("is_paused").default(false),
  reminderEnabled: boolean("reminder_enabled").default(true),
  reminderDaysBefore: integer("reminder_days_before").default(3),
  
  // Annual review
  lastReviewDate: date("last_review_date"),
  annualCost: decimal("annual_cost", { precision: 10, scale: 2 }),
  
  notes: text("notes"),
  tags: text("tags").array(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Travel trips and expense tracking
export const trips = pgTable("trips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  
  name: text("name").notNull(),
  destination: text("destination").notNull(),
  description: text("description"),
  
  // Trip dates
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  
  // Trip details
  purpose: text("purpose"), // business, personal, mixed
  isBusinessTrip: boolean("is_business_trip").default(false),
  
  // Budget tracking
  budgetAmount: decimal("budget_amount", { precision: 10, scale: 2 }),
  totalExpenses: decimal("total_expenses", { precision: 10, scale: 2 }).default('0'),
  
  // Companions
  travelers: text("travelers").array(), // Names of people on trip
  
  status: text("status").default('planned'), // planned, active, completed, canceled
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reward redemptions tracking
export const rewardRedemptions = pgTable("reward_redemptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  accountId: varchar("account_id").notNull(),
  
  rewardType: text("reward_type").notNull(), // cashback, points, miles
  amountRedeemed: decimal("amount_redeemed", { precision: 10, scale: 2 }).notNull(),
  cashValue: decimal("cash_value", { precision: 10, scale: 2 }).notNull(),
  redemptionMethod: text("redemption_method"), // statement_credit, direct_deposit, gift_card, travel
  
  redemptionDate: date("redemption_date").notNull(),
  description: text("description"),
  
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas for validation
export const upsertUserSchema = createInsertSchema(users);
export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  date: z.coerce.date(), // Accept ISO strings and convert to Date objects
});
export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertCreditScoreSchema = createInsertSchema(creditScores).omit({
  id: true,
  createdAt: true,
});
export const insertBankBonusSchema = createInsertSchema(bankBonuses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertCreditCardBonusSchema = createInsertSchema(creditCardBonuses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertRecurringPaymentSchema = createInsertSchema(recurringPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertTripSchema = createInsertSchema(trips).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertRewardRedemptionSchema = createInsertSchema(rewardRedemptions).omit({
  id: true,
  createdAt: true,
});

// TypeScript types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type CreditScore = typeof creditScores.$inferSelect;
export type InsertCreditScore = z.infer<typeof insertCreditScoreSchema>;
export type BankBonus = typeof bankBonuses.$inferSelect;
export type InsertBankBonus = z.infer<typeof insertBankBonusSchema>;
export type CreditCardBonus = typeof creditCardBonuses.$inferSelect;
export type InsertCreditCardBonus = z.infer<typeof insertCreditCardBonusSchema>;
export type RecurringPayment = typeof recurringPayments.$inferSelect;
export type InsertRecurringPayment = z.infer<typeof insertRecurringPaymentSchema>;
export type Trip = typeof trips.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type RewardRedemption = typeof rewardRedemptions.$inferSelect;
export type InsertRewardRedemption = z.infer<typeof insertRewardRedemptionSchema>;

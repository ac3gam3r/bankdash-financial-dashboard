import {
  users,
  accounts,
  transactions,
  categories,
  creditScores,
  bankBonuses,
  creditCardBonuses,
  recurringPayments,
  trips,
  rewardRedemptions,
  type User,
  type UpsertUser,
  type Account,
  type InsertAccount,
  type Transaction,
  type InsertTransaction,
  type Category,
  type InsertCategory,
  type CreditScore,
  type InsertCreditScore,
  type BankBonus,
  type InsertBankBonus,
  type CreditCardBonus,
  type InsertCreditCardBonus,
  type RecurringPayment,
  type InsertRecurringPayment,
  type Trip,
  type InsertTrip,
  type RewardRedemption,
  type InsertRewardRedemption,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, gte, lte, sql } from "drizzle-orm";

// Comprehensive storage interface for financial dashboard
export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Account operations
  getUserAccounts(userId: string): Promise<Account[]>;
  getAccount(accountId: string): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(accountId: string, updates: Partial<InsertAccount>): Promise<Account>;
  deleteAccount(accountId: string): Promise<boolean>;
  
  // Transaction operations
  getAccountTransactions(accountId: string, limit?: number, offset?: number): Promise<Transaction[]>;
  getUserTransactions(userId: string, limit?: number, offset?: number): Promise<Transaction[]>;
  getTransactionsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Transaction[]>;
  getTransactionsByCategory(userId: string, category: string): Promise<Transaction[]>;
  getTransaction(transactionId: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(transactionId: string, updates: Partial<InsertTransaction>): Promise<Transaction>;
  deleteTransaction(transactionId: string): Promise<boolean>;
  
  // Category operations
  getUserCategories(userId?: string): Promise<Category[]>; // null for system categories
  getCategory(categoryId: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(categoryId: string, updates: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(categoryId: string): Promise<boolean>;
  
  // Credit score operations
  getUserCreditScores(userId: string): Promise<CreditScore[]>;
  getLatestCreditScore(userId: string, bureau?: string): Promise<CreditScore | undefined>;
  createCreditScore(creditScore: InsertCreditScore): Promise<CreditScore>;
  updateCreditScore(creditScoreId: string, updates: Partial<InsertCreditScore>): Promise<CreditScore>;
  deleteCreditScore(creditScoreId: string): Promise<boolean>;
  
  // Bank bonus operations
  getUserBankBonuses(userId: string): Promise<BankBonus[]>;
  getBankBonus(bonusId: string): Promise<BankBonus | undefined>;
  createBankBonus(bonus: InsertBankBonus): Promise<BankBonus>;
  updateBankBonus(bonusId: string, updates: Partial<InsertBankBonus>): Promise<BankBonus>;
  deleteBankBonus(bonusId: string): Promise<boolean>;
  
  // Credit card bonus operations
  getUserCreditCardBonuses(userId: string): Promise<CreditCardBonus[]>;
  getCreditCardBonus(bonusId: string): Promise<CreditCardBonus | undefined>;
  createCreditCardBonus(bonus: InsertCreditCardBonus): Promise<CreditCardBonus>;
  updateCreditCardBonus(bonusId: string, updates: Partial<InsertCreditCardBonus>): Promise<CreditCardBonus>;
  deleteCreditCardBonus(bonusId: string): Promise<boolean>;
  
  // Recurring payment operations
  getUserRecurringPayments(userId: string): Promise<RecurringPayment[]>;
  getActiveRecurringPayments(userId: string): Promise<RecurringPayment[]>;
  getRecurringPayment(paymentId: string): Promise<RecurringPayment | undefined>;
  createRecurringPayment(payment: InsertRecurringPayment): Promise<RecurringPayment>;
  updateRecurringPayment(paymentId: string, updates: Partial<InsertRecurringPayment>): Promise<RecurringPayment>;
  deleteRecurringPayment(paymentId: string): Promise<boolean>;
  
  // Trip operations
  getUserTrips(userId: string): Promise<Trip[]>;
  getTrip(tripId: string): Promise<Trip | undefined>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTrip(tripId: string, updates: Partial<InsertTrip>): Promise<Trip>;
  deleteTrip(tripId: string): Promise<boolean>;
  
  // Reward redemption operations
  getUserRewardRedemptions(userId: string): Promise<RewardRedemption[]>;
  getAccountRewardRedemptions(accountId: string): Promise<RewardRedemption[]>;
  createRewardRedemption(redemption: InsertRewardRedemption): Promise<RewardRedemption>;
  
  // Analytics operations
  getUserTotalBalance(userId: string): Promise<number>;
  getUserMonthlySpending(userId: string, year: number, month: number): Promise<number>;
  getCategorySpending(userId: string, categoryName: string, startDate: Date, endDate: Date): Promise<number>;
  getUserTotalRewards(userId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Account operations
  async getUserAccounts(userId: string): Promise<Account[]> {
    return await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, userId))
      .orderBy(accounts.accountName);
  }

  async getAccount(accountId: string): Promise<Account | undefined> {
    const [account] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, accountId));
    return account;
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const [newAccount] = await db
      .insert(accounts)
      .values(account)
      .returning();
    return newAccount;
  }

  async updateAccount(accountId: string, updates: Partial<InsertAccount>): Promise<Account> {
    const [updatedAccount] = await db
      .update(accounts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(accounts.id, accountId))
      .returning();
    return updatedAccount;
  }

  async deleteAccount(accountId: string): Promise<boolean> {
    const result = await db
      .delete(accounts)
      .where(eq(accounts.id, accountId));
    return (result.rowCount || 0) > 0;
  }

  // Transaction operations
  async getAccountTransactions(accountId: string, limit = 100, offset = 0): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.accountId, accountId))
      .orderBy(desc(transactions.date))
      .limit(limit)
      .offset(offset);
  }

  async getUserTransactions(userId: string, limit = 100, offset = 0): Promise<Transaction[]> {
    return await db
      .select({
        id: transactions.id,
        accountId: transactions.accountId,
        amount: transactions.amount,
        description: transactions.description,
        merchantName: transactions.merchantName,
        category: transactions.category,
        subcategory: transactions.subcategory,
        date: transactions.date,
        type: transactions.type,
        rewardsEarned: transactions.rewardsEarned,
        rewardCategory: transactions.rewardCategory,
        bonusRewardRate: transactions.bonusRewardRate,
        location: transactions.location,
        isTravel: transactions.isTravel,
        tripId: transactions.tripId,
        isRecurring: transactions.isRecurring,
        recurringPaymentId: transactions.recurringPaymentId,
        referenceNumber: transactions.referenceNumber,
        checkNumber: transactions.checkNumber,
        isTaxDeductible: transactions.isTaxDeductible,
        isBusinessExpense: transactions.isBusinessExpense,
        taxCategory: transactions.taxCategory,
        status: transactions.status,
        isPending: transactions.isPending,
        tags: transactions.tags,
        notes: transactions.notes,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
      })
      .from(transactions)
      .innerJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(eq(accounts.userId, userId))
      .orderBy(desc(transactions.date))
      .limit(limit)
      .offset(offset);
  }

  async getTransactionsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Transaction[]> {
    return await db
      .select({
        id: transactions.id,
        accountId: transactions.accountId,
        amount: transactions.amount,
        description: transactions.description,
        merchantName: transactions.merchantName,
        category: transactions.category,
        subcategory: transactions.subcategory,
        date: transactions.date,
        type: transactions.type,
        rewardsEarned: transactions.rewardsEarned,
        rewardCategory: transactions.rewardCategory,
        bonusRewardRate: transactions.bonusRewardRate,
        location: transactions.location,
        isTravel: transactions.isTravel,
        tripId: transactions.tripId,
        isRecurring: transactions.isRecurring,
        recurringPaymentId: transactions.recurringPaymentId,
        referenceNumber: transactions.referenceNumber,
        checkNumber: transactions.checkNumber,
        isTaxDeductible: transactions.isTaxDeductible,
        isBusinessExpense: transactions.isBusinessExpense,
        taxCategory: transactions.taxCategory,
        status: transactions.status,
        isPending: transactions.isPending,
        tags: transactions.tags,
        notes: transactions.notes,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
      })
      .from(transactions)
      .innerJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(
        and(
          eq(accounts.userId, userId),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      )
      .orderBy(desc(transactions.date));
  }

  async getTransactionsByCategory(userId: string, category: string): Promise<Transaction[]> {
    return await db
      .select({
        id: transactions.id,
        accountId: transactions.accountId,
        amount: transactions.amount,
        description: transactions.description,
        merchantName: transactions.merchantName,
        category: transactions.category,
        subcategory: transactions.subcategory,
        date: transactions.date,
        type: transactions.type,
        rewardsEarned: transactions.rewardsEarned,
        rewardCategory: transactions.rewardCategory,
        bonusRewardRate: transactions.bonusRewardRate,
        location: transactions.location,
        isTravel: transactions.isTravel,
        tripId: transactions.tripId,
        isRecurring: transactions.isRecurring,
        recurringPaymentId: transactions.recurringPaymentId,
        referenceNumber: transactions.referenceNumber,
        checkNumber: transactions.checkNumber,
        isTaxDeductible: transactions.isTaxDeductible,
        isBusinessExpense: transactions.isBusinessExpense,
        taxCategory: transactions.taxCategory,
        status: transactions.status,
        isPending: transactions.isPending,
        tags: transactions.tags,
        notes: transactions.notes,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
      })
      .from(transactions)
      .innerJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(
        and(
          eq(accounts.userId, userId),
          eq(transactions.category, category)
        )
      )
      .orderBy(desc(transactions.date));
  }

  async getTransaction(transactionId: string): Promise<Transaction | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, transactionId));
    return transaction;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async updateTransaction(transactionId: string, updates: Partial<InsertTransaction>): Promise<Transaction> {
    const [updatedTransaction] = await db
      .update(transactions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(transactions.id, transactionId))
      .returning();
    return updatedTransaction;
  }

  async deleteTransaction(transactionId: string): Promise<boolean> {
    const result = await db
      .delete(transactions)
      .where(eq(transactions.id, transactionId));
    return (result.rowCount || 0) > 0;
  }

  // Category operations
  async getUserCategories(userId?: string): Promise<Category[]> {
    if (userId) {
      return await db
        .select()
        .from(categories)
        .where(eq(categories.userId, userId))
        .orderBy(categories.displayOrder, categories.name);
    } else {
      // Get system default categories
      return await db
        .select()
        .from(categories)
        .where(eq(categories.isDefault, true))
        .orderBy(categories.displayOrder, categories.name);
    }
  }

  async getCategory(categoryId: string): Promise<Category | undefined> {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values(category)
      .returning();
    return newCategory;
  }

  async updateCategory(categoryId: string, updates: Partial<InsertCategory>): Promise<Category> {
    const [updatedCategory] = await db
      .update(categories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(categories.id, categoryId))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(categoryId: string): Promise<boolean> {
    const result = await db
      .delete(categories)
      .where(eq(categories.id, categoryId));
    return (result.rowCount || 0) > 0;
  }

  // Credit score operations
  async getUserCreditScores(userId: string): Promise<CreditScore[]> {
    return await db
      .select()
      .from(creditScores)
      .where(eq(creditScores.userId, userId))
      .orderBy(desc(creditScores.reportDate));
  }

  async getLatestCreditScore(userId: string, bureau?: string): Promise<CreditScore | undefined> {
    if (bureau) {
      const [score] = await db
        .select()
        .from(creditScores)
        .where(and(eq(creditScores.userId, userId), eq(creditScores.bureau, bureau)))
        .orderBy(desc(creditScores.reportDate))
        .limit(1);
      return score;
    } else {
      const [score] = await db
        .select()
        .from(creditScores)
        .where(eq(creditScores.userId, userId))
        .orderBy(desc(creditScores.reportDate))
        .limit(1);
      return score;
    }
  }

  async createCreditScore(creditScore: InsertCreditScore): Promise<CreditScore> {
    const [newScore] = await db
      .insert(creditScores)
      .values(creditScore)
      .returning();
    return newScore;
  }

  async updateCreditScore(creditScoreId: string, updates: Partial<InsertCreditScore>): Promise<CreditScore> {
    const [updatedScore] = await db
      .update(creditScores)
      .set(updates)
      .where(eq(creditScores.id, creditScoreId))
      .returning();
    return updatedScore;
  }

  async deleteCreditScore(creditScoreId: string): Promise<boolean> {
    const result = await db
      .delete(creditScores)
      .where(eq(creditScores.id, creditScoreId));
    return (result.rowCount || 0) > 0;
  }

  // Bank bonus operations
  async getUserBankBonuses(userId: string): Promise<BankBonus[]> {
    return await db
      .select()
      .from(bankBonuses)
      .where(eq(bankBonuses.userId, userId))
      .orderBy(desc(bankBonuses.signupDate));
  }

  async getBankBonus(bonusId: string): Promise<BankBonus | undefined> {
    const [bonus] = await db
      .select()
      .from(bankBonuses)
      .where(eq(bankBonuses.id, bonusId));
    return bonus;
  }

  async createBankBonus(bonus: InsertBankBonus): Promise<BankBonus> {
    const [newBonus] = await db
      .insert(bankBonuses)
      .values(bonus)
      .returning();
    return newBonus;
  }

  async updateBankBonus(bonusId: string, updates: Partial<InsertBankBonus>): Promise<BankBonus> {
    const [updatedBonus] = await db
      .update(bankBonuses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(bankBonuses.id, bonusId))
      .returning();
    return updatedBonus;
  }

  async deleteBankBonus(bonusId: string): Promise<boolean> {
    const result = await db
      .delete(bankBonuses)
      .where(eq(bankBonuses.id, bonusId));
    return (result.rowCount || 0) > 0;
  }

  // Credit card bonus operations
  async getUserCreditCardBonuses(userId: string): Promise<CreditCardBonus[]> {
    return await db
      .select()
      .from(creditCardBonuses)
      .where(eq(creditCardBonuses.userId, userId))
      .orderBy(desc(creditCardBonuses.applicationDate));
  }

  async getCreditCardBonus(bonusId: string): Promise<CreditCardBonus | undefined> {
    const [bonus] = await db
      .select()
      .from(creditCardBonuses)
      .where(eq(creditCardBonuses.id, bonusId));
    return bonus;
  }

  async createCreditCardBonus(bonus: InsertCreditCardBonus): Promise<CreditCardBonus> {
    const [newBonus] = await db
      .insert(creditCardBonuses)
      .values(bonus)
      .returning();
    return newBonus;
  }

  async updateCreditCardBonus(bonusId: string, updates: Partial<InsertCreditCardBonus>): Promise<CreditCardBonus> {
    const [updatedBonus] = await db
      .update(creditCardBonuses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(creditCardBonuses.id, bonusId))
      .returning();
    return updatedBonus;
  }

  async deleteCreditCardBonus(bonusId: string): Promise<boolean> {
    const result = await db
      .delete(creditCardBonuses)
      .where(eq(creditCardBonuses.id, bonusId));
    return (result.rowCount || 0) > 0;
  }

  // Recurring payment operations
  async getUserRecurringPayments(userId: string): Promise<RecurringPayment[]> {
    return await db
      .select()
      .from(recurringPayments)
      .where(eq(recurringPayments.userId, userId))
      .orderBy(recurringPayments.name);
  }

  async getActiveRecurringPayments(userId: string): Promise<RecurringPayment[]> {
    return await db
      .select()
      .from(recurringPayments)
      .where(
        and(
          eq(recurringPayments.userId, userId),
          eq(recurringPayments.isActive, true)
        )
      )
      .orderBy(recurringPayments.nextPaymentDate);
  }

  async getRecurringPayment(paymentId: string): Promise<RecurringPayment | undefined> {
    const [payment] = await db
      .select()
      .from(recurringPayments)
      .where(eq(recurringPayments.id, paymentId));
    return payment;
  }

  async createRecurringPayment(payment: InsertRecurringPayment): Promise<RecurringPayment> {
    const [newPayment] = await db
      .insert(recurringPayments)
      .values(payment)
      .returning();
    return newPayment;
  }

  async updateRecurringPayment(paymentId: string, updates: Partial<InsertRecurringPayment>): Promise<RecurringPayment> {
    const [updatedPayment] = await db
      .update(recurringPayments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(recurringPayments.id, paymentId))
      .returning();
    return updatedPayment;
  }

  async deleteRecurringPayment(paymentId: string): Promise<boolean> {
    const result = await db
      .delete(recurringPayments)
      .where(eq(recurringPayments.id, paymentId));
    return (result.rowCount || 0) > 0;
  }

  // Trip operations
  async getUserTrips(userId: string): Promise<Trip[]> {
    return await db
      .select()
      .from(trips)
      .where(eq(trips.userId, userId))
      .orderBy(desc(trips.startDate));
  }

  async getTrip(tripId: string): Promise<Trip | undefined> {
    const [trip] = await db
      .select()
      .from(trips)
      .where(eq(trips.id, tripId));
    return trip;
  }

  async createTrip(trip: InsertTrip): Promise<Trip> {
    const [newTrip] = await db
      .insert(trips)
      .values(trip)
      .returning();
    return newTrip;
  }

  async updateTrip(tripId: string, updates: Partial<InsertTrip>): Promise<Trip> {
    const [updatedTrip] = await db
      .update(trips)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(trips.id, tripId))
      .returning();
    return updatedTrip;
  }

  async deleteTrip(tripId: string): Promise<boolean> {
    const result = await db
      .delete(trips)
      .where(eq(trips.id, tripId));
    return (result.rowCount || 0) > 0;
  }

  // Reward redemption operations
  async getUserRewardRedemptions(userId: string): Promise<RewardRedemption[]> {
    return await db
      .select()
      .from(rewardRedemptions)
      .where(eq(rewardRedemptions.userId, userId))
      .orderBy(desc(rewardRedemptions.redemptionDate));
  }

  async getAccountRewardRedemptions(accountId: string): Promise<RewardRedemption[]> {
    return await db
      .select()
      .from(rewardRedemptions)
      .where(eq(rewardRedemptions.accountId, accountId))
      .orderBy(desc(rewardRedemptions.redemptionDate));
  }

  async createRewardRedemption(redemption: InsertRewardRedemption): Promise<RewardRedemption> {
    const [newRedemption] = await db
      .insert(rewardRedemptions)
      .values(redemption)
      .returning();
    return newRedemption;
  }

  // Analytics operations
  async getUserTotalBalance(userId: string): Promise<number> {
    const result = await db
      .select({
        total: sql<number>`SUM(${accounts.balance})`
      })
      .from(accounts)
      .where(
        and(
          eq(accounts.userId, userId),
          eq(accounts.isActive, true)
        )
      );
    
    return result[0]?.total || 0;
  }

  async getUserMonthlySpending(userId: string, year: number, month: number): Promise<number> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const result = await db
      .select({
        total: sql<number>`SUM(ABS(${transactions.amount}))`
      })
      .from(transactions)
      .innerJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(
        and(
          eq(accounts.userId, userId),
          eq(transactions.type, 'debit'),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      );
    
    return result[0]?.total || 0;
  }

  async getCategorySpending(userId: string, categoryName: string, startDate: Date, endDate: Date): Promise<number> {
    const result = await db
      .select({
        total: sql<number>`SUM(ABS(${transactions.amount}))`
      })
      .from(transactions)
      .innerJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(
        and(
          eq(accounts.userId, userId),
          eq(transactions.category, categoryName),
          eq(transactions.type, 'debit'),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      );
    
    return result[0]?.total || 0;
  }

  async getUserTotalRewards(userId: string): Promise<number> {
    const result = await db
      .select({
        total: sql<number>`SUM(${accounts.totalRewards})`
      })
      .from(accounts)
      .where(
        and(
          eq(accounts.userId, userId),
          eq(accounts.isActive, true)
        )
      );
    
    return result[0]?.total || 0;
  }
}

export const storage = new DatabaseStorage();
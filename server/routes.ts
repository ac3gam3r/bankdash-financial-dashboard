import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertAccountSchema,
  insertTransactionSchema,
  insertCategorySchema,
  insertCreditScoreSchema,
  insertBankBonusSchema,
  insertCreditCardBonusSchema,
  insertRecurringPaymentSchema,
  insertTripSchema,
  insertRewardRedemptionSchema,
  insertBankConnectionSchema,
  insertBankProviderSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Protected API routes
  app.get("/api/accounts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accounts = await storage.getUserAccounts(userId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });

  app.get("/api/transactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      const transactions = await storage.getUserTransactions(userId, limit, offset);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get("/api/categories", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get both system default categories and user custom categories
      const [systemCategories, userCategories] = await Promise.all([
        storage.getUserCategories(), // No userId = system categories
        storage.getUserCategories(userId) // With userId = user categories
      ]);
      
      // Combine and return all categories (user categories can override system ones)
      const allCategories = [...systemCategories, ...userCategories];
      res.json(allCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get("/api/recurring-payments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const payments = await storage.getUserRecurringPayments(userId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching recurring payments:", error);
      res.status(500).json({ message: "Failed to fetch recurring payments" });
    }
  });

  app.get("/api/bank-bonuses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bonuses = await storage.getUserBankBonuses(userId);
      res.json(bonuses);
    } catch (error) {
      console.error("Error fetching bank bonuses:", error);
      res.status(500).json({ message: "Failed to fetch bank bonuses" });
    }
  });

  app.get("/api/credit-card-bonuses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bonuses = await storage.getUserCreditCardBonuses(userId);
      res.json(bonuses);
    } catch (error) {
      console.error("Error fetching credit card bonuses:", error);
      res.status(500).json({ message: "Failed to fetch credit card bonuses" });
    }
  });

  app.get("/api/trips", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const trips = await storage.getUserTrips(userId);
      res.json(trips);
    } catch (error) {
      console.error("Error fetching trips:", error);
      res.status(500).json({ message: "Failed to fetch trips" });
    }
  });

  // ==================== ACCOUNTS CRUD ROUTES ====================
  
  // Create account
  app.post("/api/accounts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accountData = insertAccountSchema.parse({ ...req.body, userId });
      const account = await storage.createAccount(accountData);
      res.status(201).json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid account data", errors: error.errors });
      }
      console.error("Error creating account:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // Update account
  app.patch("/api/accounts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const parsedData = insertAccountSchema.partial().parse(req.body);
      
      // CRITICAL SECURITY: Strip ownership fields to prevent tampering
      const { userId: _, ...updateData } = parsedData as any;
      
      // Use secure user-aware update method
      const account = await storage.updateUserAccount(userId, id, updateData);
      
      if (account) {
        res.json(account);
      } else {
        res.status(404).json({ message: "Account not found" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid account data", errors: error.errors });
      }
      console.error("Error updating account:", error);
      res.status(500).json({ message: "Failed to update account" });
    }
  });

  // Delete account
  app.delete("/api/accounts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Use secure user-aware delete method
      const success = await storage.deleteUserAccount(userId, id);
      
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Account not found" });
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // ==================== TRANSACTIONS CRUD ROUTES ====================
  
  // Create transaction
  app.post("/api/transactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactionData = insertTransactionSchema.parse(req.body);
      
      // CRITICAL SECURITY: Verify the accountId belongs to the authenticated user
      if (transactionData.accountId) {
        const account = await storage.getUserAccount(userId, transactionData.accountId);
        if (!account) {
          return res.status(404).json({ message: "Account not found" });
        }
      }
      
      const transaction = await storage.createTransaction(transactionData);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      }
      console.error("Error creating transaction:", error);
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  // Get transaction by ID
  app.get("/api/transactions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Use secure user-aware method to verify ownership
      const transaction = await storage.getUserTransaction(userId, id);
      
      if (transaction) {
        res.json(transaction);
      } else {
        res.status(404).json({ message: "Transaction not found" });
      }
    } catch (error) {
      console.error("Error fetching transaction:", error);
      res.status(500).json({ message: "Failed to fetch transaction" });
    }
  });

  // Update transaction
  app.patch("/api/transactions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const updateData = insertTransactionSchema.partial().parse(req.body);
      
      // CRITICAL SECURITY: Strip ownership fields to prevent tampering
      const { accountId: _, userId: __, ...safeUpdates } = updateData as any;
      
      // Use secure user-aware update method
      const transaction = await storage.updateUserTransaction(userId, id, safeUpdates);
      
      if (transaction) {
        res.json(transaction);
      } else {
        res.status(404).json({ message: "Transaction not found" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      }
      console.error("Error updating transaction:", error);
      res.status(500).json({ message: "Failed to update transaction" });
    }
  });

  // Delete transaction
  app.delete("/api/transactions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Use secure user-aware delete method
      const success = await storage.deleteUserTransaction(userId, id);
      
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Transaction not found" });
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      res.status(500).json({ message: "Failed to delete transaction" });
    }
  });

  // Get transactions by date range
  app.get("/api/transactions/range/:startDate/:endDate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { startDate, endDate } = req.params;
      const transactions = await storage.getTransactionsByDateRange(
        userId,
        new Date(startDate),
        new Date(endDate)
      );
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions by date range:", error);
      res.status(500).json({ message: "Failed to fetch transactions by date range" });
    }
  });

  // Get transactions by category
  app.get("/api/transactions/category/:category", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { category } = req.params;
      const transactions = await storage.getTransactionsByCategory(userId, category);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions by category:", error);
      res.status(500).json({ message: "Failed to fetch transactions by category" });
    }
  });

  // ==================== CATEGORIES CRUD ROUTES ====================
  
  // Create category
  app.post("/api/categories", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const categoryData = insertCategorySchema.parse({ ...req.body, userId });
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Update category
  app.patch("/api/categories/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const updateData = insertCategorySchema.partial().parse(req.body);
      
      // CRITICAL SECURITY: Strip ownership fields to prevent tampering
      const { userId: _, ...safeUpdates } = updateData as any;
      
      const category = await storage.updateUserCategory(userId, id, safeUpdates);
      if (category) {
        res.json(category);
      } else {
        res.status(404).json({ message: "Category not found" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  // Delete category
  app.delete("/api/categories/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const success = await storage.deleteUserCategory(userId, id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Category not found" });
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // ==================== CREDIT SCORES CRUD ROUTES ====================
  
  // Create credit score entry
  app.post("/api/credit-scores", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const creditScoreData = insertCreditScoreSchema.parse({ ...req.body, userId });
      const creditScore = await storage.createCreditScore(creditScoreData);
      res.status(201).json(creditScore);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid credit score data", errors: error.errors });
      }
      console.error("Error creating credit score:", error);
      res.status(500).json({ message: "Failed to create credit score" });
    }
  });

  // Get user's credit scores
  app.get("/api/credit-scores", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const creditScores = await storage.getUserCreditScores(userId);
      res.json(creditScores);
    } catch (error) {
      console.error("Error fetching credit scores:", error);
      res.status(500).json({ message: "Failed to fetch credit scores" });
    }
  });

  // Update credit score
  app.patch("/api/credit-scores/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const updateData = insertCreditScoreSchema.partial().parse(req.body);
      
      // CRITICAL SECURITY: Strip ownership fields to prevent tampering
      const { userId: _, ...safeUpdates } = updateData as any;
      
      const creditScore = await storage.updateUserCreditScore(userId, id, safeUpdates);
      if (creditScore) {
        res.json(creditScore);
      } else {
        res.status(404).json({ message: "Credit score not found" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid credit score data", errors: error.errors });
      }
      console.error("Error updating credit score:", error);
      res.status(500).json({ message: "Failed to update credit score" });
    }
  });

  // Delete credit score
  app.delete("/api/credit-scores/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const success = await storage.deleteUserCreditScore(userId, id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Credit score not found" });
      }
    } catch (error) {
      console.error("Error deleting credit score:", error);
      res.status(500).json({ message: "Failed to delete credit score" });
    }
  });

  // ==================== BANK BONUSES CRUD ROUTES ====================
  
  // Create bank bonus
  app.post("/api/bank-bonuses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bonusData = insertBankBonusSchema.parse({ ...req.body, userId });
      const bonus = await storage.createBankBonus(bonusData);
      res.status(201).json(bonus);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid bank bonus data", errors: error.errors });
      }
      console.error("Error creating bank bonus:", error);
      res.status(500).json({ message: "Failed to create bank bonus" });
    }
  });

  // Update bank bonus
  app.patch("/api/bank-bonuses/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const updateData = insertBankBonusSchema.partial().parse(req.body);
      
      // CRITICAL SECURITY: Strip ownership fields to prevent tampering
      const { userId: _, ...safeUpdates } = updateData as any;
      
      const bonus = await storage.updateUserBankBonus(userId, id, safeUpdates);
      if (bonus) {
        res.json(bonus);
      } else {
        res.status(404).json({ message: "Bank bonus not found" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid bank bonus data", errors: error.errors });
      }
      console.error("Error updating bank bonus:", error);
      res.status(500).json({ message: "Failed to update bank bonus" });
    }
  });

  // Delete bank bonus
  app.delete("/api/bank-bonuses/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const success = await storage.deleteUserBankBonus(userId, id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Bank bonus not found" });
      }
    } catch (error) {
      console.error("Error deleting bank bonus:", error);
      res.status(500).json({ message: "Failed to delete bank bonus" });
    }
  });

  // ==================== CREDIT CARD BONUSES CRUD ROUTES ====================
  
  // Create credit card bonus
  app.post("/api/credit-card-bonuses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bonusData = insertCreditCardBonusSchema.parse({ ...req.body, userId });
      const bonus = await storage.createCreditCardBonus(bonusData);
      res.status(201).json(bonus);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid credit card bonus data", errors: error.errors });
      }
      console.error("Error creating credit card bonus:", error);
      res.status(500).json({ message: "Failed to create credit card bonus" });
    }
  });

  // Update credit card bonus
  app.patch("/api/credit-card-bonuses/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const updateData = insertCreditCardBonusSchema.partial().parse(req.body);
      
      // CRITICAL SECURITY: Strip ownership fields to prevent tampering
      const { userId: _, ...safeUpdates } = updateData as any;
      
      const bonus = await storage.updateUserCreditCardBonus(userId, id, safeUpdates);
      if (bonus) {
        res.json(bonus);
      } else {
        res.status(404).json({ message: "Credit card bonus not found" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid credit card bonus data", errors: error.errors });
      }
      console.error("Error updating credit card bonus:", error);
      res.status(500).json({ message: "Failed to update credit card bonus" });
    }
  });

  // Delete credit card bonus
  app.delete("/api/credit-card-bonuses/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const success = await storage.deleteUserCreditCardBonus(userId, id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Credit card bonus not found" });
      }
    } catch (error) {
      console.error("Error deleting credit card bonus:", error);
      res.status(500).json({ message: "Failed to delete credit card bonus" });
    }
  });

  // ==================== RECURRING PAYMENTS CRUD ROUTES ====================
  
  // Create recurring payment
  app.post("/api/recurring-payments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const paymentData = insertRecurringPaymentSchema.parse({ ...req.body, userId });
      const payment = await storage.createRecurringPayment(paymentData);
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid recurring payment data", errors: error.errors });
      }
      console.error("Error creating recurring payment:", error);
      res.status(500).json({ message: "Failed to create recurring payment" });
    }
  });

  // Update recurring payment
  app.patch("/api/recurring-payments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const updateData = insertRecurringPaymentSchema.partial().parse(req.body);
      
      // CRITICAL SECURITY: Strip ownership fields to prevent tampering
      const { userId: _, accountId: __, ...safeUpdates } = updateData as any;
      
      const payment = await storage.updateUserRecurringPayment(userId, id, safeUpdates);
      if (payment) {
        res.json(payment);
      } else {
        res.status(404).json({ message: "Recurring payment not found" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid recurring payment data", errors: error.errors });
      }
      console.error("Error updating recurring payment:", error);
      res.status(500).json({ message: "Failed to update recurring payment" });
    }
  });

  // Delete recurring payment
  app.delete("/api/recurring-payments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const success = await storage.deleteUserRecurringPayment(userId, id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Recurring payment not found" });
      }
    } catch (error) {
      console.error("Error deleting recurring payment:", error);
      res.status(500).json({ message: "Failed to delete recurring payment" });
    }
  });

  // Get active recurring payments
  app.get("/api/recurring-payments/active", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const payments = await storage.getActiveRecurringPayments(userId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching active recurring payments:", error);
      res.status(500).json({ message: "Failed to fetch active recurring payments" });
    }
  });

  // ==================== TRIPS CRUD ROUTES ====================
  
  // Create trip
  app.post("/api/trips", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tripData = insertTripSchema.parse({ ...req.body, userId });
      const trip = await storage.createTrip(tripData);
      res.status(201).json(trip);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid trip data", errors: error.errors });
      }
      console.error("Error creating trip:", error);
      res.status(500).json({ message: "Failed to create trip" });
    }
  });

  // Update trip
  app.patch("/api/trips/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const updateData = insertTripSchema.partial().parse(req.body);
      
      // CRITICAL SECURITY: Strip ownership fields to prevent tampering
      const { userId: _, ...safeUpdates } = updateData as any;
      
      const trip = await storage.updateUserTrip(userId, id, safeUpdates);
      if (trip) {
        res.json(trip);
      } else {
        res.status(404).json({ message: "Trip not found" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid trip data", errors: error.errors });
      }
      console.error("Error updating trip:", error);
      res.status(500).json({ message: "Failed to update trip" });
    }
  });

  // Delete trip
  app.delete("/api/trips/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const success = await storage.deleteUserTrip(userId, id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Trip not found" });
      }
    } catch (error) {
      console.error("Error deleting trip:", error);
      res.status(500).json({ message: "Failed to delete trip" });
    }
  });

  // ==================== REWARD REDEMPTIONS ROUTES ====================
  
  // Create reward redemption
  app.post("/api/reward-redemptions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const redemptionData = insertRewardRedemptionSchema.parse({ ...req.body, userId });
      const redemption = await storage.createRewardRedemption(redemptionData);
      res.status(201).json(redemption);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid reward redemption data", errors: error.errors });
      }
      console.error("Error creating reward redemption:", error);
      res.status(500).json({ message: "Failed to create reward redemption" });
    }
  });

  // Get user's reward redemptions
  app.get("/api/reward-redemptions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const redemptions = await storage.getUserRewardRedemptions(userId);
      res.json(redemptions);
    } catch (error) {
      console.error("Error fetching reward redemptions:", error);
      res.status(500).json({ message: "Failed to fetch reward redemptions" });
    }
  });

  // Get reward redemptions for specific account
  app.get("/api/reward-redemptions/account/:accountId", isAuthenticated, async (req: any, res) => {
    try {
      const { accountId } = req.params;
      const redemptions = await storage.getAccountRewardRedemptions(accountId);
      res.json(redemptions);
    } catch (error) {
      console.error("Error fetching account reward redemptions:", error);
      res.status(500).json({ message: "Failed to fetch account reward redemptions" });
    }
  });

  // ==================== ANALYTICS ROUTES ====================
  
  // Get user's total balance across all accounts
  app.get("/api/analytics/total-balance", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const totalBalance = await storage.getUserTotalBalance(userId);
      res.json({ totalBalance });
    } catch (error) {
      console.error("Error fetching total balance:", error);
      res.status(500).json({ message: "Failed to fetch total balance" });
    }
  });

  // Get monthly spending for a specific month
  app.get("/api/analytics/monthly-spending/:year/:month", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { year, month } = req.params;
      const monthlySpending = await storage.getUserMonthlySpending(userId, parseInt(year), parseInt(month));
      res.json({ monthlySpending, year: parseInt(year), month: parseInt(month) });
    } catch (error) {
      console.error("Error fetching monthly spending:", error);
      res.status(500).json({ message: "Failed to fetch monthly spending" });
    }
  });

  // Get category spending for a date range
  app.get("/api/analytics/category-spending/:category/:startDate/:endDate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { category, startDate, endDate } = req.params;
      const categorySpending = await storage.getCategorySpending(
        userId,
        category,
        new Date(startDate),
        new Date(endDate)
      );
      res.json({ categorySpending, category, startDate, endDate });
    } catch (error) {
      console.error("Error fetching category spending:", error);
      res.status(500).json({ message: "Failed to fetch category spending" });
    }
  });

  // Get user's total rewards value
  app.get("/api/analytics/total-rewards", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const totalRewards = await storage.getUserTotalRewards(userId);
      res.json({ totalRewards });
    } catch (error) {
      console.error("Error fetching total rewards:", error);
      res.status(500).json({ message: "Failed to fetch total rewards" });
    }
  });

  // ==================== BANK CONNECTIONS ROUTES ====================

  // Get user's bank connections
  app.get("/api/bank-connections", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const connections = await storage.getUserBankConnections(userId);
      res.json(connections);
    } catch (error) {
      console.error("Error fetching bank connections:", error);
      res.status(500).json({ message: "Failed to fetch bank connections" });
    }
  });

  // Get available bank providers
  app.get("/api/bank-providers", isAuthenticated, async (req: any, res) => {
    try {
      const providers = await storage.getBankProviders();
      res.json(providers);
    } catch (error) {
      console.error("Error fetching bank providers:", error);
      res.status(500).json({ message: "Failed to fetch bank providers" });
    }
  });

  // Connect to a bank
  app.post("/api/bank-connections/connect", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate request body with zod
      const connectSchema = z.object({
        bankId: z.string().min(1, "Bank ID is required"),
        accountType: z.string().optional(),
        connectionMethod: z.enum(['manual', 'plaid', 'yodlee', 'api']).default('manual'),
      });
      
      const validatedData = connectSchema.parse(req.body);
      const { bankId, accountType, connectionMethod } = validatedData;

      // Get bank provider with proper validation
      const providers = await storage.getBankProviders();
      const provider = providers.find(p => p.id === bankId);
      
      if (!provider) {
        return res.status(404).json({ message: "Bank provider not found" });
      }

      // Validate account type is supported by this provider
      const selectedAccountType = accountType || provider.accountTypes[0];
      if (!provider.accountTypes.includes(selectedAccountType)) {
        return res.status(400).json({ 
          message: "Account type not supported by this provider",
          supportedTypes: provider.accountTypes
        });
      }

      // Create validated bank connection data
      const connectionData = insertBankConnectionSchema.parse({
        userId,
        bankName: provider.displayName || provider.name,
        accountType: selectedAccountType,
        accountNumber: Math.random().toString().slice(-4).padStart(4, '0'), // Mock last 4 digits
        isConnected: true,
        lastSync: new Date(),
        status: 'active',
        transactionCount: Math.floor(Math.random() * 100) + 10,
        connectionMethod,
        institutionId: bankId,
        autoSync: provider.supportsAutoSync || false,
        syncFrequency: 'daily',
        errorCount: 0
      });

      const connection = await storage.createBankConnection(connectionData);

      res.status(201).json({
        success: true,
        bankName: provider.displayName || provider.name,
        accountsConnected: 1,
        connection
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: error.errors 
        });
      }
      console.error("Error connecting bank:", error);
      res.status(500).json({ message: "Failed to connect bank" });
    }
  });

  // Sync transactions for a bank connection
  app.post("/api/bank-connections/:connectionId/sync", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate connection ID parameter
      const paramsSchema = z.object({
        connectionId: z.string().uuid("Invalid connection ID format")
      });
      
      const { connectionId } = paramsSchema.parse(req.params);

      // SECURITY FIX: Use user-scoped method to prevent IDOR
      const connection = await storage.getUserBankConnection(userId, connectionId);
      if (!connection) {
        return res.status(404).json({ message: "Bank connection not found" });
      }

      // Check if connection is active and supports sync
      if (!connection.isConnected || connection.status !== 'active') {
        return res.status(400).json({ 
          message: "Bank connection is not active",
          status: connection.status 
        });
      }

      // Simulate sync process with proper validation
      const newTransactions = Math.floor(Math.random() * 5) + 1;
      const syncTime = new Date();
      
      // Update using user-scoped method for additional security
      const updateData = {
        lastSync: syncTime,
        transactionCount: connection.transactionCount + newTransactions,
        errorCount: 0, // Reset error count on successful sync
        lastError: null
      };

      const updatedConnection = await storage.updateUserBankConnection(userId, connectionId, updateData);

      if (!updatedConnection) {
        return res.status(500).json({ message: "Failed to update connection after sync" });
      }

      res.json({
        success: true,
        newTransactions,
        lastSync: syncTime.toISOString(),
        totalTransactions: updatedConnection.transactionCount
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid connection ID", 
          errors: error.errors 
        });
      }
      console.error("Error syncing bank connection:", error);
      res.status(500).json({ message: "Failed to sync bank connection" });
    }
  });

  // Disconnect a bank connection
  app.delete("/api/bank-connections/:connectionId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate connection ID parameter
      const paramsSchema = z.object({
        connectionId: z.string().uuid("Invalid connection ID format")
      });
      
      const { connectionId } = paramsSchema.parse(req.params);

      // SECURITY FIX: Verify connection belongs to user before deletion
      const connection = await storage.getUserBankConnection(userId, connectionId);
      if (!connection) {
        return res.status(404).json({ message: "Bank connection not found" });
      }

      // Perform the deletion with proper user scoping
      const success = await storage.deleteBankConnection(userId, connectionId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to delete bank connection" });
      }

      res.status(200).json({ 
        success: true,
        message: "Bank connection disconnected successfully" 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid connection ID", 
          errors: error.errors 
        });
      }
      console.error("Error disconnecting bank:", error);
      res.status(500).json({ message: "Failed to disconnect bank" });
    }
  });

  // Health check for the API
  app.head("/api", (req, res) => {
    res.sendStatus(200);
  });

  const httpServer = createServer(app);

  return httpServer;
}

import { db } from "./db";
import { categories } from "@shared/schema";
import { eq } from "drizzle-orm";

// Default system categories with professional financial categorization
const DEFAULT_CATEGORIES = [
  // Essential Categories
  { name: "Groceries", description: "Food and household items", color: "#22c55e", icon: "shopping-cart", isDefault: true },
  { name: "Dining", description: "Restaurants and takeout", color: "#f59e0b", icon: "utensils", isDefault: true },
  { name: "Transportation", description: "Gas, public transit, rideshare", color: "#3b82f6", icon: "car", isDefault: true },
  { name: "Housing", description: "Rent, mortgage, utilities", color: "#8b5cf6", icon: "home", isDefault: true },
  { name: "Healthcare", description: "Medical expenses and insurance", color: "#ef4444", icon: "heart", isDefault: true },
  
  // Financial Categories
  { name: "Income", description: "Salary, wages, freelance income", color: "#10b981", icon: "piggy-bank", isDefault: true },
  { name: "Investment", description: "Stocks, bonds, retirement contributions", color: "#06b6d4", icon: "briefcase", isDefault: true },
  { name: "Banking", description: "Fees, transfers, interest", color: "#6366f1", icon: "credit-card", isDefault: true },
  { name: "Insurance", description: "Auto, health, life insurance", color: "#ec4899", icon: "receipt", isDefault: true },
  
  // Lifestyle Categories
  { name: "Entertainment", description: "Movies, streaming, events", color: "#f97316", icon: "gamepad2", isDefault: true },
  { name: "Shopping", description: "Clothing, electronics, personal items", color: "#d946ef", icon: "shopping-cart", isDefault: true },
  { name: "Travel", description: "Flights, hotels, vacation expenses", color: "#0ea5e9", icon: "plane", isDefault: true },
  { name: "Education", description: "Tuition, books, courses", color: "#84cc16", icon: "book", isDefault: true },
  { name: "Fitness", description: "Gym memberships, sports, equipment", color: "#22c55e", icon: "dumbbell", isDefault: true },
  
  // Business Categories (Tax Deductible)
  { name: "Business Meals", description: "Client meals and business entertainment", color: "#f59e0b", icon: "utensils", isDefault: true, isTaxDeductible: true, isBusinessCategory: true },
  { name: "Office Supplies", description: "Equipment, software, supplies", color: "#6b7280", icon: "laptop", isDefault: true, isTaxDeductible: true, isBusinessCategory: true },
  { name: "Business Travel", description: "Work-related travel expenses", color: "#0ea5e9", icon: "plane", isDefault: true, isTaxDeductible: true, isBusinessCategory: true },
  { name: "Professional Services", description: "Legal, accounting, consulting", color: "#374151", icon: "briefcase", isDefault: true, isTaxDeductible: true, isBusinessCategory: true },
  
  // Miscellaneous
  { name: "Gifts", description: "Presents and charitable donations", color: "#ec4899", icon: "gift", isDefault: true },
  { name: "Personal Care", description: "Haircuts, cosmetics, wellness", color: "#a855f7", icon: "heart", isDefault: true },
  { name: "Pet Care", description: "Veterinary, food, pet supplies", color: "#f43f5e", icon: "heart", isDefault: true },
  { name: "Subscriptions", description: "Monthly services and memberships", color: "#8b5cf6", icon: "credit-card", isDefault: true },
  { name: "Miscellaneous", description: "Other uncategorized expenses", color: "#6b7280", icon: "tag", isDefault: true },
];

export async function setupDefaultCategories() {
  console.log("Setting up default categories...");
  
  try {
    // Check if default categories already exist
    const existingCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.isDefault, true));
    
    if (existingCategories.length > 0) {
      console.log(`Found ${existingCategories.length} existing default categories. Skipping setup.`);
      return;
    }
    
    // Insert default categories
    const insertedCategories = await db
      .insert(categories)
      .values(DEFAULT_CATEGORIES.map(cat => ({
        ...cat,
        userId: null, // System categories have no userId
        displayOrder: DEFAULT_CATEGORIES.indexOf(cat),
        isActive: true,
      })))
      .returning();
    
    console.log(`Successfully created ${insertedCategories.length} default categories:`);
    insertedCategories.forEach(cat => {
      console.log(`  - ${cat.name}: ${cat.description}`);
    });
    
  } catch (error) {
    console.error("Error setting up default categories:", error);
    throw error;
  }
}

// Run this script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDefaultCategories()
    .then(() => {
      console.log("Default categories setup completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed to setup default categories:", error);
      process.exit(1);
    });
}
import Dashboard from "@/components/Dashboard";
import { Account, Transaction, Category } from "@shared/schema";

// TODO: remove mock functionality - replace with real API calls
const mockAccounts: Account[] = [
  {
    id: '1',
    userId: 'user1',
    accountName: 'Main Checking',
    accountType: 'checking',
    balance: '2847.53',
    bankName: 'Chase Bank',
    creditLimit: null,
    rewardRate: null,
    rewardType: null,
    totalRewards: '0'
  },
  {
    id: '2',
    userId: 'user1',
    accountName: 'Emergency Savings', 
    accountType: 'savings',
    balance: '15240.00',
    bankName: 'Bank of America',
    creditLimit: null,
    rewardRate: null,
    rewardType: null,
    totalRewards: '0'
  },
  {
    id: '3',
    userId: 'user1',
    accountName: 'Rewards Credit',
    accountType: 'credit',
    balance: '-1234.56',
    bankName: 'Capital One',
    creditLimit: '5000.00',
    rewardRate: '0.02', // 2% cashback
    rewardType: 'cashback',
    totalRewards: '247.83'
  },
  {
    id: '4',
    userId: 'user1',
    accountName: 'Travel Rewards Card',
    accountType: 'credit',
    balance: '-567.89',
    bankName: 'Chase Sapphire',
    creditLimit: '8000.00',
    rewardRate: '0.015', // 1.5% points
    rewardType: 'points',
    totalRewards: '156.42'
  }
];

// TODO: remove mock functionality - replace with real API calls
const mockTransactions: Transaction[] = [
  {
    id: '1',
    accountId: '1',
    amount: '-45.67',
    description: 'Whole Foods Market',
    category: 'groceries',
    date: new Date('2024-01-15'),
    type: 'debit',
    rewardsEarned: '0'
  },
  {
    id: '2',
    accountId: '1',
    amount: '2500.00',
    description: 'Payroll Deposit',
    category: 'income',
    date: new Date('2024-01-14'),
    type: 'credit',
    rewardsEarned: '0'
  },
  {
    id: '3',
    accountId: '2',
    amount: '-89.99',
    description: 'Electric Bill',
    category: 'utilities',
    date: new Date('2024-01-13'),
    type: 'debit',
    rewardsEarned: '0'
  },
  {
    id: '4',
    accountId: '3',
    amount: '-12.99',
    description: 'Netflix',
    category: 'entertainment',
    date: new Date('2024-01-12'),
    type: 'debit',
    rewardsEarned: '0.26'
  },
  {
    id: '5',
    accountId: '3',
    amount: '-156.78',
    description: 'Amazon Purchase',
    category: 'shopping',
    date: new Date('2024-01-11'),
    type: 'debit',
    rewardsEarned: '3.14'
  },
  {
    id: '6',
    accountId: '4',
    amount: '-28.45',
    description: 'Starbucks',
    category: 'dining',
    date: new Date('2024-01-10'),
    type: 'debit',
    rewardsEarned: '0.43'
  },
  {
    id: '7',
    accountId: '4',
    amount: '-75.00',
    description: 'Gas Station',
    category: 'transportation',
    date: new Date('2024-01-09'),
    type: 'debit',
    rewardsEarned: '1.13'
  },
  {
    id: '8',
    accountId: '3',
    amount: '-234.56',
    description: 'Target',
    category: 'shopping',
    date: new Date('2024-01-08'),
    type: 'debit',
    rewardsEarned: '4.69'
  },
  {
    id: '9',
    accountId: '4',
    amount: '-89.25',
    description: 'Restaurant Dinner',
    category: 'dining',
    date: new Date('2024-12-20'),
    type: 'debit',
    rewardsEarned: '1.34'
  },
  {
    id: '10',
    accountId: '3',
    amount: '-145.99',
    description: 'Online Shopping',
    category: 'shopping',
    date: new Date('2024-12-18'),
    type: 'debit',
    rewardsEarned: '2.92'
  }
];

// TODO: remove mock functionality - replace with real API calls
const mockCategories: Category[] = [
  { id: '1', name: 'groceries', color: '#22c55e', icon: 'shopping-cart' },
  { id: '2', name: 'income', color: '#3b82f6', icon: 'dollar-sign' },
  { id: '3', name: 'utilities', color: '#8b5cf6', icon: 'zap' },
  { id: '4', name: 'entertainment', color: '#ec4899', icon: 'gift' },
  { id: '5', name: 'shopping', color: '#f59e0b', icon: 'shopping-cart' },
  { id: '6', name: 'dining', color: '#ef4444', icon: 'utensils' },
  { id: '7', name: 'transportation', color: '#06b6d4', icon: 'car' },
];

export default function DashboardPage() {
  return (
    <Dashboard 
      accounts={mockAccounts}
      transactions={mockTransactions}
      categories={mockCategories}
    />
  );
}
import Dashboard from '../Dashboard';
import { Account, Transaction, Category } from '@shared/schema';
import { ThemeProvider } from '../ThemeProvider';

// TODO: remove mock functionality 
const mockAccounts: Account[] = [
  {
    id: '1',
    userId: 'user1',
    accountName: 'Main Checking',
    accountType: 'checking',
    balance: '2847.53',
    bankName: 'Chase Bank'
  },
  {
    id: '2',
    userId: 'user1',
    accountName: 'Emergency Savings',
    accountType: 'savings',
    balance: '15240.00',
    bankName: 'Bank of America'
  },
  {
    id: '3',
    userId: 'user1',
    accountName: 'Rewards Credit',
    accountType: 'credit',
    balance: '-1234.56',
    bankName: 'Capital One'
  }
];

// TODO: remove mock functionality
const mockTransactions: Transaction[] = [
  {
    id: '1',
    accountId: '1',
    amount: '-45.67',
    description: 'Whole Foods Market',
    category: 'groceries',
    date: new Date('2024-01-15'),
    type: 'debit'
  },
  {
    id: '2',
    accountId: '1',
    amount: '2500.00',
    description: 'Payroll Deposit',
    category: 'income',
    date: new Date('2024-01-14'),
    type: 'credit'
  },
  {
    id: '3',
    accountId: '2',
    amount: '-89.99',
    description: 'Electric Bill',
    category: 'utilities',
    date: new Date('2024-01-13'),
    type: 'debit'
  },
  {
    id: '4',
    accountId: '1',
    amount: '-12.99',
    description: 'Netflix',
    category: 'entertainment',
    date: new Date('2024-01-12'),
    type: 'debit'
  },
  {
    id: '5',
    accountId: '3',
    amount: '-156.78',
    description: 'Amazon Purchase',
    category: 'shopping',
    date: new Date('2024-01-11'),
    type: 'debit'
  },
  {
    id: '6',
    accountId: '1',
    amount: '-28.45',
    description: 'Starbucks',
    category: 'dining',
    date: new Date('2024-01-10'),
    type: 'debit'
  }
];

// TODO: remove mock functionality
const mockCategories: Category[] = [
  { id: '1', name: 'groceries', color: '#22c55e', icon: 'shopping-cart' },
  { id: '2', name: 'income', color: '#3b82f6', icon: 'dollar-sign' },
  { id: '3', name: 'utilities', color: '#8b5cf6', icon: 'zap' },
  { id: '4', name: 'entertainment', color: '#ec4899', icon: 'gift' },
  { id: '5', name: 'shopping', color: '#f59e0b', icon: 'shopping-cart' },
  { id: '6', name: 'dining', color: '#ef4444', icon: 'utensils' },
  { id: '7', name: 'transportation', color: '#06b6d4', icon: 'car' },
];

export default function DashboardExample() {
  return (
    <ThemeProvider>
      <Dashboard 
        accounts={mockAccounts}
        transactions={mockTransactions}
        categories={mockCategories}
      />
    </ThemeProvider>
  );
}
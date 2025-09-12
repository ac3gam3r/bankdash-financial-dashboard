import TransactionList from '../TransactionList';
import { Transaction, Category } from '@shared/schema';

const mockTransactions: Transaction[] = [
  {
    id: '1',
    accountId: 'acc1',
    amount: '-45.67',
    description: 'Whole Foods Market',
    category: 'groceries',
    date: new Date('2024-01-15'),
    type: 'debit'
  },
  {
    id: '2',
    accountId: 'acc1',
    amount: '2500.00',
    description: 'Salary Deposit',
    category: 'income',
    date: new Date('2024-01-14'),
    type: 'credit'
  },
  {
    id: '3',
    accountId: 'acc1',
    amount: '-12.99',
    description: 'Netflix Subscription',
    category: 'entertainment',
    date: new Date('2024-01-13'),
    type: 'debit'
  }
];

const mockCategories: Category[] = [
  { id: '1', name: 'groceries', color: '#22c55e', icon: 'shopping-cart' },
  { id: '2', name: 'income', color: '#3b82f6', icon: 'dollar-sign' },
  { id: '3', name: 'entertainment', color: '#ec4899', icon: 'gift' },
];

export default function TransactionListExample() {
  return (
    <div className="p-4">
      <TransactionList transactions={mockTransactions} categories={mockCategories} />
    </div>
  );
}
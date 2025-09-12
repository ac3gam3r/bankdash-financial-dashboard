import TransactionItem from '../TransactionItem';
import { Transaction, Category } from '@shared/schema';

const mockTransaction: Transaction = {
  id: '1',
  accountId: 'acc1',
  amount: '-45.67',
  description: 'Whole Foods Market',
  category: 'groceries',
  date: new Date('2024-01-15'),
  type: 'debit'
};

const mockCategory: Category = {
  id: 'cat1',
  name: 'groceries',
  color: '#22c55e',
  icon: 'shopping-cart'
};

const creditTransaction: Transaction = {
  id: '2',
  accountId: 'acc1',
  amount: '2500.00',
  description: 'Salary Deposit',
  category: 'income',
  date: new Date('2024-01-14'),
  type: 'credit'
};

export default function TransactionItemExample() {
  return (
    <div className="p-4 space-y-4">
      <TransactionItem transaction={mockTransaction} category={mockCategory} />
      <TransactionItem transaction={creditTransaction} />
    </div>
  );
}
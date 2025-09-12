import RewardsSummary from '../RewardsSummary';
import { Account, Transaction } from '@shared/schema';

const mockCreditAccounts: Account[] = [
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
    accountName: 'Travel Card',
    accountType: 'credit',
    balance: '-567.89',
    bankName: 'Chase Sapphire',
    creditLimit: '8000.00',
    rewardRate: '0.015', // 1.5% points
    rewardType: 'points',
    totalRewards: '156.42'
  }
];

const mockTransactions: Transaction[] = [
  {
    id: '5',
    accountId: '3',
    amount: '-156.78',
    description: 'Amazon Purchase',
    category: 'shopping',
    date: new Date('2024-12-11'),
    type: 'debit',
    rewardsEarned: '3.14'
  },
  {
    id: '6',
    accountId: '4',
    amount: '-28.45',
    description: 'Starbucks',
    category: 'dining',
    date: new Date('2024-12-10'),
    type: 'debit',
    rewardsEarned: '0.43'
  }
];

export default function RewardsSummaryExample() {
  return (
    <div className="p-4">
      <RewardsSummary 
        creditAccounts={mockCreditAccounts}
        transactions={mockTransactions}
      />
    </div>
  );
}
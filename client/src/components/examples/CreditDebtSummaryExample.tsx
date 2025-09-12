import CreditDebtSummary from '../CreditDebtSummary';
import { Account } from '@shared/schema';

const mockCreditAccounts: Account[] = [
  {
    id: '3',
    userId: 'user1',
    accountName: 'Rewards Credit',
    accountType: 'credit',
    balance: '-1234.56',
    bankName: 'Capital One',
    creditLimit: '5000.00',
    rewardRate: '0.02',
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
    rewardRate: '0.015',
    rewardType: 'points',
    totalRewards: '156.42'
  }
];

export default function CreditDebtSummaryExample() {
  return (
    <div className="p-4">
      <CreditDebtSummary creditAccounts={mockCreditAccounts} />
    </div>
  );
}
import BalanceCard from '../BalanceCard';
import { Account } from '@shared/schema';

const mockAccount: Account = {
  id: '1',
  userId: 'user1',
  accountName: 'Main Checking',
  accountType: 'checking',
  balance: '2,847.53',
  bankName: 'Chase Bank'
};

export default function BalanceCardExample() {
  return (
    <div className="p-4 space-y-4">
      <BalanceCard 
        account={mockAccount} 
        onClick={() => console.log('Account clicked')}
      />
      <BalanceCard 
        account={{...mockAccount, accountType: 'savings', accountName: 'Emergency Fund', balance: '12,450.00'}} 
        isSelected={true}
        onClick={() => console.log('Selected account clicked')}
      />
    </div>
  );
}
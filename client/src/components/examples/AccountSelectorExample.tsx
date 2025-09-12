import AccountSelector from '../AccountSelector';
import { Account } from '@shared/schema';
import { useState } from 'react';

const mockAccounts: Account[] = [
  {
    id: '1',
    userId: 'user1',
    accountName: 'Main Checking',
    accountType: 'checking',
    balance: '2,847.53',
    bankName: 'Chase Bank'
  },
  {
    id: '2',
    userId: 'user1',
    accountName: 'Emergency Savings',
    accountType: 'savings',
    balance: '15,240.00',
    bankName: 'Bank of America'
  },
  {
    id: '3',
    userId: 'user1',
    accountName: 'Credit Card',
    accountType: 'credit',
    balance: '-1,234.56',
    bankName: 'Capital One'
  }
];

export default function AccountSelectorExample() {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>('1');

  return (
    <div className="p-4">
      <AccountSelector
        accounts={mockAccounts}
        selectedAccountId={selectedAccountId}
        onAccountSelect={setSelectedAccountId}
      />
    </div>
  );
}
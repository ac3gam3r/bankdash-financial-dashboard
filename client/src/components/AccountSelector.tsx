import { Account } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface AccountSelectorProps {
  accounts: Account[];
  selectedAccountId: string | null;
  onAccountSelect: (accountId: string | null) => void;
}

export default function AccountSelector({ 
  accounts, 
  selectedAccountId, 
  onAccountSelect 
}: AccountSelectorProps) {
  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(amount));
  };

  const handleAccountChange = (value: string) => {
    console.log(`Account selected: ${value}`);
    onAccountSelect(value === 'all' ? null : value);
  };

  const getAccountTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'checking':
        return 'bg-chart-1 text-white';
      case 'savings':
        return 'bg-chart-2 text-white';
      case 'credit':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div className="w-full">
      <Select 
        value={selectedAccountId || 'all'} 
        onValueChange={handleAccountChange}
      >
        <SelectTrigger data-testid="select-account-trigger">
          <SelectValue placeholder="Select an account" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" data-testid="select-account-all">
            <div className="flex items-center justify-between w-full">
              <span>All Accounts</span>
              <Badge variant="secondary" className="ml-2 text-xs">
                {accounts.length} accounts
              </Badge>
            </div>
          </SelectItem>
          {accounts.map((account) => (
            <SelectItem 
              key={account.id} 
              value={account.id}
              data-testid={`select-account-${account.id}`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{account.accountName}</span>
                  <Badge 
                    className={`text-xs ${getAccountTypeColor(account.accountType)}`}
                  >
                    {account.accountType}
                  </Badge>
                </div>
                <span className="text-sm font-semibold">
                  {formatCurrency(account.balance)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {account.bankName}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
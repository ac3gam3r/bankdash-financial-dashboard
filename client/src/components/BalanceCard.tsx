import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Account } from "@shared/schema";

interface BalanceCardProps {
  account: Account;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function BalanceCard({ account, isSelected = false, onClick }: BalanceCardProps) {
  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(amount));
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
    <Card 
      className={`cursor-pointer transition-all hover-elevate ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onClick}
      data-testid={`card-account-${account.id}`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium truncate">
          {account.accountName}
        </CardTitle>
        <Badge 
          className={`text-xs ${getAccountTypeColor(account.accountType)}`}
          data-testid={`badge-account-type-${account.accountType}`}
        >
          {account.accountType}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" data-testid={`text-balance-${account.id}`}>
          {formatCurrency(account.balance)}
        </div>
        <p className="text-xs text-muted-foreground mt-1" data-testid={`text-bank-${account.id}`}>
          {account.bankName}
        </p>
      </CardContent>
    </Card>
  );
}
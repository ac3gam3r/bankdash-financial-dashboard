import { Account } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, TrendingDown } from "lucide-react";

interface CreditDebtSummaryProps {
  creditAccounts: Account[];
}

export default function CreditDebtSummary({ creditAccounts }: CreditDebtSummaryProps) {
  const formatCurrency = (amount: string | number) => {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(value));
  };

  const totalDebt = creditAccounts.reduce((sum, account) => {
    const balance = parseFloat(account.balance);
    return sum + (balance < 0 ? Math.abs(balance) : 0);
  }, 0);

  const totalCreditLimit = creditAccounts.reduce((sum, account) => {
    return sum + (account.creditLimit ? parseFloat(account.creditLimit) : 0);
  }, 0);

  const creditUtilization = totalCreditLimit > 0 ? (totalDebt / totalCreditLimit) * 100 : 0;

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 80) return 'text-destructive';
    if (utilization >= 50) return 'text-chart-2';
    return 'text-chart-1';
  };

  return (
    <Card data-testid="card-credit-debt-summary">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center">
          <CreditCard className="h-4 w-4 mr-2" />
          Credit Card Debt
        </CardTitle>
        <TrendingDown className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-destructive" data-testid="text-total-debt">
          {formatCurrency(totalDebt)}
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>Total Limit: {formatCurrency(totalCreditLimit)}</span>
          <Badge 
            variant="secondary" 
            className={`text-xs ${getUtilizationColor(creditUtilization)}`}
            data-testid="badge-utilization"
          >
            {creditUtilization.toFixed(1)}% used
          </Badge>
        </div>
        <div className="mt-2" data-testid="text-cards-count">
          <p className="text-xs text-muted-foreground">
            {creditAccounts.length} credit card{creditAccounts.length !== 1 ? 's' : ''}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
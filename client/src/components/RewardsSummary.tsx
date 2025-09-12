import { Account, Transaction } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, Star } from "lucide-react";

interface RewardsSummaryProps {
  creditAccounts: Account[];
  transactions: Transaction[];
}

export default function RewardsSummary({ creditAccounts, transactions }: RewardsSummaryProps) {
  const formatCurrency = (amount: string | number) => {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatPoints = (points: number) => {
    return new Intl.NumberFormat('en-US').format(Math.round(points));
  };

  // Calculate rewards using transaction.rewardsEarned as authoritative source
  const calculateRewardsFromTransactions = () => {
    let totalCashback = 0;
    let totalPoints = 0;
    let monthlyCashback = 0;
    let monthlyPoints = 0;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    transactions.forEach(transaction => {
      const account = creditAccounts.find(acc => acc.id === transaction.accountId);
      if (account && transaction.rewardsEarned && transaction.type === 'debit') {
        const rewardEarned = parseFloat(transaction.rewardsEarned);
        const rewardType = account.rewardType || 'cashback';
        
        // Separate cashback (dollars) from points/miles (numbers)
        if (rewardType === 'cashback') {
          totalCashback += rewardEarned;
        } else {
          totalPoints += rewardEarned;
        }

        // Check if transaction is from current month
        const transactionDate = new Date(transaction.date);
        if (transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear) {
          if (rewardType === 'cashback') {
            monthlyCashback += rewardEarned;
          } else {
            monthlyPoints += rewardEarned;
          }
        }
      }
    });

    return { totalCashback, totalPoints, monthlyCashback, monthlyPoints };
  };

  const { totalCashback, totalPoints, monthlyCashback, monthlyPoints } = calculateRewardsFromTransactions();

  // Get stored rewards from account balances (separate by type)
  const storedRewards = creditAccounts.reduce((acc, account) => {
    const stored = account.totalRewards ? parseFloat(account.totalRewards) : 0;
    const rewardType = account.rewardType || 'cashback';
    
    if (rewardType === 'cashback') {
      acc.cashback += stored;
    } else {
      acc.points += stored;
    }
    return acc;
  }, { cashback: 0, points: 0 });

  // Use ONLY stored rewards (avoiding double-counting with transaction.rewardsEarned)
  const finalTotalCashback = storedRewards.cashback;
  const finalTotalPoints = storedRewards.points;

  const rewardCards = creditAccounts.filter(account => account.rewardRate && parseFloat(account.rewardRate) > 0);

  const getRewardTypeDisplay = (account: Account) => {
    const rate = account.rewardRate ? parseFloat(account.rewardRate) * 100 : 0;
    const type = account.rewardType || 'cashback';
    return `${rate.toFixed(1)}% ${type}`;
  };

  if (rewardCards.length === 0) {
    return (
      <Card data-testid="card-no-rewards">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center">
            <Gift className="h-4 w-4 mr-2" />
            Rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No reward cards found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-rewards-summary">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center">
          <Gift className="h-4 w-4 mr-2" />
          Rewards Earned
        </CardTitle>
        <Star className="h-4 w-4 text-chart-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Total Lifetime Rewards */}
          {finalTotalCashback > 0 && (
            <div>
              <div className="text-2xl font-bold text-chart-1" data-testid="text-total-cashback">
                {formatCurrency(finalTotalCashback)}
              </div>
              <p className="text-xs text-muted-foreground">Total cashback earned</p>
            </div>
          )}
          
          {finalTotalPoints > 0 && (
            <div>
              <div className="text-2xl font-bold text-chart-1" data-testid="text-total-points">
                {formatPoints(finalTotalPoints)} pts
              </div>
              <p className="text-xs text-muted-foreground">Total points earned</p>
            </div>
          )}
          
          {/* Monthly Rewards */}
          {monthlyCashback > 0 && (
            <div>
              <div className="text-lg font-semibold text-chart-2" data-testid="text-monthly-cashback">
                {formatCurrency(monthlyCashback)}
              </div>
              <p className="text-xs text-muted-foreground">Cashback this month</p>
            </div>
          )}
          
          {monthlyPoints > 0 && (
            <div>
              <div className="text-lg font-semibold text-chart-2" data-testid="text-monthly-points">
                {formatPoints(monthlyPoints)} pts
              </div>
              <p className="text-xs text-muted-foreground">Points this month</p>
            </div>
          )}

          <div className="space-y-1">
            {rewardCards.map(account => (
              <div key={account.id} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground truncate">
                  {account.accountName}
                </span>
                <Badge variant="secondary" className="text-xs" data-testid={`badge-reward-${account.id}`}>
                  {getRewardTypeDisplay(account)}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
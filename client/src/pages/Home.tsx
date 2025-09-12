import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Account, Transaction } from "@shared/schema";
import { 
  Wallet, 
  TrendingUp, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  Eye,
  CalendarDays
} from "lucide-react";
import { formatDistance } from "date-fns";
import { Link } from "wouter";

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: accounts, isLoading: accountsLoading, error: accountsError } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: transactions, isLoading: transactionsLoading, error: transactionsError } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", { limit: 5 }],
    enabled: isAuthenticated,
    retry: false,
  });

  // Handle unauthorized errors
  if ((accountsError && isUnauthorizedError(accountsError as Error)) || 
      (transactionsError && isUnauthorizedError(transactionsError as Error))) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
    return null;
  }

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  // Calculate summary statistics
  const { totalAssets, totalDebt, netWorth, creditCards } = useMemo(() => {
    if (!accounts) return { totalAssets: 0, totalDebt: 0, netWorth: 0, creditCards: [] };

    const assets = accounts.filter((acc: Account) => acc.accountType !== 'credit');
    const credits = accounts.filter((acc: Account) => acc.accountType === 'credit');

    const totalAssets = assets.reduce((sum: number, acc: Account) => sum + parseFloat(acc.balance), 0);
    const totalDebt = credits.reduce((sum: number, acc: Account) => {
      const balance = parseFloat(acc.balance);
      return sum + (balance < 0 ? Math.abs(balance) : 0);
    }, 0);

    return {
      totalAssets,
      totalDebt,
      netWorth: totalAssets - totalDebt,
      creditCards: credits
    };
  }, [accounts]);

  const recentTransactions = (transactions || []).slice(0, 5);

  if (accountsLoading || transactionsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-dashboard-title">Welcome Back!</h1>
        <p className="text-muted-foreground">
          Here's an overview of your financial position
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary" data-testid="stat-net-worth">
              {formatCurrency(netWorth.toString())}
            </div>
            <p className="text-xs text-muted-foreground">
              Total assets minus debt
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="stat-total-assets">
              {formatCurrency(totalAssets.toString())}
            </div>
            <p className="text-xs text-muted-foreground">
              Checking & savings accounts
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credit Card Debt</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive" data-testid="stat-total-debt">
              {formatCurrency(totalDebt.toString())}
            </div>
            <p className="text-xs text-muted-foreground">
              Total outstanding balance
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accounts</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-accounts">
              {accounts?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Connected accounts
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest 5 transactions</CardDescription>
            </div>
            <Link href="/transactions">
              <Button variant="outline" size="sm" data-testid="button-view-all-transactions">
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent transactions</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTransactions.map((transaction: Transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                    data-testid={`recent-transaction-${transaction.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${parseFloat(transaction.amount) > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {parseFloat(transaction.amount) > 0 ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{transaction.description}</div>
                        <div className="text-sm text-muted-foreground">
                          {transaction.merchantName || transaction.category}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${parseFloat(transaction.amount) > 0 ? 'text-green-600' : 'text-destructive'}`}>
                        {parseFloat(transaction.amount) > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDistance(new Date(transaction.date), new Date(), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Account Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Link href="/transactions">
                <Button variant="outline" className="w-full h-16 flex flex-col gap-1" data-testid="button-quick-transactions">
                  <ArrowUpRight className="h-5 w-5" />
                  <span className="text-xs">Transactions</span>
                </Button>
              </Link>
              <Link href="/accounts">
                <Button variant="outline" className="w-full h-16 flex flex-col gap-1" data-testid="button-quick-accounts">
                  <CreditCard className="h-5 w-5" />
                  <span className="text-xs">Accounts</span>
                </Button>
              </Link>
              <Link href="/recurring">
                <Button variant="outline" className="w-full h-16 flex flex-col gap-1" data-testid="button-quick-recurring">
                  <CalendarDays className="h-5 w-5" />
                  <span className="text-xs">Recurring</span>
                </Button>
              </Link>
              <Link href="/bonus">
                <Button variant="outline" className="w-full h-16 flex flex-col gap-1" data-testid="button-quick-bonus">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-xs">Bonuses</span>
                </Button>
              </Link>
            </div>

            {/* Account Status */}
            {accounts && accounts.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Account Status</h4>
                <div className="space-y-2">
                  {accounts.slice(0, 3).map((account: Account) => (
                    <div key={account.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="truncate">{account.accountName}</span>
                      </div>
                      <span className={`font-medium ${parseFloat(account.balance) >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                        {formatCurrency(account.balance)}
                      </span>
                    </div>
                  ))}
                  {accounts.length > 3 && (
                    <Link href="/accounts">
                      <Button variant="ghost" size="sm" className="w-full text-xs">
                        View {accounts.length - 3} more accounts
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Empty State for New Users */}
      {(!accounts || accounts.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wallet className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Welcome to BankDash!</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Get started by connecting your first account to begin tracking your finances and maximizing your financial potential.
            </p>
            <div className="flex items-center gap-3">
              <Link href="/accounts">
                <Button data-testid="button-get-started">
                  <Plus className="h-4 w-4 mr-2" />
                  Connect Your First Account
                </Button>
              </Link>
              <Link href="/news">
                <Button variant="outline" data-testid="button-browse-news">
                  Browse Financial News
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
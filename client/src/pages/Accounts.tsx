import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Account } from "@shared/schema";
import { Plus, CreditCard, Wallet, TrendingUp, AlertCircle } from "lucide-react";

export default function AccountsPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: accounts, isLoading, error } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Handle unauthorized errors
  if (error && isUnauthorizedError(error as Error)) {
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

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'credit':
        return <CreditCard className="h-5 w-5" />;
      case 'checking':
      case 'savings':
        return <Wallet className="h-5 w-5" />;
      default:
        return <Wallet className="h-5 w-5" />;
    }
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'credit':
        return 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950';
      case 'checking':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950';
      case 'savings':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950';
      default:
        return 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950';
    }
  };

  const getCreditUtilization = (account: Account) => {
    if (account.accountType !== 'credit' || !account.creditLimit) return 0;
    const balance = Math.abs(parseFloat(account.balance));
    const limit = parseFloat(account.creditLimit);
    return (balance / limit) * 100;
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization < 30) return 'text-green-600';
    if (utilization < 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const assetAccounts = accounts?.filter((acc: Account) => acc.accountType !== 'credit') || [];
  const creditAccounts = accounts?.filter((acc: Account) => acc.accountType === 'credit') || [];

  const totalAssets = assetAccounts.reduce((sum: number, acc: Account) => sum + parseFloat(acc.balance), 0);
  const totalDebt = creditAccounts.reduce((sum: number, acc: Account) => {
    const balance = parseFloat(acc.balance);
    return sum + (balance < 0 ? Math.abs(balance) : 0);
  }, 0);
  const totalCreditLimit = creditAccounts.reduce((sum: number, acc: Account) => 
    sum + parseFloat(acc.creditLimit || "0"), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-accounts-title">Accounts</h1>
          <p className="text-muted-foreground">
            Manage your bank accounts and credit cards
          </p>
        </div>
        <Button data-testid="button-add-account">
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="stat-total-assets">
              {formatCurrency(totalAssets.toString())}
            </div>
            <p className="text-xs text-muted-foreground">
              Checking & Savings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Debt</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive" data-testid="stat-total-debt">
              {formatCurrency(totalDebt.toString())}
            </div>
            <p className="text-xs text-muted-foreground">
              Credit Card Balances
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary" data-testid="stat-net-worth">
              {formatCurrency((totalAssets - totalDebt).toString())}
            </div>
            <p className="text-xs text-muted-foreground">
              Assets - Liabilities
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Asset Accounts */}
      {assetAccounts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Banking Accounts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assetAccounts.map((account: Account) => (
              <Card 
                key={account.id} 
                className={`hover-elevate ${getAccountTypeColor(account.accountType)}`}
                data-testid={`account-card-${account.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getAccountTypeIcon(account.accountType)}
                      <Badge variant="outline" className="capitalize">
                        {account.accountType}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {account.bankName}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{account.accountName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(account.balance)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Current Balance
                      </div>
                    </div>
                    
                    {account.accountNumber && (
                      <div className="text-sm text-muted-foreground">
                        •••• {account.accountNumber}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Credit Cards */}
      {creditAccounts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Credit Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creditAccounts.map((account: Account) => {
              const utilization = getCreditUtilization(account);
              const balance = Math.abs(parseFloat(account.balance));
              const limit = parseFloat(account.creditLimit || "0");
              const available = limit - balance;

              return (
                <Card 
                  key={account.id} 
                  className={`hover-elevate ${getAccountTypeColor(account.accountType)}`}
                  data-testid={`account-card-${account.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getAccountTypeIcon(account.accountType)}
                        <Badge variant="outline">Credit Card</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {account.bankName}
                      </div>
                    </div>
                    <CardTitle className="text-lg">{account.accountName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="text-2xl font-bold text-destructive">
                          {formatCurrency(balance.toString())}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Current Balance
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Credit Utilization</span>
                          <span className={getUtilizationColor(utilization)}>
                            {utilization.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={utilization} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>Used: {formatCurrency(balance.toString())}</span>
                          <span>Limit: {formatCurrency(limit.toString())}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Available</div>
                          <div className="font-semibold text-green-600">
                            {formatCurrency(available.toString())}
                          </div>
                        </div>
                        {account.rewardRate && (
                          <div>
                            <div className="text-muted-foreground">Rewards</div>
                            <div className="font-semibold">
                              {(parseFloat(account.rewardRate) * 100).toFixed(1)}%
                            </div>
                          </div>
                        )}
                      </div>

                      {account.paymentDueDate && (
                        <div className="pt-2 border-t">
                          <div className="text-sm text-muted-foreground">
                            Payment Due: {new Date(account.paymentDueDate).toLocaleDateString()}
                          </div>
                          {account.minimumPayment && (
                            <div className="text-sm font-semibold">
                              Min Payment: {formatCurrency(account.minimumPayment)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!accounts || accounts.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Accounts Found</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Get started by connecting your first bank account or credit card to begin tracking your finances.
            </p>
            <Button data-testid="button-add-first-account">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Account
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
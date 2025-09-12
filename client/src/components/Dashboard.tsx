import { useState, useMemo } from "react";
import { Account, Transaction, Category } from "@shared/schema";
import BalanceCard from "./BalanceCard";
import TransactionList from "./TransactionList";
import CategoryFilter from "./CategoryFilter";
import AccountSelector from "./AccountSelector";
import { ThemeToggle } from "./ThemeToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DashboardProps {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
}

export default function Dashboard({ accounts, transactions, categories }: DashboardProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Calculate total balance across all accounts
  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, account) => sum + parseFloat(account.balance), 0);
  }, [accounts]);

  // Filter transactions based on selected account and categories
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Filter by account if one is selected
    if (selectedAccountId) {
      filtered = filtered.filter(transaction => transaction.accountId === selectedAccountId);
    }

    // Filter by categories if any are selected
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(transaction => 
        selectedCategories.includes(transaction.category)
      );
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedAccountId, selectedCategories]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleCategoryToggle = (categoryName: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryName)
        ? prev.filter(cat => cat !== categoryName)
        : [...prev, categoryName]
    );
  };

  const handleClearCategories = () => {
    setSelectedCategories([]);
  };

  const selectedAccount = selectedAccountId 
    ? accounts.find(acc => acc.id === selectedAccountId) 
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-app-title">BankDash</h1>
              <p className="text-sm text-muted-foreground">Personal Financial Dashboard</p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Total Balance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary" data-testid="text-total-balance">
                    {formatCurrency(totalBalance)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>

              {/* Account Selector */}
              <div>
                <h3 className="text-sm font-medium mb-3">Account</h3>
                <AccountSelector
                  accounts={accounts}
                  selectedAccountId={selectedAccountId}
                  onAccountSelect={setSelectedAccountId}
                />
              </div>

              {/* Category Filter */}
              <CategoryFilter
                categories={categories}
                selectedCategories={selectedCategories}
                onCategoryToggle={handleCategoryToggle}
                onClearAll={handleClearCategories}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* Account Cards */}
              {!selectedAccountId && (
                <div>
                  <h2 className="text-lg font-semibold mb-4" data-testid="text-accounts-title">Your Accounts</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {accounts.map((account) => (
                      <BalanceCard
                        key={account.id}
                        account={account}
                        onClick={() => setSelectedAccountId(account.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Account Details */}
              {selectedAccount && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold" data-testid="text-account-title">
                      {selectedAccount.accountName}
                    </h2>
                    <Badge variant="secondary">
                      {selectedAccount.bankName}
                    </Badge>
                  </div>
                  <BalanceCard
                    account={selectedAccount}
                    isSelected={true}
                  />
                </div>
              )}

              {/* Transactions */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold" data-testid="text-transactions-title">
                    Recent Transactions
                  </h2>
                  <Badge variant="secondary" data-testid="badge-transaction-count">
                    {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <TransactionList
                  transactions={filteredTransactions}
                  categories={categories}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Transaction, Category, Account } from "@shared/schema";
import { Search, Filter, Download, Edit } from "lucide-react";
import { formatDistance } from "date-fns";
import AddTransactionDialog from "@/components/AddTransactionDialog";
import EditTransactionDialog from "@/components/EditTransactionDialog";

export default function TransactionsPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const { data: transactions, isLoading: transactionsLoading, error: transactionsError } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: accounts, isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Handle unauthorized errors
  if (transactionsError && isUnauthorizedError(transactionsError as Error)) {
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

  const getTransactionIcon = (type: string) => {
    return type === 'credit' ? '↗️' : '↙️';
  };

  const getCategoryColor = (categoryName: string) => {
    const category = categories?.find((cat: Category) => cat.name === categoryName);
    return category?.color || '#6b7280';
  };

  // Filter transactions
  const filteredTransactions = (transactions || []).filter((transaction: Transaction) => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.merchantName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || transaction.category === selectedCategory;
    const matchesAccount = selectedAccount === "all" || transaction.accountId === selectedAccount;
    
    return matchesSearch && matchesCategory && matchesAccount;
  });

  if (transactionsLoading || categoriesLoading || accountsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-transactions-title">Transactions</h1>
          <p className="text-muted-foreground">
            Manage and analyze your financial transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <AddTransactionDialog />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-transactions">
              {filteredTransactions.length}
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive" data-testid="stat-total-spent">
              {formatCurrency(
                filteredTransactions
                  .filter((t: Transaction) => parseFloat(t.amount) < 0)
                  .reduce((sum: number, t: Transaction) => sum + Math.abs(parseFloat(t.amount)), 0)
                  .toString()
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Outgoing payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="stat-total-income">
              {formatCurrency(
                filteredTransactions
                  .filter((t: Transaction) => parseFloat(t.amount) > 0)
                  .reduce((sum: number, t: Transaction) => sum + parseFloat(t.amount), 0)
                  .toString()
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Incoming payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rewards Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary" data-testid="stat-rewards-earned">
              {formatCurrency(
                filteredTransactions
                  .reduce((sum: number, t: Transaction) => sum + parseFloat(t.rewardsEarned || "0"), 0)
                  .toString()
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Credit card rewards
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-transactions"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map((category: Category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Account</label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger data-testid="select-account">
                  <SelectValue placeholder="All Accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {accounts?.map((account: any) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.accountName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No transactions found matching your criteria
              </div>
            ) : (
              filteredTransactions.map((transaction: Transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                  data-testid={`transaction-item-${transaction.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <div className="font-medium">{transaction.description}</div>
                      {transaction.merchantName && (
                        <div className="text-sm text-muted-foreground">{transaction.merchantName}</div>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="secondary"
                          style={{ backgroundColor: `${getCategoryColor(transaction.category)}20`, color: getCategoryColor(transaction.category) }}
                        >
                          {transaction.category}
                        </Badge>
                        {transaction.isRecurring && (
                          <Badge variant="outline">Recurring</Badge>
                        )}
                        {transaction.rewardsEarned && parseFloat(transaction.rewardsEarned) > 0 && (
                          <Badge variant="outline" className="text-green-600">
                            +{formatCurrency(transaction.rewardsEarned)} rewards
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`font-semibold ${parseFloat(transaction.amount) > 0 ? 'text-green-600' : 'text-destructive'}`}>
                        {parseFloat(transaction.amount) > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDistance(new Date(transaction.date), new Date(), { addSuffix: true })}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingTransaction(transaction)}
                      data-testid={`button-edit-transaction-${transaction.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Transaction Dialog */}
      {editingTransaction && (
        <EditTransactionDialog
          transaction={editingTransaction}
          open={!!editingTransaction}
          onOpenChange={(open) => {
            if (!open) {
              setEditingTransaction(null);
            }
          }}
        />
      )}
    </div>
  );
}
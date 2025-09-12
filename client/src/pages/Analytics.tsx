import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  CreditCard,
  DollarSign,
  Target,
  ArrowUpIcon,
  ArrowDownIcon,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowRight
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, parseISO, differenceInMonths } from "date-fns";
import { type Transaction, type Account, type BankBonus, type CreditCardBonus } from "@shared/schema";

// Color palette for charts
const CHART_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

interface SpendingByCategory {
  category: string;
  amount: number;
  count: number;
  percentage: number;
}

interface MonthlySpending {
  month: string;
  spending: number;
  income: number;
  net: number;
  transactions: number;
}

interface AccountAnalysis {
  id: string;
  name: string;
  type: string;
  balance: number;
  monthlySpending: number;
  rewardsEarned: number;
  rewardRate: number;
  annualFee: number;
  roi: number;
}

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<string>("6m");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Fetch data
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: accounts = [], isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const { data: bankBonuses = [] } = useQuery<BankBonus[]>({
    queryKey: ["/api/bank-bonuses"],
  });

  const { data: creditCardBonuses = [] } = useQuery<CreditCardBonus[]>({
    queryKey: ["/api/credit-card-bonuses"],
  });

  // Calculate date range based on selection
  const dateRange = useMemo(() => {
    const now = new Date();
    const months = timeRange === "3m" ? 3 : timeRange === "6m" ? 6 : timeRange === "1y" ? 12 : 24;
    return {
      start: startOfMonth(subMonths(now, months - 1)),
      end: endOfMonth(now)
    };
  }, [timeRange]);

  // Filter transactions by date range
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const transactionDate = typeof transaction.date === 'string' ? parseISO(transaction.date) : new Date(transaction.date);
      return transactionDate >= dateRange.start && transactionDate <= dateRange.end;
    });
  }, [transactions, dateRange]);

  // Calculate spending by category
  const spendingByCategory = useMemo(() => {
    const categorySpending: Record<string, { amount: number; count: number }> = {};
    
    filteredTransactions
      .filter(t => t.type === 'debit' && parseFloat(t.amount) > 0)
      .forEach(transaction => {
        const category = transaction.category || 'Other';
        if (!categorySpending[category]) {
          categorySpending[category] = { amount: 0, count: 0 };
        }
        categorySpending[category].amount += parseFloat(transaction.amount);
        categorySpending[category].count += 1;
      });

    const totalSpending = Object.values(categorySpending).reduce((sum, cat) => sum + cat.amount, 0);
    
    return Object.entries(categorySpending)
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        count: data.count,
        percentage: (data.amount / totalSpending) * 100
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions]);

  // Calculate monthly spending trends
  const monthlyTrends = useMemo(() => {
    const monthlyData: Record<string, { spending: number; income: number; transactions: number }> = {};
    
    filteredTransactions.forEach(transaction => {
      const transactionDate = typeof transaction.date === 'string' ? parseISO(transaction.date) : new Date(transaction.date);
      const month = format(transactionDate, 'yyyy-MM');
      if (!monthlyData[month]) {
        monthlyData[month] = { spending: 0, income: 0, transactions: 0 };
      }
      
      const amount = parseFloat(transaction.amount);
      if (transaction.type === 'debit' && amount > 0) {
        monthlyData[month].spending += amount;
      } else if (transaction.type === 'credit' && amount > 0) {
        monthlyData[month].income += amount;
      }
      monthlyData[month].transactions += 1;
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        rawMonth: month,
        month: format(new Date(month + '-01'), 'MMM yyyy'),
        spending: data.spending,
        income: data.income,
        net: data.income - data.spending,
        transactions: data.transactions
      }))
      .sort((a, b) => a.rawMonth.localeCompare(b.rawMonth));
  }, [filteredTransactions]);

  // Calculate account ROI analysis
  const accountAnalysis = useMemo(() => {
    return accounts
      .filter(account => account.accountType === 'credit')
      .map(account => {
        // Calculate monthly spending for this account
        const accountTransactions = filteredTransactions.filter(t => t.accountId === account.id);
        const monthlySpending = accountTransactions
          .filter(t => t.type === 'debit')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0) / 
          Math.max(1, differenceInMonths(dateRange.end, dateRange.start) + 1);

        // Calculate total rewards earned
        const rewardsEarned = accountTransactions
          .reduce((sum, t) => sum + parseFloat(t.rewardsEarned || '0'), 0);

        const annualFee = parseFloat(account.annualFee || '0');
        const rewardRate = parseFloat(account.rewardRate || '0');
        
        // Calculate monthly ROI based on current performance
        const monthlyRewards = rewardsEarned / Math.max(1, differenceInMonths(dateRange.end, dateRange.start) + 1);
        const monthlyFee = annualFee / 12;
        const monthlyROI = monthlyFee > 0 ? ((monthlyRewards - monthlyFee) / monthlyFee) * 100 : 
                          rewardsEarned > 0 ? 999 : 0; // 999% for fee-free cards with rewards
        const roi = monthlyROI;

        return {
          id: account.id,
          name: account.accountName,
          type: account.accountType,
          balance: parseFloat(account.balance),
          monthlySpending,
          rewardsEarned,
          rewardRate,
          annualFee,
          roi
        };
      })
      .sort((a, b) => b.roi - a.roi);
  }, [accounts, filteredTransactions, dateRange]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalSpending = filteredTransactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalRewards = filteredTransactions
      .reduce((sum, t) => sum + parseFloat(t.rewardsEarned || '0'), 0);

    const monthCount = Math.max(1, differenceInMonths(dateRange.end, dateRange.start) + 1);
    const avgMonthlySpending = totalSpending / monthCount;

    // Calculate spending growth rate
    const firstHalf = filteredTransactions
      .filter(t => {
        const date = typeof t.date === 'string' ? parseISO(t.date) : new Date(t.date);
        return date >= dateRange.start && date <= subMonths(dateRange.end, Math.floor(monthCount / 2));
      })
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const secondHalf = filteredTransactions
      .filter(t => {
        const date = typeof t.date === 'string' ? parseISO(t.date) : new Date(t.date);
        return date > subMonths(dateRange.end, Math.floor(monthCount / 2)) && date <= dateRange.end;
      })
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const growthRate = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;

    // Bonus analysis
    const totalBonusValue = [
      ...bankBonuses.filter(b => b.status === 'received'),
      ...creditCardBonuses.filter(b => b.status === 'received')
    ].reduce((sum, bonus) => sum + parseFloat(bonus.bonusAmount), 0);

    return {
      totalSpending,
      totalIncome,
      netCashFlow: totalIncome - totalSpending,
      avgMonthlySpending,
      totalRewards,
      growthRate,
      totalBonusValue,
      transactionCount: filteredTransactions.length
    };
  }, [filteredTransactions, bankBonuses, creditCardBonuses, dateRange]);

  if (transactionsLoading || accountsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Financial Analytics</h1>
          <p className="text-muted-foreground">Insights and trends from your financial data</p>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Time Range:</span>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32" data-testid="select-time-range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3m">3 Months</SelectItem>
              <SelectItem value="6m">6 Months</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
              <SelectItem value="2y">2 Years</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summaryStats.totalSpending.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Avg: ${summaryStats.avgMonthlySpending.toLocaleString()}/month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
            {summaryStats.netCashFlow >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summaryStats.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${summaryStats.netCashFlow.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Income: ${summaryStats.totalIncome.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rewards Earned</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${summaryStats.totalRewards.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {summaryStats.transactionCount} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spending Growth</CardTitle>
            {summaryStats.growthRate >= 0 ? (
              <ArrowUpIcon className="h-4 w-4 text-red-600" />
            ) : (
              <ArrowDownIcon className="h-4 w-4 text-green-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summaryStats.growthRate >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {summaryStats.growthRate > 0 ? '+' : ''}{summaryStats.growthRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Period over period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analysis */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Spending Trends</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="accounts">Account ROI</TabsTrigger>
          <TabsTrigger value="bonuses">Bonus Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Monthly Spending Trend */}
            <Card className="col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle>Monthly Spending vs Income</CardTitle>
                <CardDescription>Track your financial flow over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, '']} />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="income" 
                      stackId="1"
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.6}
                      name="Income"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="spending" 
                      stackId="2"
                      stroke="#ef4444" 
                      fill="#ef4444" 
                      fillOpacity={0.6}
                      name="Spending"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Net Cash Flow */}
            <Card>
              <CardHeader>
                <CardTitle>Net Cash Flow Trend</CardTitle>
                <CardDescription>Monthly income minus spending</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Net']} />
                    <Line 
                      type="monotone" 
                      dataKey="net" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Transaction Volume */}
            <Card>
              <CardHeader>
                <CardTitle>Transaction Volume</CardTitle>
                <CardDescription>Number of transactions per month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="transactions" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Category Breakdown Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
                <CardDescription>Where your money goes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={spendingByCategory.slice(0, 8)} // Top 8 categories
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percentage }) => `${category} (${percentage.toFixed(1)}%)`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {spendingByCategory.slice(0, 8).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Details */}
            <Card>
              <CardHeader>
                <CardTitle>Category Details</CardTitle>
                <CardDescription>Detailed breakdown of spending categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {spendingByCategory.map((category, index) => (
                    <div key={category.category} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <div>
                          <div className="font-medium">{category.category}</div>
                          <div className="text-sm text-muted-foreground">{category.count} transactions</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${category.amount.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">{category.percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          <div className="space-y-4">
            {/* Account ROI Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Credit Card ROI Analysis</CardTitle>
                <CardDescription>Return on investment for your credit cards (rewards vs fees)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {accountAnalysis.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No credit card accounts found for analysis
                    </div>
                  ) : (
                    accountAnalysis.map((account) => (
                      <div key={account.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{account.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Monthly spending: ${account.monthlySpending.toLocaleString()}
                            </p>
                          </div>
                          <Badge 
                            variant={account.roi > 100 ? "default" : account.roi > 0 ? "secondary" : "destructive"}
                            className="text-sm"
                          >
                            {account.roi === 999 ? "Excellent" : `${account.roi.toFixed(1)}% ROI`}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Annual Fee:</span>
                            <div className="font-medium">${account.annualFee.toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Rewards Earned:</span>
                            <div className="font-medium text-green-600">${account.rewardsEarned.toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Reward Rate:</span>
                            <div className="font-medium">{(account.rewardRate * 100).toFixed(2)}%</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Balance:</span>
                            <div className="font-medium">${account.balance.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bonuses" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Bonus Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Bonus Performance</CardTitle>
                <CardDescription>Track your bonus earnings and status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        ${summaryStats.totalBonusValue.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Earned</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold">
                        {[...bankBonuses, ...creditCardBonuses].filter(b => b.status === 'pending').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Pending</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Recent Bonuses</h4>
                    {[
                      ...bankBonuses.filter(b => b.status === 'received').map(b => ({ ...b, type: 'bank' as const })),
                      ...creditCardBonuses.filter(b => b.status === 'received').map(b => ({ ...b, type: 'creditCard' as const }))
                    ]
                      .slice(-5)
                      .map((bonus, index) => {
                        const displayName = bonus.bankName;
                        return (
                          <div key={`${bonus.type}-${bonus.id}`} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                            <div className="text-sm">
                              {displayName}
                            </div>
                            <div className="text-sm font-medium text-green-600">
                              +${bonus.bonusAmount}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bonus Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Bonus Insights</CardTitle>
                <CardDescription>Strategic recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {accountAnalysis.length > 0 && (
                    <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                      <h4 className="font-medium text-blue-900">Best Performing Card</h4>
                      <p className="text-sm text-blue-700">
                        {accountAnalysis[0].name} has the highest ROI at {accountAnalysis[0].roi.toFixed(1)}%
                      </p>
                    </div>
                  )}
                  
                  {summaryStats.totalRewards > 0 && (
                    <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                      <h4 className="font-medium text-green-900">Rewards Optimization</h4>
                      <p className="text-sm text-green-700">
                        You're earning an average of ${(summaryStats.totalRewards / (summaryStats.transactionCount || 1)).toFixed(2)} per transaction in rewards
                      </p>
                    </div>
                  )}

                  {summaryStats.growthRate > 10 && (
                    <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                      <h4 className="font-medium text-yellow-900">Spending Alert</h4>
                      <p className="text-sm text-yellow-700">
                        Your spending has increased by {summaryStats.growthRate.toFixed(1)}% - consider reviewing your budget
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
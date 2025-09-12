import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { RecurringPayment } from "@shared/schema";
import { Plus, Calendar, DollarSign, AlertCircle, Pause, Play } from "lucide-react";
import { format, addDays, differenceInDays } from "date-fns";

export default function RecurringPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: recurringPayments, isLoading, error } = useQuery<RecurringPayment[]>({
    queryKey: ["/api/recurring-payments"],
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

  const getFrequencyDisplay = (frequency: string) => {
    const frequencies: { [key: string]: string } = {
      'monthly': 'Monthly',
      'yearly': 'Yearly',
      'weekly': 'Weekly',
      'quarterly': 'Quarterly'
    };
    return frequencies[frequency] || frequency;
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'streaming': '📺',
      'utilities': '⚡',
      'insurance': '🛡️',
      'software': '💻',
      'fitness': '💪',
      'subscriptions': '📱'
    };
    return icons[category] || '💳';
  };

  const getDaysUntilNext = (nextPaymentDate: string | Date) => {
    return differenceInDays(new Date(nextPaymentDate), new Date());
  };

  const getStatusColor = (payment: RecurringPayment) => {
    if (!payment.isActive) return 'bg-gray-500';
    if (payment.isPaused) return 'bg-yellow-500';
    
    const daysUntil = getDaysUntilNext(payment.nextPaymentDate);
    if (daysUntil <= 3) return 'bg-red-500';
    if (daysUntil <= 7) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (isLoading) {
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const activePayments = recurringPayments?.filter((p: RecurringPayment) => p.isActive) || [];
  const pausedPayments = recurringPayments?.filter((p: RecurringPayment) => p.isPaused) || [];
  const totalMonthlyAmount = activePayments.reduce((sum: number, p: RecurringPayment) => {
    const amount = parseFloat(p.amount);
    switch (p.frequency) {
      case 'weekly':
        return sum + (amount * 4.33); // approximate monthly
      case 'quarterly':
        return sum + (amount / 3);
      case 'yearly':
        return sum + (amount / 12);
      default: // monthly
        return sum + amount;
    }
  }, 0);

  const upcomingPayments = activePayments
    .filter((p: RecurringPayment) => getDaysUntilNext(p.nextPaymentDate) <= 7)
    .sort((a: RecurringPayment, b: RecurringPayment) => 
      new Date(a.nextPaymentDate).getTime() - new Date(b.nextPaymentDate).getTime()
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-recurring-title">Recurring Payments</h1>
          <p className="text-muted-foreground">
            Track subscriptions and recurring payments
          </p>
        </div>
        <Button data-testid="button-add-recurring">
          <Plus className="h-4 w-4 mr-2" />
          Add Subscription
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-monthly-total">
              {formatCurrency(totalMonthlyAmount.toString())}
            </div>
            <p className="text-xs text-muted-foreground">
              Estimated monthly cost
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="stat-active-count">
              {activePayments.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paused</CardTitle>
            <Pause className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="stat-paused-count">
              {pausedPayments.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Temporarily paused
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due This Week</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600" data-testid="stat-due-this-week">
              {upcomingPayments.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Payments due soon
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Payments */}
      {upcomingPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Upcoming Payments
            </CardTitle>
            <CardDescription>
              Payments due in the next 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingPayments.map((payment: RecurringPayment) => {
                const daysUntil = getDaysUntilNext(payment.nextPaymentDate);
                return (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                    data-testid={`upcoming-payment-${payment.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{getCategoryIcon(payment.category)}</div>
                      <div>
                        <div className="font-medium">{payment.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(payment.nextPaymentDate), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(payment.amount)}</div>
                      <Badge variant={daysUntil <= 1 ? "destructive" : "secondary"}>
                        {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil} days`}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Recurring Payments */}
      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions</CardTitle>
          <CardDescription>
            Manage your recurring payments and subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(!recurringPayments || recurringPayments.length === 0) ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Recurring Payments</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking your subscriptions and recurring payments
              </p>
              <Button data-testid="button-add-first-recurring">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Subscription
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recurringPayments.map((payment: RecurringPayment) => (
                <Card 
                  key={payment.id} 
                  className="hover-elevate"
                  data-testid={`recurring-card-${payment.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-2xl">{getCategoryIcon(payment.category)}</div>
                        <Badge variant="outline" className="capitalize">
                          {payment.category}
                        </Badge>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(payment)}`} />
                    </div>
                    <CardTitle className="text-lg">{payment.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="text-2xl font-bold">
                          {formatCurrency(payment.amount)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {getFrequencyDisplay(payment.frequency)}
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Next Payment:</span>
                          <span>{format(new Date(payment.nextPaymentDate), 'MMM d')}</span>
                        </div>
                        {payment.lastPaymentDate && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Last Payment:</span>
                            <span>{format(new Date(payment.lastPaymentDate), 'MMM d')}</span>
                          </div>
                        )}
                        {payment.annualCost && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Annual Cost:</span>
                            <span className="font-semibold">{formatCurrency(payment.annualCost)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        {payment.isActive ? (
                          <Badge variant="secondary" className="text-green-600">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-gray-600">
                            Inactive
                          </Badge>
                        )}
                        {payment.isPaused && (
                          <Badge variant="outline" className="text-yellow-600">
                            Paused
                          </Badge>
                        )}
                        {payment.reminderEnabled && (
                          <Badge variant="outline" className="text-blue-600">
                            Reminders
                          </Badge>
                        )}
                      </div>

                      {payment.website && (
                        <div className="pt-2 border-t">
                          <div className="text-xs text-muted-foreground truncate">
                            {payment.website}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
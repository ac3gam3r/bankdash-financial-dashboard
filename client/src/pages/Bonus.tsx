import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { BankBonus, CreditCardBonus } from "@shared/schema";
import { Plus, Gift, CreditCard, Building, TrendingUp, Calendar } from "lucide-react";
import { format, differenceInDays } from "date-fns";

export default function BonusPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: bankBonuses, isLoading: bankLoading, error: bankError } = useQuery<BankBonus[]>({
    queryKey: ["/api/bank-bonuses"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: creditCardBonuses, isLoading: ccLoading, error: ccError } = useQuery<CreditCardBonus[]>({
    queryKey: ["/api/credit-card-bonuses"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Handle unauthorized errors
  if ((bankError && isUnauthorizedError(bankError as Error)) || 
      (ccError && isUnauthorizedError(ccError as Error))) {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'earned':
      case 'received':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'expired':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'earned':
      case 'received':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'expired':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getDaysRemaining = (deadline: string | Date) => {
    return differenceInDays(new Date(deadline), new Date());
  };

  if (bankLoading || ccLoading) {
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
        <Skeleton className="h-96" />
      </div>
    );
  }

  const totalBankBonuses = bankBonuses?.reduce((sum: number, bonus: BankBonus) => 
    sum + parseFloat(bonus.bonusAmount), 0) || 0;
  
  const totalCreditCardBonuses = creditCardBonuses?.reduce((sum: number, bonus: CreditCardBonus) => 
    sum + parseFloat(bonus.bonusValue || bonus.bonusAmount), 0) || 0;

  const pendingBankBonuses = bankBonuses?.filter((bonus: BankBonus) => 
    bonus.status === 'pending' && !bonus.requirementsMet) || [];
  
  const pendingCreditCardBonuses = creditCardBonuses?.filter((bonus: CreditCardBonus) => 
    bonus.status === 'pending' && !bonus.requirementsMet) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-bonus-title">Bonus Tracking</h1>
          <p className="text-muted-foreground">
            Track bank account and credit card signup bonuses
          </p>
        </div>
        <Button data-testid="button-add-bonus">
          <Plus className="h-4 w-4 mr-2" />
          Add Bonus
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bank Bonuses</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="stat-total-bank-bonuses">
              {formatCurrency(totalBankBonuses.toString())}
            </div>
            <p className="text-xs text-muted-foreground">
              All-time earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credit Card Bonuses</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600" data-testid="stat-total-cc-bonuses">
              {formatCurrency(totalCreditCardBonuses.toString())}
            </div>
            <p className="text-xs text-muted-foreground">
              All-time value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Bank</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="stat-pending-bank">
              {pendingBankBonuses.length}
            </div>
            <p className="text-xs text-muted-foreground">
              In progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Credit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600" data-testid="stat-pending-cc">
              {pendingCreditCardBonuses.length}
            </div>
            <p className="text-xs text-muted-foreground">
              In progress
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bonus Tabs */}
      <Tabs defaultValue="bank" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bank" data-testid="tab-bank-bonuses">
            Bank Bonuses ({bankBonuses?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="credit" data-testid="tab-credit-bonuses">
            Credit Card Bonuses ({creditCardBonuses?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bank" className="space-y-4">
          {(!bankBonuses || bankBonuses.length === 0) ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Bank Bonuses</h3>
                <p className="text-muted-foreground text-center mb-4 max-w-md">
                  Start tracking bank account signup bonuses to maximize your earnings from new account promotions.
                </p>
                <Button data-testid="button-add-first-bank-bonus">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Bank Bonus
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bankBonuses.map((bonus: BankBonus) => (
                <Card 
                  key={bonus.id} 
                  className="hover-elevate"
                  data-testid={`bank-bonus-card-${bonus.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant={getStatusVariant(bonus.status)} className="capitalize">
                        {bonus.status}
                      </Badge>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(bonus.status)}`} />
                    </div>
                    <CardTitle className="text-lg">{bonus.bankName}</CardTitle>
                    <CardDescription>{bonus.bonusType} bonus</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="text-3xl font-bold text-green-600">
                          {formatCurrency(bonus.bonusAmount)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Bonus Amount
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        {bonus.signupDate && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Signup:</span>
                            <span>{format(new Date(bonus.signupDate), 'MMM d, yyyy')}</span>
                          </div>
                        )}
                        {bonus.requirementsDeadline && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Deadline:</span>
                            <span className={getDaysRemaining(bonus.requirementsDeadline) < 30 ? 'text-red-600 font-semibold' : ''}>
                              {format(new Date(bonus.requirementsDeadline), 'MMM d, yyyy')}
                            </span>
                          </div>
                        )}
                        {bonus.bonusReceivedDate && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Received:</span>
                            <span>{format(new Date(bonus.bonusReceivedDate), 'MMM d, yyyy')}</span>
                          </div>
                        )}
                      </div>

                      {bonus.requirementsDescription && (
                        <div className="pt-2 border-t">
                          <div className="text-sm text-muted-foreground">
                            <strong>Requirements:</strong> {bonus.requirementsDescription}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Badge variant={bonus.requirementsMet ? "default" : "secondary"}>
                          {bonus.requirementsMet ? "Requirements Met" : "In Progress"}
                        </Badge>
                        {bonus.form1099Received && (
                          <Badge variant="outline" className="text-blue-600">
                            1099 Received
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="credit" className="space-y-4">
          {(!creditCardBonuses || creditCardBonuses.length === 0) ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Credit Card Bonuses</h3>
                <p className="text-muted-foreground text-center mb-4 max-w-md">
                  Track credit card signup bonuses to maximize your rewards from new card applications.
                </p>
                <Button data-testid="button-add-first-cc-bonus">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Credit Card Bonus
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {creditCardBonuses.map((bonus: CreditCardBonus) => {
                const spendProgress = bonus.spendRequirement ? 
                  (parseFloat(bonus.currentSpend) / parseFloat(bonus.spendRequirement)) * 100 : 0;

                return (
                  <Card 
                    key={bonus.id} 
                    className="hover-elevate"
                    data-testid={`cc-bonus-card-${bonus.id}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge variant={getStatusVariant(bonus.status)} className="capitalize">
                          {bonus.status}
                        </Badge>
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(bonus.status)}`} />
                      </div>
                      <CardTitle className="text-lg">{bonus.cardName}</CardTitle>
                      <CardDescription>{bonus.bankName}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="text-3xl font-bold text-purple-600">
                            {formatCurrency(bonus.bonusValue || bonus.bonusAmount)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {bonus.bonusAmount} {bonus.bonusType}
                            {bonus.bonusValue && ` (${formatCurrency(bonus.bonusValue)} value)`}
                          </div>
                        </div>

                        {bonus.spendRequirement && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Spending Progress</span>
                              <span>{Math.round(spendProgress)}%</span>
                            </div>
                            <Progress value={spendProgress} className="h-2" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{formatCurrency(bonus.currentSpend)}</span>
                              <span>{formatCurrency(bonus.spendRequirement)}</span>
                            </div>
                          </div>
                        )}

                        <div className="space-y-2 text-sm">
                          {bonus.applicationDate && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Applied:</span>
                              <span>{format(new Date(bonus.applicationDate), 'MMM d, yyyy')}</span>
                            </div>
                          )}
                          {bonus.spendDeadline && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Deadline:</span>
                              <span className={getDaysRemaining(bonus.spendDeadline) < 30 ? 'text-red-600 font-semibold' : ''}>
                                {format(new Date(bonus.spendDeadline), 'MMM d, yyyy')}
                              </span>
                            </div>
                          )}
                          {bonus.bonusReceivedDate && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Received:</span>
                              <span>{format(new Date(bonus.bonusReceivedDate), 'MMM d, yyyy')}</span>
                            </div>
                          )}
                          {bonus.annualFee && parseFloat(bonus.annualFee) > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Annual Fee:</span>
                              <span className="text-red-600">{formatCurrency(bonus.annualFee)}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant={bonus.requirementsMet ? "default" : "secondary"}>
                            {bonus.requirementsMet ? "Requirements Met" : "In Progress"}
                          </Badge>
                          {bonus.feeWaivedFirstYear && (
                            <Badge variant="outline" className="text-green-600">
                              Fee Waived
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
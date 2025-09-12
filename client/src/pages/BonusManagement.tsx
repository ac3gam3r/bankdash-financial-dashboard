import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { type BankBonus, type CreditCardBonus } from "@shared/schema";
import AddBonusForm from "@/components/AddBonusForm";
import { 
  Plus, 
  Filter, 
  Search, 
  DollarSign, 
  CreditCard, 
  Landmark, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Gift,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  RefreshCw
} from "lucide-react";
import { format, differenceInDays, parseISO, isBefore } from "date-fns";

type CombinedBonus = (BankBonus & { bonusCategory: 'bank' }) | (CreditCardBonus & { bonusCategory: 'creditCard' });

export default function BonusManagement() {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedBonus, setSelectedBonus] = useState<CombinedBonus | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Fetch both bank and credit card bonuses
  const { data: bankBonuses = [], isLoading: bankLoading } = useQuery<BankBonus[]>({
    queryKey: ["/api/bank-bonuses"],
  });

  const { data: creditCardBonuses = [], isLoading: ccLoading } = useQuery<CreditCardBonus[]>({
    queryKey: ["/api/credit-card-bonuses"],
  });

  // Update mutations for status changes
  const updateBankBonusMutation = useMutation({
    mutationFn: async ({ bonusId, updates }: { bonusId: string; updates: Partial<BankBonus> }) => {
      return apiRequest("PATCH", `/api/bank-bonuses/${bonusId}`, updates);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Bank bonus updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bank-bonuses"] });
      setUpdatingStatus(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update bank bonus",
        variant: "destructive",
      });
      setUpdatingStatus(null);
    },
  });

  const updateCreditCardBonusMutation = useMutation({
    mutationFn: async ({ bonusId, updates }: { bonusId: string; updates: Partial<CreditCardBonus> }) => {
      return apiRequest("PATCH", `/api/credit-card-bonuses/${bonusId}`, updates);
    },
    onSuccess: () => {
      toast({
        title: "Success", 
        description: "Credit card bonus updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/credit-card-bonuses"] });
      setUpdatingStatus(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update credit card bonus",
        variant: "destructive",
      });
      setUpdatingStatus(null);
    },
  });

  // Delete mutations
  const deleteBankBonusMutation = useMutation({
    mutationFn: async (bonusId: string) => {
      return apiRequest("DELETE", `/api/bank-bonuses/${bonusId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Bank bonus deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bank-bonuses"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete bank bonus",
        variant: "destructive",
      });
    },
  });

  const deleteCreditCardBonusMutation = useMutation({
    mutationFn: async (bonusId: string) => {
      return apiRequest("DELETE", `/api/credit-card-bonuses/${bonusId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Credit card bonus deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/credit-card-bonuses"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete credit card bonus",
        variant: "destructive",
      });
    },
  });

  // Combine and process bonuses
  const combinedBonuses: CombinedBonus[] = [
    ...bankBonuses.map(bonus => ({ ...bonus, bonusCategory: 'bank' as const })),
    ...creditCardBonuses.map(bonus => ({ ...bonus, bonusCategory: 'creditCard' as const }))
  ];

  // Auto-expire overdue bonuses (runs once on load)
  useEffect(() => {
    if (!combinedBonuses.length) return;
    
    const expiredBonuses = combinedBonuses.filter(bonus => {
      if (bonus.status !== 'pending') return false;
      
      const deadline = bonus.bonusCategory === 'bank' 
        ? (bonus as BankBonus & { bonusCategory: 'bank' }).requirementsDeadline
        : (bonus as CreditCardBonus & { bonusCategory: 'creditCard' }).spendDeadline;
      
      if (!deadline) return false;
      
      const deadlineDate = typeof deadline === 'string' ? parseISO(deadline) : deadline;
      return isBefore(deadlineDate, new Date());
    });
    
    // Auto-expire overdue bonuses
    if (expiredBonuses.length > 0) {
      console.log(`Auto-expiring ${expiredBonuses.length} overdue bonuses`);
      
      expiredBonuses.forEach(bonus => {
        const updates = { 
          status: 'expired' as const,
          requirementsMet: false 
        };
        
        if (bonus.bonusCategory === 'bank') {
          updateBankBonusMutation.mutate({ bonusId: bonus.id, updates });
        } else {
          updateCreditCardBonusMutation.mutate({ bonusId: bonus.id, updates });
        }
      });
    }
  }, [combinedBonuses.length]); // Only trigger when count changes

  // Filter bonuses
  const filteredBonuses = combinedBonuses.filter((bonus) => {
    const matchesSearch = searchTerm === "" || 
      (bonus.bonusCategory === 'bank' ? 
        bonus.bankName.toLowerCase().includes(searchTerm.toLowerCase()) :
        (bonus as CreditCardBonus & { bonusCategory: 'creditCard' }).cardName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        bonus.bankName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || bonus.status === statusFilter;
    const matchesType = typeFilter === "all" || bonus.bonusCategory === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Stats calculations
  const stats = {
    total: combinedBonuses.length,
    pending: combinedBonuses.filter(b => b.status === 'pending').length,
    earned: combinedBonuses.filter(b => b.status === 'earned').length,
    received: combinedBonuses.filter(b => b.status === 'received').length,
    totalValue: combinedBonuses
      .filter(b => b.status === 'received')
      .reduce((sum, bonus) => {
        const amount = bonus.bonusCategory === 'creditCard' && 'bonusValue' in bonus && bonus.bonusValue 
          ? parseFloat(bonus.bonusValue) 
          : parseFloat(bonus.bonusAmount);
        return sum + amount;
      }, 0)
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
      case 'earned':
        return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />Earned</Badge>;
      case 'received':
        return <Badge variant="default" className="flex items-center gap-1 bg-green-500"><Gift className="h-3 w-3" />Received</Badge>;
      case 'expired':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDeadlineWarning = (bonus: CombinedBonus) => {
    const deadline = bonus.bonusCategory === 'bank' 
      ? (bonus as BankBonus & { bonusCategory: 'bank' }).requirementsDeadline
      : (bonus as CreditCardBonus & { bonusCategory: 'creditCard' }).spendDeadline;
    
    if (!deadline || bonus.status !== 'pending') return null;
    
    const deadlineDate = typeof deadline === 'string' ? parseISO(deadline) : deadline;
    const daysLeft = differenceInDays(deadlineDate, new Date());
    
    if (daysLeft < 0) return { type: 'expired', days: Math.abs(daysLeft) };
    if (daysLeft <= 7) return { type: 'urgent', days: daysLeft };
    if (daysLeft <= 30) return { type: 'warning', days: daysLeft };
    return null;
  };

  const getSpendingProgress = (bonus: CombinedBonus) => {
    if (bonus.bonusCategory !== 'creditCard' || !bonus.spendRequirement) return null;
    
    const required = parseFloat(bonus.spendRequirement);
    const current = parseFloat(bonus.currentSpend || '0');
    const percentage = (current / required) * 100;
    
    return { current, required, percentage: Math.min(percentage, 100) };
  };

  const updateBonusStatus = (bonus: CombinedBonus, newStatus: string) => {
    setUpdatingStatus(bonus.id);
    const updates = { 
      status: newStatus,
      requirementsMet: newStatus === 'earned' || newStatus === 'received',
      bonusReceivedDate: newStatus === 'received' ? new Date().toISOString() : undefined
    };

    if (bonus.bonusCategory === 'bank') {
      updateBankBonusMutation.mutate({ bonusId: bonus.id, updates });
    } else {
      updateCreditCardBonusMutation.mutate({ bonusId: bonus.id, updates });
    }
  };

  const handleDeleteBonus = (bonus: CombinedBonus) => {
    if (window.confirm(`Are you sure you want to delete this ${bonus.bonusCategory === 'bank' ? 'bank' : 'credit card'} bonus?`)) {
      if (bonus.bonusCategory === 'bank') {
        deleteBankBonusMutation.mutate(bonus.id);
      } else {
        deleteCreditCardBonusMutation.mutate(bonus.id);
      }
    }
  };

  const isLoading = bankLoading || ccLoading;

  // Get urgent deadline alerts
  const urgentAlerts = combinedBonuses.filter(bonus => {
    const warning = getDeadlineWarning(bonus);
    return warning && (warning.type === 'urgent' || warning.type === 'expired');
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-6" />
                    <div>
                      <Skeleton className="h-6 w-40" />
                      <Skeleton className="h-4 w-32 mt-2" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <div className="grid grid-cols-4 gap-4 mt-4">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j}>
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-20 mt-1" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Urgent Deadline Alerts */}
      {urgentAlerts.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            <strong>Deadline Alerts:</strong> You have {urgentAlerts.length} bonus{urgentAlerts.length > 1 ? 'es' : ''} with urgent deadlines. 
            {urgentAlerts.slice(0, 2).map((bonus, idx) => {
              const warning = getDeadlineWarning(bonus);
              return (
                <span key={bonus.id} className="ml-2">
                  {bonus.bonusCategory === 'bank' ? bonus.bankName : (bonus as CreditCardBonus & { bonusCategory: 'creditCard' }).cardName} 
                  ({warning?.type === 'expired' ? `expired ${warning.days}d ago` : `${warning?.days}d left`}){idx < Math.min(urgentAlerts.length, 2) - 1 ? ',' : ''}
                </span>
              );
            })}
            {urgentAlerts.length > 2 && <span className="ml-2">and {urgentAlerts.length - 2} more...</span>}
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Bank Bonus Management</h1>
          <p className="text-muted-foreground">Track signup bonuses, requirements, and earnings</p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-bonus">
              <Plus className="mr-2 h-4 w-4" />
              Add Bonus
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Bonus</DialogTitle>
              <DialogDescription>
                Track a new bank account or credit card signup bonus
              </DialogDescription>
            </DialogHeader>
            <AddBonusForm 
              onSuccess={() => setShowAddDialog(false)}
              onCancel={() => setShowAddDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bonuses</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600" data-testid="stat-pending">{stats.pending}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Earned</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="stat-earned">{stats.earned}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Received</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="stat-received">{stats.received}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="stat-value">
              ${stats.totalValue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by bank name, card name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="earned">Earned</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]" data-testid="select-type-filter">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="bank">Bank Bonuses</SelectItem>
                <SelectItem value="creditCard">Credit Cards</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bonuses List */}
      <div className="grid gap-4">
        {filteredBonuses.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Gift className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No bonuses found</h3>
              <p className="text-muted-foreground mb-4">
                {combinedBonuses.length === 0 
                  ? "Start tracking your bank and credit card signup bonuses"
                  : "Try adjusting your search or filters"
                }
              </p>
              {combinedBonuses.length === 0 && (
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Bonus
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredBonuses.map((bonus) => {
            const deadlineWarning = getDeadlineWarning(bonus);
            const spendingProgress = getSpendingProgress(bonus);

            return (
              <Card key={bonus.id} className="hover-elevate" data-testid={`bonus-card-${bonus.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {bonus.bonusCategory === 'bank' ? (
                        <Landmark className="h-6 w-6 text-blue-600" />
                      ) : (
                        <CreditCard className="h-6 w-6 text-purple-600" />
                      )}
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {bonus.bonusCategory === 'bank' 
                            ? bonus.bankName 
                            : `${(bonus as CreditCardBonus & { bonusCategory: 'creditCard' }).cardName} - ${bonus.bankName}`
                          }
                          {deadlineWarning && (
                            <Badge 
                              variant={deadlineWarning.type === 'expired' ? 'destructive' : 'outline'}
                              className="ml-2"
                            >
                              {deadlineWarning.type === 'expired' 
                                ? `Expired ${deadlineWarning.days}d ago`
                                : `${deadlineWarning.days}d left`
                              }
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4">
                          <span className="font-semibold text-green-600">
                            ${parseFloat(bonus.bonusAmount).toLocaleString()}
                          </span>
                          <span className="capitalize">{bonus.bonusType} bonus</span>
                          {getStatusBadge(bonus.status || 'pending')}
                        </CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Status Update Buttons */}
                      {bonus.status === 'pending' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateBonusStatus(bonus, 'earned')}
                          disabled={updatingStatus === bonus.id}
                          data-testid={`button-mark-earned-${bonus.id}`}
                          className="text-xs"
                        >
                          {updatingStatus === bonus.id ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Mark Earned
                            </>
                          )}
                        </Button>
                      )}
                      
                      {bonus.status === 'earned' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateBonusStatus(bonus, 'received')}
                          disabled={updatingStatus === bonus.id}
                          data-testid={`button-mark-received-${bonus.id}`}
                          className="text-xs bg-green-50 border-green-200 text-green-700"
                        >
                          {updatingStatus === bonus.id ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <Gift className="h-3 w-3 mr-1" />
                              Mark Received
                            </>
                          )}
                        </Button>
                      )}

                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => setSelectedBonus(bonus)}
                        data-testid={`button-view-${bonus.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handleDeleteBonus(bonus)}
                        data-testid={`button-delete-${bonus.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {/* Credit Card Spending Progress */}
                  {spendingProgress && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Spending Progress</span>
                        <span>
                          ${spendingProgress.current.toLocaleString()} / ${spendingProgress.required.toLocaleString()}
                        </span>
                      </div>
                      <Progress 
                        value={spendingProgress.percentage} 
                        className="h-2"
                        data-testid={`progress-${bonus.id}`}
                      />
                    </div>
                  )}

                  {/* Key Information */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {bonus.bonusCategory === 'bank' ? (
                      <>
                        {bonus.signupDate && (
                          <div>
                            <span className="text-muted-foreground">Signup:</span>
                            <p className="font-medium">
                              {format(parseISO(bonus.signupDate), 'MMM d, yyyy')}
                            </p>
                          </div>
                        )}
                        {bonus.requirementsDeadline && (
                          <div>
                            <span className="text-muted-foreground">Deadline:</span>
                            <p className="font-medium">
                              {format(parseISO(bonus.requirementsDeadline), 'MMM d, yyyy')}
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {bonus.applicationDate && (
                          <div>
                            <span className="text-muted-foreground">Applied:</span>
                            <p className="font-medium">
                              {format(parseISO(bonus.applicationDate), 'MMM d, yyyy')}
                            </p>
                          </div>
                        )}
                        {bonus.spendDeadline && (
                          <div>
                            <span className="text-muted-foreground">Deadline:</span>
                            <p className="font-medium">
                              {format(parseISO(bonus.spendDeadline), 'MMM d, yyyy')}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                    
                    <div>
                      <span className="text-muted-foreground">Requirements:</span>
                      <p className="font-medium">
                        {bonus.requirementsMet ? (
                          <span className="text-green-600">✓ Met</span>
                        ) : (
                          <span className="text-orange-600">Pending</span>
                        )}
                      </p>
                    </div>
                    
                    {bonus.bonusReceivedDate && (
                      <div>
                        <span className="text-muted-foreground">Received:</span>
                        <p className="font-medium text-green-600">
                          {format(parseISO(bonus.bonusReceivedDate), 'MMM d, yyyy')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Requirements Description */}
                  {bonus.bonusCategory === 'bank' && (bonus as BankBonus & { bonusCategory: 'bank' }).requirementsDescription && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-md">
                      <span className="text-sm text-muted-foreground">Requirements:</span>
                      <p className="text-sm mt-1">{(bonus as BankBonus & { bonusCategory: 'bank' }).requirementsDescription}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Bonus Details Dialog */}
      <Dialog open={!!selectedBonus} onOpenChange={(open) => !open && setSelectedBonus(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedBonus?.bonusCategory === 'bank' ? (
                <Landmark className="h-5 w-5" />
              ) : (
                <CreditCard className="h-5 w-5" />
              )}
              {selectedBonus?.bonusCategory === 'bank' 
                ? selectedBonus.bankName 
                : `${selectedBonus?.cardName} - ${selectedBonus?.bankName}`
              }
            </DialogTitle>
            <DialogDescription>
              Complete bonus details and tracking information
            </DialogDescription>
          </DialogHeader>
          
          {selectedBonus && (
            <div className="space-y-4">
              {/* Detailed info would go here */}
              <div className="text-center py-4">
                <p className="text-muted-foreground">
                  Detailed bonus information view coming soon
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
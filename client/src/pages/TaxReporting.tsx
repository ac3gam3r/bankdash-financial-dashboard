import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Calculator,
  Download,
  FileText,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Receipt,
  TrendingUp
} from "lucide-react";
import { type BankBonus, type CreditCardBonus } from "@shared/schema";

type CombinedBonus = (BankBonus & { bonusCategory: 'bank' }) | (CreditCardBonus & { bonusCategory: 'creditCard' });

export default function TaxReporting() {
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  
  // Fetch bonuses
  const { data: bankBonuses = [], isLoading: bankLoading } = useQuery<BankBonus[]>({
    queryKey: ["/api/bank-bonuses"],
  });

  const { data: creditCardBonuses = [], isLoading: ccLoading } = useQuery<CreditCardBonus[]>({
    queryKey: ["/api/credit-card-bonuses"],
  });

  // Combine bonuses
  const allBonuses: CombinedBonus[] = [
    ...bankBonuses.map(bonus => ({ ...bonus, bonusCategory: 'bank' as const })),
    ...creditCardBonuses.map(bonus => ({ ...bonus, bonusCategory: 'creditCard' as const }))
  ];

  // Filter received bonuses for selected year
  const receivedBonuses = useMemo(() => {
    return allBonuses.filter(bonus => {
      if (bonus.status !== 'received' || !bonus.bonusReceivedDate) return false;
      
      const receivedDate = new Date(bonus.bonusReceivedDate);
      const bonusYear = receivedDate.getFullYear();
      return bonusYear.toString() === selectedYear;
    });
  }, [allBonuses, selectedYear]);

  // Calculate tax summary
  const taxSummary = useMemo(() => {
    const taxableBonuses = receivedBonuses.filter(bonus => bonus.isTaxable !== false);
    const nonTaxableBonuses = receivedBonuses.filter(bonus => bonus.isTaxable === false);
    
    const totalTaxableAmount = taxableBonuses.reduce((sum, bonus) => {
      const amount = bonus.taxableAmount ? parseFloat(bonus.taxableAmount) : parseFloat(bonus.bonusAmount);
      return sum + amount;
    }, 0);
    
    const totalNonTaxableAmount = nonTaxableBonuses.reduce((sum, bonus) => {
      const amount = parseFloat(bonus.bonusAmount);
      return sum + amount;
    }, 0);
    
    const form1099Count = taxableBonuses.filter(bonus => bonus.form1099Received).length;
    const pendingForm1099Count = taxableBonuses.filter(bonus => !bonus.form1099Received).length;
    
    return {
      taxableBonuses,
      nonTaxableBonuses,
      totalTaxableAmount,
      totalNonTaxableAmount,
      totalBonuses: receivedBonuses.length,
      form1099Count,
      pendingForm1099Count
    };
  }, [receivedBonuses]);

  // Available years
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    allBonuses.forEach(bonus => {
      if (bonus.bonusReceivedDate) {
        const year = new Date(bonus.bonusReceivedDate).getFullYear().toString();
        years.add(year);
      }
    });
    // Add current year if no bonuses exist
    years.add(new Date().getFullYear().toString());
    return Array.from(years).sort().reverse();
  }, [allBonuses]);

  const exportTaxData = () => {
    const taxData = {
      year: selectedYear,
      summary: taxSummary,
      bonuses: receivedBonuses.map(bonus => ({
        id: bonus.id,
        type: bonus.bonusCategory,
        name: bonus.bonusCategory === 'bank' ? bonus.bankName : (bonus as CreditCardBonus & { bonusCategory: 'creditCard' }).cardName,
        bonusAmount: bonus.bonusAmount,
        taxableAmount: bonus.taxableAmount || bonus.bonusAmount,
        isTaxable: bonus.isTaxable !== false,
        form1099Received: bonus.form1099Received,
        receivedDate: bonus.bonusReceivedDate,
        notes: bonus.notes
      }))
    };
    
    const blob = new Blob([JSON.stringify(taxData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tax-report-${selectedYear}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const headers = [
      'Bonus Type',
      'Institution',
      'Bonus Amount',
      'Taxable Amount', 
      'Is Taxable',
      'Form 1099 Received',
      'Received Date',
      'Notes'
    ];
    
    const rows = receivedBonuses.map(bonus => [
      bonus.bonusCategory === 'bank' ? 'Bank Bonus' : 'Credit Card Bonus',
      bonus.bonusCategory === 'bank' ? bonus.bankName : (bonus as CreditCardBonus & { bonusCategory: 'creditCard' }).cardName,
      `$${bonus.bonusAmount}`,
      `$${bonus.taxableAmount || bonus.bonusAmount}`,
      bonus.isTaxable !== false ? 'Yes' : 'No',
      bonus.form1099Received ? 'Yes' : 'No',
      bonus.bonusReceivedDate || '',
      bonus.notes || ''
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bonus-tax-report-${selectedYear}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (bankLoading || ccLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading tax information...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Tax Reporting</h1>
          <p className="text-muted-foreground">Track taxable bonuses and prepare tax documents</p>
        </div>
        
        {/* Year Selector */}
        <div className="flex items-center gap-4">
          <Label htmlFor="year-select">Tax Year:</Label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32" data-testid="select-tax-year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tax Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Taxable</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${taxSummary.totalTaxableAmount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {taxSummary.taxableBonuses.length} bonus{taxSummary.taxableBonuses.length !== 1 ? 'es' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Non-Taxable</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${taxSummary.totalNonTaxableAmount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {taxSummary.nonTaxableBonuses.length} bonus{taxSummary.nonTaxableBonuses.length !== 1 ? 'es' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">1099 Forms</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {taxSummary.form1099Count}
            </div>
            <p className="text-xs text-muted-foreground">
              {taxSummary.pendingForm1099Count} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bonuses</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {taxSummary.totalBonuses}
            </div>
            <p className="text-xs text-muted-foreground">
              received in {selectedYear}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Export Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Export Tax Documents</CardTitle>
          <CardDescription>
            Download your tax information for {selectedYear} in various formats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={exportCSV}
              variant="outline"
              data-testid="button-export-csv"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button 
              onClick={exportTaxData}
              variant="outline"
              data-testid="button-export-json"
            >
              <FileText className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Bonus List */}
      <Tabs defaultValue="taxable" className="space-y-4">
        <TabsList>
          <TabsTrigger value="taxable">Taxable Bonuses ({taxSummary.taxableBonuses.length})</TabsTrigger>
          <TabsTrigger value="non-taxable">Non-Taxable ({taxSummary.nonTaxableBonuses.length})</TabsTrigger>
          <TabsTrigger value="all">All Bonuses ({taxSummary.totalBonuses})</TabsTrigger>
        </TabsList>

        <TabsContent value="taxable" className="space-y-4">
          {taxSummary.taxableBonuses.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  No taxable bonuses for {selectedYear}
                </div>
              </CardContent>
            </Card>
          ) : (
            taxSummary.taxableBonuses.map(bonus => (
              <Card key={bonus.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {bonus.bonusCategory === 'bank' ? bonus.bankName : (bonus as CreditCardBonus & { bonusCategory: 'creditCard' }).cardName}
                      </CardTitle>
                      <CardDescription>
                        {bonus.bonusCategory === 'bank' ? 'Bank Bonus' : 'Credit Card Bonus'} • 
                        Received: {bonus.bonusReceivedDate ? new Date(bonus.bonusReceivedDate).toLocaleDateString() : 'N/A'}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Taxable
                      </Badge>
                      {bonus.form1099Received ? (
                        <Badge variant="default" className="bg-blue-50 text-blue-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          1099 Received
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                          <XCircle className="h-3 w-3 mr-1" />
                          1099 Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Bonus Amount</Label>
                      <div className="font-semibold">${bonus.bonusAmount}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Taxable Amount</Label>
                      <div className="font-semibold text-green-600">
                        ${bonus.taxableAmount || bonus.bonusAmount}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Tax Year</Label>
                      <div className="font-semibold">{bonus.taxYear || selectedYear}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <div className="font-semibold">Received</div>
                    </div>
                  </div>
                  {bonus.notes && (
                    <div className="mt-3 pt-3 border-t">
                      <Label className="text-xs text-muted-foreground">Notes</Label>
                      <p className="text-sm mt-1">{bonus.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="non-taxable" className="space-y-4">
          {taxSummary.nonTaxableBonuses.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  No non-taxable bonuses for {selectedYear}
                </div>
              </CardContent>
            </Card>
          ) : (
            taxSummary.nonTaxableBonuses.map(bonus => (
              <Card key={bonus.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {bonus.bonusCategory === 'bank' ? bonus.bankName : (bonus as CreditCardBonus & { bonusCategory: 'creditCard' }).cardName}
                      </CardTitle>
                      <CardDescription>
                        {bonus.bonusCategory === 'bank' ? 'Bank Bonus' : 'Credit Card Bonus'} • 
                        Received: {bonus.bonusReceivedDate ? new Date(bonus.bonusReceivedDate).toLocaleDateString() : 'N/A'}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      Non-Taxable
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Bonus Amount</Label>
                      <div className="font-semibold">${bonus.bonusAmount}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Tax Year</Label>
                      <div className="font-semibold">{bonus.taxYear || selectedYear}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <div className="font-semibold">Received</div>
                    </div>
                  </div>
                  {bonus.notes && (
                    <div className="mt-3 pt-3 border-t">
                      <Label className="text-xs text-muted-foreground">Notes</Label>
                      <p className="text-sm mt-1">{bonus.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {receivedBonuses.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  No bonuses received in {selectedYear}
                </div>
              </CardContent>
            </Card>
          ) : (
            receivedBonuses.map(bonus => (
              <Card key={bonus.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {bonus.bonusCategory === 'bank' ? bonus.bankName : (bonus as CreditCardBonus & { bonusCategory: 'creditCard' }).cardName}
                      </CardTitle>
                      <CardDescription>
                        {bonus.bonusCategory === 'bank' ? 'Bank Bonus' : 'Credit Card Bonus'} • 
                        Received: {bonus.bonusReceivedDate ? new Date(bonus.bonusReceivedDate).toLocaleDateString() : 'N/A'}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge 
                        variant="outline" 
                        className={bonus.isTaxable !== false ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"}
                      >
                        {bonus.isTaxable !== false ? 'Taxable' : 'Non-Taxable'}
                      </Badge>
                      {bonus.isTaxable !== false && (
                        bonus.form1099Received ? (
                          <Badge variant="default" className="bg-blue-50 text-blue-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            1099 Received
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                            <XCircle className="h-3 w-3 mr-1" />
                            1099 Pending
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Bonus Amount</Label>
                      <div className="font-semibold">${bonus.bonusAmount}</div>
                    </div>
                    {bonus.isTaxable !== false && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Taxable Amount</Label>
                        <div className="font-semibold text-green-600">
                          ${bonus.taxableAmount || bonus.bonusAmount}
                        </div>
                      </div>
                    )}
                    <div>
                      <Label className="text-xs text-muted-foreground">Tax Year</Label>
                      <div className="font-semibold">{bonus.taxYear || selectedYear}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <div className="font-semibold">Received</div>
                    </div>
                  </div>
                  {bonus.notes && (
                    <div className="mt-3 pt-3 border-t">
                      <Label className="text-xs text-muted-foreground">Notes</Label>
                      <p className="text-sm mt-1">{bonus.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
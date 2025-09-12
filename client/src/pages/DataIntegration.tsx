import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Database,
  Trash2,
  Filter,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ImportResult {
  success: boolean;
  imported: number;
  duplicates: number;
  errors: string[];
  preview?: any[];
}

interface ExportOptions {
  format: 'csv' | 'json';
  dateRange: 'all' | '3m' | '6m' | '1y';
  includeCategories: boolean;
  includeRewards: boolean;
}

export default function DataIntegration() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get import history
  const { data: importHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ["/api/data/imports"],
  });

  // CSV Import mutation
  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append('file', file);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      try {
        const response = await apiRequest("/api/data/import", {
          method: "POST",
          body: formData,
        });
        
        clearInterval(progressInterval);
        setUploadProgress(100);
        
        return response;
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: (result: ImportResult) => {
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/data/imports"] });
      
      toast({
        title: "Import Complete",
        description: `Successfully imported ${result.imported} transactions. ${result.duplicates} duplicates skipped.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import CSV file",
        variant: "destructive",
      });
    }
  });

  // CSV Export mutation
  const exportMutation = useMutation({
    mutationFn: async (options: ExportOptions) => {
      const response = await apiRequest("/api/data/export", {
        method: "POST",
        body: JSON.stringify(options),
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      // Create download link
      const blob = new Blob([response], { 
        type: options.format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `financial-data-${new Date().toISOString().split('T')[0]}.${options.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Export Complete",
        description: "Your financial data has been downloaded successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export data",
        variant: "destructive",
      });
    }
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast({
          title: "Invalid File Type",
          description: "Please select a CSV file",
          variant: "destructive",
        });
        return;
      }
      
      importMutation.mutate(file);
    }
  };

  const handleExport = (options: ExportOptions) => {
    exportMutation.mutate(options);
  };

  const resetImport = () => {
    setImportResult(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Data Integration</h1>
          <p className="text-muted-foreground">Import, export, and manage your financial data</p>
        </div>
      </div>

      <Tabs defaultValue="import" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="import">Import Data</TabsTrigger>
          <TabsTrigger value="export">Export Data</TabsTrigger>
          <TabsTrigger value="history">Import History</TabsTrigger>
        </TabsList>

        {/* Import Tab */}
        <TabsContent value="import" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Import Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  CSV Import Format
                </CardTitle>
                <CardDescription>
                  Upload transaction data from your bank or financial institutions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-2">
                  <p className="font-medium">Required CSV columns:</p>
                  <div className="bg-muted p-3 rounded-lg font-mono text-xs">
                    date, description, amount, type
                  </div>
                  <p className="font-medium">Optional columns:</p>
                  <div className="bg-muted p-3 rounded-lg font-mono text-xs">
                    category, account, rewards_earned
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Example data:</p>
                  <div className="bg-muted p-3 rounded-lg text-xs space-y-1">
                    <div>2024-01-15,Coffee Shop Purchase,-4.50,debit,Food & Dining</div>
                    <div>2024-01-16,Salary Deposit,2500.00,credit,Income</div>
                    <div>2024-01-17,Gas Station,-45.20,debit,Transportation</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upload Area */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload CSV File
                </CardTitle>
                <CardDescription>
                  Import transactions from your CSV file
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isUploading && !importResult && (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Choose a CSV file to upload
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleFileUpload}
                      className="hidden"
                      data-testid="input-csv-file"
                    />
                    <Button 
                      onClick={() => fileInputRef.current?.click()}
                      data-testid="button-select-file"
                    >
                      Select CSV File
                    </Button>
                  </div>
                )}

                {isUploading && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <Upload className="h-12 w-12 mx-auto text-blue-600 mb-4 animate-pulse" />
                      <p className="text-sm font-medium">Uploading and processing...</p>
                    </div>
                    <Progress value={uploadProgress} className="w-full" />
                    <p className="text-xs text-center text-muted-foreground">
                      {uploadProgress}% complete
                    </p>
                  </div>
                )}

                {importResult && (
                  <div className="space-y-4">
                    <Alert className={importResult.success ? "border-green-200" : "border-red-200"}>
                      {importResult.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <AlertTitle>
                        {importResult.success ? "Import Successful" : "Import Issues"}
                      </AlertTitle>
                      <AlertDescription>
                        {importResult.success 
                          ? `${importResult.imported} transactions imported successfully`
                          : `${importResult.errors.length} errors occurred during import`
                        }
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="font-semibold text-green-700">{importResult.imported}</div>
                        <div className="text-green-600">Imported</div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="font-semibold text-yellow-700">{importResult.duplicates}</div>
                        <div className="text-yellow-600">Duplicates</div>
                      </div>
                    </div>

                    {importResult.errors.length > 0 && (
                      <div className="bg-red-50 p-3 rounded-lg">
                        <p className="font-medium text-red-700 mb-2">Errors:</p>
                        <ul className="text-sm text-red-600 space-y-1">
                          {importResult.errors.slice(0, 5).map((error, index) => (
                            <li key={index}>• {error}</li>
                          ))}
                          {importResult.errors.length > 5 && (
                            <li>• ... and {importResult.errors.length - 5} more errors</li>
                          )}
                        </ul>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button onClick={resetImport} variant="outline" data-testid="button-import-another">
                        Import Another File
                      </Button>
                      <Button 
                        onClick={() => window.location.href = '/transactions'}
                        data-testid="button-view-transactions"
                      >
                        View Transactions
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Transactions
                </CardTitle>
                <CardDescription>
                  Download your transaction data in CSV format
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => handleExport({
                    format: 'csv',
                    dateRange: 'all',
                    includeCategories: true,
                    includeRewards: true
                  })}
                  disabled={exportMutation.isPending}
                  className="w-full"
                  data-testid="button-export-all-csv"
                >
                  {exportMutation.isPending ? "Exporting..." : "Export All Transactions (CSV)"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Export Analytics Data
                </CardTitle>
                <CardDescription>
                  Download financial analytics and reports
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={() => handleExport({
                      format: 'csv',
                      dateRange: '1y',
                      includeCategories: true,
                      includeRewards: true
                    })}
                    variant="outline"
                    disabled={exportMutation.isPending}
                    data-testid="button-export-year-csv"
                  >
                    Last Year (CSV)
                  </Button>
                  <Button 
                    onClick={() => handleExport({
                      format: 'json',
                      dateRange: 'all',
                      includeCategories: true,
                      includeRewards: true
                    })}
                    variant="outline"
                    disabled={exportMutation.isPending}
                    data-testid="button-export-all-json"
                  >
                    All Data (JSON)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Import History
              </CardTitle>
              <CardDescription>
                View previous data imports and their results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">Loading import history...</div>
                </div>
              ) : importHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <div className="text-muted-foreground">No import history yet</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Import your first CSV file to see history here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {importHistory.map((record: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {record.success ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <div>
                          <div className="font-medium">{record.filename}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(record.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm">
                          <Badge variant={record.success ? "default" : "destructive"}>
                            {record.imported || 0} imported
                          </Badge>
                        </div>
                        <Button variant="ghost" size="sm" data-testid={`button-delete-history-${index}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
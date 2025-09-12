import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Building2, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Link,
  Unlink,
  RefreshCw,
  Shield,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { BankConnection, BankProvider } from "@shared/schema";

interface ConnectionResult {
  success: boolean;
  bankName: string;
  accountsConnected: number;
  connection?: BankConnection;
  error?: string;
}

export default function DataIntegration() {
  const [connectionResult, setConnectionResult] = useState<ConnectionResult | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get connected banks
  const { data: connectedBanks = [], isLoading: banksLoading } = useQuery<BankConnection[]>({
    queryKey: ["/api/bank-connections"],
  });

  // Get available bank providers
  const { data: bankProviders = [], isLoading: providersLoading } = useQuery<BankProvider[]>({
    queryKey: ["/api/bank-providers"],
  });

  // Bank connection mutation
  const connectBankMutation = useMutation({
    mutationFn: async (bankId: string): Promise<ConnectionResult> => {
      setIsConnecting(true);
      
      const response = await apiRequest("/api/bank-connections/connect", "POST", { bankId });
      
      return response as unknown as ConnectionResult;
    },
    onSuccess: (result: ConnectionResult) => {
      setConnectionResult(result);
      queryClient.invalidateQueries({ queryKey: ["/api/bank-connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      
      toast({
        title: "Bank Connected",
        description: `Successfully connected to ${result.bankName}. ${result.accountsConnected} accounts synced.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to bank",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsConnecting(false);
    }
  });

  // Sync transactions mutation
  const syncTransactionsMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const response = await apiRequest(`/api/bank-connections/${connectionId}/sync`, "POST");
      
      return response;
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      
      toast({
        title: "Sync Complete",
        description: `${result.newTransactions} new transactions synced.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync transactions",
        variant: "destructive",
      });
    }
  });

  // Disconnect bank mutation
  const disconnectBankMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const response = await apiRequest(`/api/bank-connections/${connectionId}`, "DELETE");
      
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-connections"] });
      
      toast({
        title: "Bank Disconnected",
        description: "Bank connection has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Disconnect Failed",
        description: error.message || "Failed to disconnect bank",
        variant: "destructive",
      });
    }
  });

  const handleConnectBank = (bankId: string) => {
    connectBankMutation.mutate(bankId);
  };

  const handleSyncTransactions = (connectionId: string) => {
    syncTransactionsMutation.mutate(connectionId);
  };

  const handleDisconnectBank = (connectionId: string) => {
    disconnectBankMutation.mutate(connectionId);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Bank Connections</h1>
          <p className="text-muted-foreground">Connect your bank accounts for automatic transaction sync</p>
        </div>
      </div>

      <Tabs defaultValue="connect" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="connect">Connect Banks</TabsTrigger>
          <TabsTrigger value="manage">Manage Connections</TabsTrigger>
        </TabsList>

        {/* Connect Banks Tab */}
        <TabsContent value="connect" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Security Notice */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Secure Bank Connections
                </CardTitle>
                <CardDescription>
                  Your banking credentials are secured with bank-level encryption
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">256-bit SSL encryption</p>
                      <p className="text-muted-foreground">Same security used by your bank</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Read-only access</p>
                      <p className="text-muted-foreground">We can only view transaction data</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">No stored credentials</p>
                      <p className="text-muted-foreground">Banking passwords never saved</p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700 mb-1">
                    <Zap className="h-4 w-4" />
                    <span className="font-medium">Automatic Sync</span>
                  </div>
                  <p className="text-sm text-blue-600">
                    Transactions sync automatically every 24 hours
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Available Banks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="h-5 w-5" />
                  Connect Your Bank
                </CardTitle>
                <CardDescription>
                  Select your bank to connect and sync transactions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {providersLoading ? (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground">Loading available banks...</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bankProviders.length === 0 ? (
                      <div className="text-center py-8">
                        <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <div className="text-muted-foreground">Bank integration coming soon</div>
                        <p className="text-sm text-muted-foreground mt-2">
                          We're working on connecting with major banks
                        </p>
                      </div>
                    ) : (
                      bankProviders.map((bank: any) => (
                        <div key={bank.id} className="flex items-center justify-between p-4 border rounded-lg hover-elevate">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium">{bank.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {bank.accountTypes.join(', ')}
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleConnectBank(bank.id)}
                            disabled={isConnecting}
                            data-testid={`button-connect-${bank.id}`}
                          >
                            {isConnecting ? "Connecting..." : "Connect"}
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {connectionResult && (
                  <Alert className={connectionResult.success ? "border-green-200" : "border-red-200"}>
                    {connectionResult.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertTitle>
                      {connectionResult.success ? "Connection Successful" : "Connection Failed"}
                    </AlertTitle>
                    <AlertDescription>
                      {connectionResult.success 
                        ? `${connectionResult.bankName} connected successfully. ${connectionResult.accountsConnected} accounts synced.`
                        : connectionResult.error || "Failed to connect to bank"
                      }
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Manage Connections Tab */}
        <TabsContent value="manage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Connected Banks
              </CardTitle>
              <CardDescription>
                Manage your bank connections and sync settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {banksLoading ? (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">Loading connected banks...</div>
                </div>
              ) : connectedBanks.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <div className="text-muted-foreground">No banks connected yet</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Connect your first bank to see it here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {connectedBanks.map((connection: BankConnection) => (
                    <div key={connection.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">{connection.bankName}</div>
                            <div className="text-sm text-muted-foreground">
                              {connection.accountType} • ****{connection.accountNumber.slice(-4)}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Last sync: {connection.lastSync ? new Date(connection.lastSync).toLocaleDateString() : 'Never'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={connection.status === 'active' ? 'default' : 'destructive'}
                          >
                            {connection.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          {connection.transactionCount} transactions synced
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSyncTransactions(connection.id)}
                            disabled={syncTransactionsMutation.isPending}
                            data-testid={`button-sync-${connection.id}`}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            {syncTransactionsMutation.isPending ? "Syncing..." : "Sync Now"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDisconnectBank(connection.id)}
                            disabled={disconnectBankMutation.isPending}
                            data-testid={`button-disconnect-${connection.id}`}
                          >
                            <Unlink className="h-4 w-4 mr-1" />
                            Disconnect
                          </Button>
                        </div>
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
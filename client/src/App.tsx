import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import AppNavigation from "@/components/AppNavigation";
import Landing from "@/pages/Landing";
import HomePage from "@/pages/Home";
import TransactionsPage from "@/pages/Transactions";
import AccountsPage from "@/pages/Accounts";
import RecurringPage from "@/pages/Recurring";
import BonusPage from "@/pages/Bonus";
import TravelPage from "@/pages/Travel";
import NewsPage from "@/pages/News";
import NotFound from "@/pages/not-found";

function AuthenticatedApp() {
  return (
    <AppNavigation>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/transactions" component={TransactionsPage} />
        <Route path="/accounts" component={AccountsPage} />
        <Route path="/recurring" component={RecurringPage} />
        <Route path="/bonus" component={BonusPage} />
        <Route path="/travel" component={TravelPage} />
        <Route path="/news" component={NewsPage} />
        <Route component={NotFound} />
      </Switch>
    </AppNavigation>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-2">BankDash</div>
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {isAuthenticated ? (
        <Route path="*" component={AuthenticatedApp} />
      ) : (
        <Route path="*" component={Landing} />
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider defaultTheme="light" storageKey="bankdash-ui-theme">
          <Toaster />
          <Router />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Receipt,
  CreditCard,
  Tag,
  RotateCcw,
  Gift,
  Calculator,
  Plane,
  Newspaper,
  LogOut
} from "lucide-react";

const navigationItems = [
  {
    path: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    testId: "nav-dashboard"
  },
  {
    path: "/transactions",
    label: "Transactions",
    icon: Receipt,
    testId: "nav-transactions"
  },
  {
    path: "/accounts",
    label: "Accounts",
    icon: CreditCard,
    testId: "nav-accounts"
  },
  {
    path: "/categories",
    label: "Categories",
    icon: Tag,
    testId: "nav-categories"
  },
  {
    path: "/recurring",
    label: "Recurring",
    icon: RotateCcw,
    testId: "nav-recurring"
  },
  {
    path: "/bonus",
    label: "Bonus",
    icon: Gift,
    testId: "nav-bonus"
  },
  {
    path: "/tax-reporting",
    label: "Tax Reporting",
    icon: Calculator,
    testId: "nav-tax-reporting"
  },
  {
    path: "/travel",
    label: "Travel",
    icon: Plane,
    testId: "nav-travel"
  },
  {
    path: "/news",
    label: "News",
    icon: Newspaper,
    testId: "nav-news"
  }
];

interface AppNavigationProps {
  children: React.ReactNode;
}

export default function AppNavigation({ children }: AppNavigationProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold" data-testid="text-sidebar-logo">BankDash</h1>
          <p className="text-sm text-muted-foreground">Financial Dashboard</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {navigationItems.map((item) => {
              const isActive = location === item.path || 
                (item.path !== "/" && location.startsWith(item.path));
              
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3",
                      isActive && "bg-secondary"
                    )}
                    data-testid={item.testId}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-8 w-8">
              <AvatarImage 
                src={user?.profileImageUrl || undefined} 
                alt={`${user?.firstName} ${user?.lastName}`} 
              />
              <AvatarFallback className="text-xs">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" data-testid="text-user-name">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email || "User"
                }
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex-1"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold" data-testid="text-page-title">
                {navigationItems.find(item => 
                  location === item.path || 
                  (item.path !== "/" && location.startsWith(item.path))
                )?.label || "Dashboard"}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground" data-testid="text-welcome">
                Welcome back, {user?.firstName || "User"}!
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
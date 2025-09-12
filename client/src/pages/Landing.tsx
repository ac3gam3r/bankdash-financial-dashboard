import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CreditCard, PieChart, TrendingUp, Shield, Zap, Globe } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-app-title">BankDash</h1>
              <p className="text-sm text-muted-foreground">Personal Financial Dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                onClick={handleLogin}
                data-testid="button-login"
              >
                Sign In
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Take Control of Your
              <span className="text-primary block">Financial Future</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Track all your accounts, analyze spending, maximize rewards, and achieve your financial goals 
              with our comprehensive personal finance dashboard.
            </p>
            <Button 
              size="lg" 
              onClick={handleLogin}
              data-testid="button-hero-login"
              className="text-lg px-8 py-6"
            >
              Get Started for Free
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold mb-4">Everything You Need</h3>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive financial management tools designed for modern banking
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover-elevate">
              <CardHeader>
                <CreditCard className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Multi-Account Tracking</CardTitle>
                <CardDescription>
                  Connect and monitor all your checking, savings, and credit card accounts in one place
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <PieChart className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Smart Analytics</CardTitle>
                <CardDescription>
                  Get insights into your spending patterns with automated categorization and visual reports
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Rewards Optimization</CardTitle>
                <CardDescription>
                  Maximize credit card rewards and track signup bonuses to boost your earning potential
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Bank-Level Security</CardTitle>
                <CardDescription>
                  Your financial data is protected with enterprise-grade encryption and security measures
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <Zap className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Subscription Tracking</CardTitle>
                <CardDescription>
                  Never miss a recurring payment and identify subscriptions you can cancel to save money
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <Globe className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Travel Expenses</CardTitle>
                <CardDescription>
                  Track travel expenses and categorize spending for business deductions or personal budgets
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary/5 border-t">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-3xl font-bold mb-4">Ready to Transform Your Finances?</h3>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of users who have taken control of their financial future with BankDash
            </p>
            <Button 
              size="lg" 
              onClick={handleLogin}
              data-testid="button-cta-login"
              className="text-lg px-8 py-6"
            >
              Start Your Financial Journey
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t bg-card">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-8">
            <h4 className="text-lg font-semibold mb-2">BankDash</h4>
            <p className="text-muted-foreground">
              Empowering smart financial decisions through intelligent data insights
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>&copy; 2024 BankDash. Built with modern web technologies.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
import { Transaction, Category } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ShoppingCart, 
  Car, 
  Home, 
  Utensils, 
  CreditCard, 
  Gift,
  DollarSign,
  Zap
} from "lucide-react";

interface TransactionItemProps {
  transaction: Transaction;
  category?: Category;
}

export default function TransactionItem({ transaction, category }: TransactionItemProps) {
  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(amount));
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  };

  const getCategoryIcon = (categoryName: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'groceries': <ShoppingCart className="h-4 w-4" />,
      'transportation': <Car className="h-4 w-4" />,
      'utilities': <Home className="h-4 w-4" />,
      'dining': <Utensils className="h-4 w-4" />,
      'shopping': <ShoppingCart className="h-4 w-4" />,
      'entertainment': <Gift className="h-4 w-4" />,
      'income': <DollarSign className="h-4 w-4" />,
      'bills': <Zap className="h-4 w-4" />,
    };
    return iconMap[categoryName.toLowerCase()] || <CreditCard className="h-4 w-4" />;
  };

  const isCredit = transaction.type === 'credit';
  const amountClass = isCredit ? 'text-chart-1' : 'text-destructive';

  return (
    <Card className="hover-elevate" data-testid={`card-transaction-${transaction.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="p-2 rounded-full bg-muted">
                {getCategoryIcon(transaction.category)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" data-testid={`text-description-${transaction.id}`}>
                {transaction.description}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge 
                  variant="secondary" 
                  className="text-xs"
                  style={{ backgroundColor: category?.color || '#94a3b8' }}
                  data-testid={`badge-category-${transaction.category}`}
                >
                  {transaction.category}
                </Badge>
                <span className="text-xs text-muted-foreground" data-testid={`text-date-${transaction.id}`}>
                  {formatDate(transaction.date)}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-sm font-semibold ${amountClass}`} data-testid={`text-amount-${transaction.id}`}>
              {isCredit ? '+' : '-'}{formatCurrency(Math.abs(parseFloat(transaction.amount)).toString())}
            </p>
            <p className="text-xs text-muted-foreground capitalize" data-testid={`text-type-${transaction.id}`}>
              {transaction.type}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
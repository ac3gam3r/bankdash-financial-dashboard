import { Transaction, Category } from "@shared/schema";
import TransactionItem from "./TransactionItem";

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  loading?: boolean;
}

export default function TransactionList({ transactions, categories, loading = false }: TransactionListProps) {
  const getCategoryForTransaction = (categoryName: string) => {
    return categories.find(cat => cat.name === categoryName);
  };

  if (loading) {
    return (
      <div className="space-y-4" data-testid="div-transactions-loading">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-md"></div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8" data-testid="div-no-transactions">
        <p className="text-muted-foreground">No transactions found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Try adjusting your filters or check back later
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="div-transactions-list">
      {transactions.map((transaction) => (
        <TransactionItem
          key={transaction.id}
          transaction={transaction}
          category={getCategoryForTransaction(transaction.category)}
        />
      ))}
    </div>
  );
}
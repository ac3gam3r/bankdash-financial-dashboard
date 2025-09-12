import CategoryFilter from '../CategoryFilter';
import { Category } from '@shared/schema';
import { useState } from 'react';

const mockCategories: Category[] = [
  { id: '1', name: 'groceries', color: '#22c55e', icon: 'shopping-cart' },
  { id: '2', name: 'dining', color: '#f59e0b', icon: 'utensils' },
  { id: '3', name: 'transportation', color: '#3b82f6', icon: 'car' },
  { id: '4', name: 'utilities', color: '#8b5cf6', icon: 'zap' },
  { id: '5', name: 'entertainment', color: '#ec4899', icon: 'gift' },
];

export default function CategoryFilterExample() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['groceries']);

  const handleCategoryToggle = (categoryName: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryName)
        ? prev.filter(cat => cat !== categoryName)
        : [...prev, categoryName]
    );
  };

  const handleClearAll = () => {
    setSelectedCategories([]);
  };

  return (
    <div className="p-4">
      <CategoryFilter
        categories={mockCategories}
        selectedCategories={selectedCategories}
        onCategoryToggle={handleCategoryToggle}
        onClearAll={handleClearAll}
      />
    </div>
  );
}
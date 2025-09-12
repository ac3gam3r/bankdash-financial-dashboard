import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Category } from "@shared/schema";

interface CategoryFilterProps {
  categories: Category[];
  selectedCategories: string[];
  onCategoryToggle: (categoryName: string) => void;
  onClearAll: () => void;
}

export default function CategoryFilter({ 
  categories, 
  selectedCategories, 
  onCategoryToggle, 
  onClearAll 
}: CategoryFilterProps) {
  const handleCategoryClick = (categoryName: string) => {
    console.log(`Category ${categoryName} toggled`);
    onCategoryToggle(categoryName);
  };

  const handleClearAll = () => {
    console.log('All category filters cleared');
    onClearAll();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium" data-testid="text-category-filter-title">
          Filter by Category
        </h3>
        {selectedCategories.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-auto p-1 text-xs"
            data-testid="button-clear-categories"
          >
            <X className="h-3 w-3 mr-1" />
            Clear All
          </Button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const isSelected = selectedCategories.includes(category.name);
          return (
            <Badge
              key={category.id}
              variant={isSelected ? "default" : "secondary"}
              className="cursor-pointer hover-elevate"
              style={{
                backgroundColor: isSelected ? category.color : undefined,
                color: isSelected ? 'white' : undefined
              }}
              onClick={() => handleCategoryClick(category.name)}
              data-testid={`badge-filter-${category.name}`}
            >
              {category.name}
            </Badge>
          );
        })}
      </div>

      {selectedCategories.length > 0 && (
        <div className="text-xs text-muted-foreground" data-testid="text-active-filters">
          {selectedCategories.length} category{selectedCategories.length !== 1 ? 'ies' : ''} selected
        </div>
      )}
    </div>
  );
}
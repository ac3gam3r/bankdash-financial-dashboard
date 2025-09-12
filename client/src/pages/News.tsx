import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Newspaper, ExternalLink, Search, TrendingUp, DollarSign, Building } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Mock news data - in a real app, this would come from an API
const mockNewsData = [
  {
    id: 1,
    title: "Federal Reserve Announces Interest Rate Decision",
    summary: "The Federal Reserve has decided to maintain current interest rates amid ongoing economic uncertainty...",
    category: "economics",
    source: "Federal Reserve",
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    url: "#",
    imageUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&h=200&fit=crop",
    readTime: "3 min read"
  },
  {
    id: 2,
    title: "New Banking Regulations to Take Effect Next Quarter",
    summary: "Financial institutions will need to comply with updated regulations regarding digital banking services...",
    category: "banking",
    source: "Banking Today",
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    url: "#",
    imageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=200&fit=crop",
    readTime: "5 min read"
  },
  {
    id: 3,
    title: "Credit Card Rewards Programs See Major Updates",
    summary: "Major credit card issuers are revamping their rewards programs to offer more flexible redemption options...",
    category: "credit",
    source: "Credit News Daily",
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    url: "#",
    imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=200&fit=crop",
    readTime: "4 min read"
  },
  {
    id: 4,
    title: "Cryptocurrency Market Shows Signs of Recovery",
    summary: "Bitcoin and other major cryptocurrencies have gained significant value over the past week...",
    category: "crypto",
    source: "Crypto Times",
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    url: "#",
    imageUrl: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400&h=200&fit=crop",
    readTime: "6 min read"
  },
  {
    id: 5,
    title: "Personal Finance Apps See Record Growth",
    summary: "Financial technology companies report unprecedented user growth as more people turn to digital solutions...",
    category: "fintech",
    source: "FinTech Weekly",
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    url: "#",
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop",
    readTime: "7 min read"
  },
  {
    id: 6,
    title: "Stock Market Reaches New Heights Amid Tech Rally",
    summary: "Technology stocks continue to drive market gains as investors show renewed confidence in the sector...",
    category: "markets",
    source: "Market Watch",
    publishedAt: new Date(Date.now() - 18 * 60 * 60 * 1000), // 18 hours ago
    url: "#",
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop",
    readTime: "5 min read"
  }
];

export default function NewsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [news, setNews] = useState(mockNewsData);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'economics':
        return <TrendingUp className="h-4 w-4" />;
      case 'banking':
        return <Building className="h-4 w-4" />;
      case 'credit':
        return <DollarSign className="h-4 w-4" />;
      case 'crypto':
        return <span className="text-sm">₿</span>;
      case 'fintech':
        return <span className="text-sm">💳</span>;
      case 'markets':
        return <span className="text-sm">📈</span>;
      default:
        return <Newspaper className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'economics':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'banking':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'credit':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'crypto':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'fintech':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      case 'markets':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Filter news based on search and category
  const filteredNews = news.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-20" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  const categories = [
    { value: "all", label: "All News" },
    { value: "economics", label: "Economics" },
    { value: "banking", label: "Banking" },
    { value: "credit", label: "Credit Cards" },
    { value: "crypto", label: "Cryptocurrency" },
    { value: "fintech", label: "FinTech" },
    { value: "markets", label: "Markets" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-news-title">Financial News</h1>
          <p className="text-muted-foreground">
            Stay updated with the latest financial and technology news
          </p>
        </div>
        <Button variant="outline" data-testid="button-refresh-news">
          <Newspaper className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Articles</CardTitle>
            <Newspaper className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-todays-articles">
              {news.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Fresh updates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-categories">
              {categories.length - 1}
            </div>
            <p className="text-xs text-muted-foreground">
              News categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reading Time</CardTitle>
            <span className="text-lg">📖</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-reading-time">
              ~30min
            </div>
            <p className="text-xs text-muted-foreground">
              Total estimated time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Articles</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search news..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-news"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger data-testid="select-news-category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* News Articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNews.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Articles Found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or check back later for new articles.
            </p>
          </div>
        ) : (
          filteredNews.map((article) => (
            <Card 
              key={article.id} 
              className="hover-elevate group cursor-pointer"
              data-testid={`news-article-${article.id}`}
              onClick={() => window.open(article.url, '_blank')}
            >
              <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                <img 
                  src={article.imageUrl} 
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge className={getCategoryColor(article.category)}>
                    <div className="flex items-center gap-1">
                      {getCategoryIcon(article.category)}
                      <span className="capitalize">{article.category}</span>
                    </div>
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    {article.readTime}
                  </div>
                </div>
                <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                  {article.title}
                </CardTitle>
                <CardDescription className="line-clamp-3">
                  {article.summary}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>{article.source}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{formatDistanceToNow(article.publishedAt, { addSuffix: true })}</span>
                    <ExternalLink className="h-3 w-3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Load More */}
      {filteredNews.length > 0 && (
        <div className="text-center">
          <Button variant="outline" data-testid="button-load-more">
            Load More Articles
          </Button>
        </div>
      )}
    </div>
  );
}
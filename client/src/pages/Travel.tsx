import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Trip } from "@shared/schema";
import { Plus, Plane, MapPin, Calendar, DollarSign, Users } from "lucide-react";
import { format, differenceInDays } from "date-fns";

export default function TravelPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: trips, isLoading, error } = useQuery<Trip[]>({
    queryKey: ["/api/trips"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Handle unauthorized errors
  if (error && isUnauthorizedError(error as Error)) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
    return null;
  }

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'active':
        return 'bg-blue-500';
      case 'planned':
        return 'bg-yellow-500';
      case 'canceled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'active':
        return 'default';
      case 'planned':
        return 'secondary';
      case 'canceled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getTripDuration = (startDate: string | Date, endDate: string | Date) => {
    const days = differenceInDays(new Date(endDate), new Date(startDate));
    return days === 0 ? '1 day' : `${days + 1} days`;
  };

  const getDestinationIcon = (destination: string) => {
    // Simple logic to assign icons based on destination
    const lower = destination.toLowerCase();
    if (lower.includes('beach') || lower.includes('hawaii') || lower.includes('florida')) return '🏖️';
    if (lower.includes('mountain') || lower.includes('ski')) return '🏔️';
    if (lower.includes('city') || lower.includes('new york') || lower.includes('london')) return '🏙️';
    if (lower.includes('europe') || lower.includes('paris') || lower.includes('rome')) return '🇪🇺';
    if (lower.includes('asia') || lower.includes('japan') || lower.includes('thailand')) return '🌏';
    return '✈️';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  const completedTrips = trips?.filter((trip: Trip) => trip.status === 'completed') || [];
  const activeTrips = trips?.filter((trip: Trip) => trip.status === 'active') || [];
  const plannedTrips = trips?.filter((trip: Trip) => trip.status === 'planned') || [];
  const businessTrips = trips?.filter((trip: Trip) => trip.isBusinessTrip) || [];

  const totalTravelExpenses = completedTrips.reduce((sum: number, trip: Trip) => 
    sum + parseFloat(trip.totalExpenses || "0"), 0);

  const totalBudget = trips?.reduce((sum: number, trip: Trip) => 
    sum + parseFloat(trip.budgetAmount || "0"), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-travel-title">Travel Tracking</h1>
          <p className="text-muted-foreground">
            Manage your trips and track travel expenses
          </p>
        </div>
        <Button data-testid="button-add-trip">
          <Plus className="h-4 w-4 mr-2" />
          Add Trip
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-trips">
              {trips?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Travel Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600" data-testid="stat-travel-expenses">
              {formatCurrency(totalTravelExpenses.toString())}
            </div>
            <p className="text-xs text-muted-foreground">
              Completed trips
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Business Trips</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="stat-business-trips">
              {businessTrips.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Tax deductible
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active/Planned</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="stat-active-trips">
              {activeTrips.length + plannedTrips.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Upcoming trips
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active/Upcoming Trips */}
      {(activeTrips.length > 0 || plannedTrips.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Upcoming Trips
            </CardTitle>
            <CardDescription>
              Active and planned trips
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...activeTrips, ...plannedTrips]
                .sort((a: Trip, b: Trip) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                .map((trip: Trip) => (
                  <div
                    key={trip.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                    data-testid={`upcoming-trip-${trip.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{getDestinationIcon(trip.destination)}</div>
                      <div>
                        <div className="font-semibold">{trip.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          {trip.destination}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(trip.startDate), 'MMM d')} - {format(new Date(trip.endDate), 'MMM d, yyyy')}
                          {' • '}{getTripDuration(trip.startDate, trip.endDate)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={getStatusVariant(trip.status)} className="mb-2">
                        {trip.status}
                      </Badge>
                      {trip.budgetAmount && (
                        <div className="text-sm text-muted-foreground">
                          Budget: {formatCurrency(trip.budgetAmount)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Trips */}
      <Card>
        <CardHeader>
          <CardTitle>All Trips</CardTitle>
          <CardDescription>
            Complete travel history and expense tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(!trips || trips.length === 0) ? (
            <div className="text-center py-8">
              <Plane className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Trips Recorded</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking your travel expenses and organize your trips
              </p>
              <Button data-testid="button-add-first-trip">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Trip
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips
                .sort((a: Trip, b: Trip) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
                .map((trip: Trip) => (
                  <Card 
                    key={trip.id} 
                    className="hover-elevate"
                    data-testid={`trip-card-${trip.id}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="text-2xl">{getDestinationIcon(trip.destination)}</div>
                          <Badge variant={getStatusVariant(trip.status)} className="capitalize">
                            {trip.status}
                          </Badge>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(trip.status)}`} />
                      </div>
                      <CardTitle className="text-lg">{trip.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {trip.destination}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Calendar className="h-3 w-3" />
                            Trip Dates
                          </div>
                          <div>
                            {format(new Date(trip.startDate), 'MMM d')} - {format(new Date(trip.endDate), 'MMM d, yyyy')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {getTripDuration(trip.startDate, trip.endDate)}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Budget</div>
                            <div className="font-semibold">
                              {trip.budgetAmount ? formatCurrency(trip.budgetAmount) : 'Not set'}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Spent</div>
                            <div className="font-semibold">
                              {trip.totalExpenses ? formatCurrency(trip.totalExpenses) : '$0.00'}
                            </div>
                          </div>
                        </div>

                        {trip.budgetAmount && trip.totalExpenses && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Budget Usage</span>
                              <span>
                                {Math.round((parseFloat(trip.totalExpenses) / parseFloat(trip.budgetAmount)) * 100)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ 
                                  width: `${Math.min(100, (parseFloat(trip.totalExpenses) / parseFloat(trip.budgetAmount)) * 100)}%` 
                                }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-xs">
                          {trip.purpose && (
                            <Badge variant="outline" className="capitalize">
                              {trip.purpose}
                            </Badge>
                          )}
                          {trip.isBusinessTrip && (
                            <Badge variant="outline" className="text-blue-600">
                              Business
                            </Badge>
                          )}
                          {trip.travelers && trip.travelers.length > 0 && (
                            <Badge variant="outline" className="text-purple-600">
                              {trip.travelers.length} traveler{trip.travelers.length > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>

                        {trip.description && (
                          <div className="pt-2 border-t">
                            <div className="text-xs text-muted-foreground line-clamp-2">
                              {trip.description}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
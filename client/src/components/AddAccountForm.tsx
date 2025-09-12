import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, CreditCard, DollarSign } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertAccountSchema, type InsertAccount } from "@shared/schema";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Extend the schema with custom validation rules
const formSchema = insertAccountSchema.extend({
  balance: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Balance must be a valid positive number",
  }),
  creditLimit: z.string().optional().refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
    message: "Credit limit must be a valid positive number",
  }),
  annualFee: z.string().optional().refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
    message: "Annual fee must be a valid positive number",
  }),
  rewardRate: z.string().optional().refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 1), {
    message: "Reward rate must be between 0 and 1 (e.g., 0.02 for 2%)",
  }),
  interestRate: z.string().optional().refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 1), {
    message: "Interest rate must be between 0 and 1 (e.g., 0.18 for 18% APR)",
  }),
  minimumPayment: z.string().optional().refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
    message: "Minimum payment must be a valid positive number",
  }),
  statementBalance: z.string().optional().refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
    message: "Statement balance must be a valid positive number",
  }),
}).transform((data) => ({
  ...data,
  balance: data.balance,
  creditLimit: data.creditLimit || undefined,
  annualFee: data.annualFee || undefined,
  rewardRate: data.rewardRate || undefined,
  interestRate: data.interestRate || undefined,
  minimumPayment: data.minimumPayment || undefined,
  statementBalance: data.statementBalance || undefined,
}));

type FormData = z.infer<typeof formSchema>;

const accountTypes = [
  { value: "checking", label: "Checking Account", icon: "🏛️" },
  { value: "savings", label: "Savings Account", icon: "💰" },
  { value: "credit", label: "Credit Card", icon: "💳" },
  { value: "investment", label: "Investment Account", icon: "📈" },
  { value: "loan", label: "Loan Account", icon: "🏠" },
];

const rewardTypes = [
  { value: "cashback", label: "Cash Back" },
  { value: "points", label: "Points" },
  { value: "miles", label: "Miles" },
];

interface AddAccountFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AddAccountForm({ onSuccess, onCancel }: AddAccountFormProps) {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accountName: "",
      accountType: "",
      balance: "0.00",
      bankName: "",
      accountNumber: "",
      routingNumber: "",
      creditLimit: "",
      annualFee: "0.00",
      rewardRate: "",
      rewardType: "",
      interestRate: "",
      minimumPayment: "",
      statementBalance: "",
      notes: "",
      userId: "", // This will be set by the backend
    },
  });

  const createAccountMutation = useMutation({
    mutationFn: async (data: InsertAccount) => {
      return apiRequest("POST", "/api/accounts", data);
    },
    onSuccess: () => {
      // Invalidate accounts cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      toast({
        title: "Success",
        description: "Account created successfully!",
      });
      form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      // Convert string values to proper types for submission
      const submitData: any = {
        ...data,
        balance: data.balance,
        paymentDueDate: selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined,
      };

      // Clean up undefined values for optional fields
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === "" || submitData[key] === undefined) {
          delete submitData[key];
        }
      });

      await createAccountMutation.mutateAsync(submitData);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const watchedAccountType = form.watch("accountType");
  const isCreditCard = watchedAccountType === "credit";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Account Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Basic Information</h3>
          
          <FormField
            control={form.control}
            name="accountName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Name *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="My Checking Account" 
                    data-testid="input-account-name"
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  A friendly name to identify this account
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accountType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Type *</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  data-testid="select-account-type"
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accountTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <span className="flex items-center gap-2">
                          <span>{type.icon}</span>
                          <span>{type.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bankName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bank/Institution Name *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Chase Bank" 
                    data-testid="input-bank-name"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Balance *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="0.00" 
                        className="pl-10"
                        data-testid="input-balance"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    {isCreditCard ? "Current balance owed" : "Current account balance"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Number</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Last 4 digits"
                      maxLength={4}
                      data-testid="input-account-number"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: Last 4 digits for identification
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Credit Card Specific Fields */}
        {isCreditCard && (
          <>
            <Separator />
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Credit Card Details</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="creditLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Credit Limit</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input 
                                placeholder="5000.00" 
                                className="pl-10"
                                data-testid="input-credit-limit"
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="annualFee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Annual Fee</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input 
                                placeholder="0.00" 
                                className="pl-10"
                                data-testid="input-annual-fee"
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="interestRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Interest Rate (APR)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="0.18 (for 18%)" 
                              data-testid="input-interest-rate"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Enter as decimal (e.g., 0.18 for 18%)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="minimumPayment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Payment</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input 
                                placeholder="25.00" 
                                className="pl-10"
                                data-testid="input-minimum-payment"
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="rewardRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reward Rate</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="0.02 (for 2%)" 
                              data-testid="input-reward-rate"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Enter as decimal (e.g., 0.02 for 2%)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="rewardType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reward Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger data-testid="select-reward-type">
                                <SelectValue placeholder="Select reward type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {rewardTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormItem>
                    <FormLabel>Payment Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground"
                          )}
                          data-testid="button-payment-due-date"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Additional Information */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Additional notes about this account..."
                    data-testid="textarea-notes"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>
                  Optional: Any additional information or reminders
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createAccountMutation.isPending}
            data-testid="button-create-account"
          >
            {createAccountMutation.isPending ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                Creating...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
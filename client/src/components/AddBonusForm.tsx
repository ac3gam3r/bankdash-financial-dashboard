import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { insertBankBonusSchema, insertCreditCardBonusSchema, type InsertBankBonus, type InsertCreditCardBonus, type Account } from "@shared/schema";
import { CalendarIcon, DollarSign, CreditCard, Landmark, Gift } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { z } from "zod";

// Unified form schema that handles both bonus types
const addBonusSchema = z.discriminatedUnion("bonusCategory", [
  insertBankBonusSchema.extend({
    bonusCategory: z.literal("bank"),
    bonusAmount: z.string().min(1, "Bonus amount is required").refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      "Bonus amount must be a positive number"
    ),
    signupDate: z.date().optional(),
    bonusReceivedDate: z.date().optional(),
    requirementsDeadline: z.date().optional(),
  }),
  insertCreditCardBonusSchema.extend({
    bonusCategory: z.literal("creditCard"),
    bonusAmount: z.string().min(1, "Bonus amount is required").refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      "Bonus amount must be a positive number"
    ),
    bonusValue: z.string().optional().refine(
      (val) => !val || (!isNaN(Number(val)) && Number(val) >= 0),
      "Bonus value must be a valid number"
    ),
    spendRequirement: z.string().optional().refine(
      (val) => !val || (!isNaN(Number(val)) && Number(val) >= 0),
      "Spend requirement must be a valid number"
    ),
    currentSpend: z.string().optional().refine(
      (val) => !val || (!isNaN(Number(val)) && Number(val) >= 0),
      "Current spend must be a valid number"
    ),
    annualFee: z.string().optional().refine(
      (val) => !val || (!isNaN(Number(val)) && Number(val) >= 0),
      "Annual fee must be a valid number"
    ),
    applicationDate: z.date().optional(),
    approvalDate: z.date().optional(),
    spendDeadline: z.date().optional(),
    bonusReceivedDate: z.date().optional(),
  }),
]);

type AddBonusFormData = z.infer<typeof addBonusSchema>;

interface AddBonusFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AddBonusForm({ onSuccess, onCancel }: AddBonusFormProps) {
  const { toast } = useToast();
  const [bonusCategory, setBonusCategory] = useState<"bank" | "creditCard">("bank");

  const form = useForm<AddBonusFormData>({
    resolver: zodResolver(addBonusSchema),
    defaultValues: {
      bonusCategory: "bank",
      bonusAmount: "",
      bonusType: "signup",
      status: "pending",
      requirementsMet: false,
      form1099Received: false,
      // Credit card specific defaults
      feeWaivedFirstYear: false,
      currentSpend: "0",
      timeFrameMonths: 3,
    },
  });

  // Fetch user's accounts for linking
  const { data: accounts, isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  // Bank bonus mutation
  const createBankBonusMutation = useMutation({
    mutationFn: async (data: InsertBankBonus) => {
      return apiRequest("POST", "/api/bank-bonuses", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Bank bonus added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bank-bonuses"] });
      form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add bank bonus",
        variant: "destructive",
      });
    },
  });

  // Credit card bonus mutation
  const createCreditCardBonusMutation = useMutation({
    mutationFn: async (data: InsertCreditCardBonus) => {
      return apiRequest("POST", "/api/credit-card-bonuses", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Credit card bonus added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/credit-card-bonuses"] });
      form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add credit card bonus",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddBonusFormData) => {
    if (data.bonusCategory === "bank") {
      // Convert form data for bank bonus
      const bankBonusData: InsertBankBonus = {
        ...data,
        bonusAmount: data.bonusAmount,
        signupDate: data.signupDate?.toISOString(),
        bonusReceivedDate: data.bonusReceivedDate?.toISOString(),
        requirementsDeadline: data.requirementsDeadline?.toISOString(),
        taxableAmount: data.bonusAmount, // Default to bonus amount
        taxYear: data.bonusReceivedDate ? new Date(data.bonusReceivedDate).getFullYear() : new Date().getFullYear(),
      } as InsertBankBonus;

      createBankBonusMutation.mutate(bankBonusData);
    } else {
      // Convert form data for credit card bonus
      const creditCardBonusData: InsertCreditCardBonus = {
        ...data,
        bonusAmount: data.bonusAmount,
        bonusValue: data.bonusValue || data.bonusAmount, // Default to bonus amount if not specified
        spendRequirement: data.spendRequirement || "0",
        currentSpend: data.currentSpend || "0",
        annualFee: data.annualFee || "0",
        applicationDate: data.applicationDate?.toISOString(),
        approvalDate: data.approvalDate?.toISOString(),
        spendDeadline: data.spendDeadline?.toISOString(),
        bonusReceivedDate: data.bonusReceivedDate?.toISOString(),
      } as InsertCreditCardBonus;

      createCreditCardBonusMutation.mutate(creditCardBonusData);
    }
  };

  const watchedCategory = form.watch("bonusCategory");

  if (accountsLoading) {
    return <div className="p-6">Loading accounts...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Bonus Category Selection */}
        <FormField
          control={form.control}
          name="bonusCategory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bonus Type *</FormLabel>
              <Select 
                onValueChange={(value: "bank" | "creditCard") => {
                  field.onChange(value);
                  setBonusCategory(value);
                  // Reset form when changing category to prevent validation issues
                  form.reset({
                    bonusCategory: value,
                    bonusAmount: "",
                    bonusType: "signup",
                    status: "pending",
                    requirementsMet: false,
                  });
                }} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger data-testid="select-bonus-category">
                    <SelectValue placeholder="Select bonus type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="bank">
                    <div className="flex items-center gap-2">
                      <Landmark className="h-4 w-4" />
                      Bank Account Bonus
                    </div>
                  </SelectItem>
                  <SelectItem value="creditCard">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Credit Card Bonus
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Bank Name / Card Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name={watchedCategory === "bank" ? "bankName" : "bankName"}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {watchedCategory === "bank" ? "Bank Name" : "Bank/Issuer"} *
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder={watchedCategory === "bank" ? "e.g., Chase" : "e.g., Chase, American Express"}
                    data-testid="input-bank-name" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {watchedCategory === "creditCard" && (
            <FormField
              control={form.control}
              name="cardName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Card Name *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Chase Sapphire Preferred"
                      data-testid="input-card-name" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Account Linking */}
        <FormField
          control={form.control}
          name="accountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link to Account (Optional)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl>
                  <SelectTrigger data-testid="select-account">
                    <SelectValue placeholder="Select an account (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">No Account</SelectItem>
                  {accounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.accountName} - {account.bankName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Link this bonus to an existing account for better tracking
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Bonus Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="bonusAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {watchedCategory === "bank" ? "Bonus Amount" : "Bonus Amount"} *
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="0.00"
                      data-testid="input-bonus-amount"
                      className="pl-10"
                      {...field} 
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  {watchedCategory === "bank" ? "Cash bonus amount" : "Points, miles, or cashback amount"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bonusType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bonus Type *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-bonus-type">
                      <SelectValue placeholder="Select bonus type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="signup">Signup Bonus</SelectItem>
                    <SelectItem value="referral">Referral Bonus</SelectItem>
                    <SelectItem value="promotion">Promotion</SelectItem>
                    {watchedCategory === "creditCard" && (
                      <>
                        <SelectItem value="points">Points</SelectItem>
                        <SelectItem value="miles">Miles</SelectItem>
                        <SelectItem value="cashback">Cashback</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Credit Card Specific Fields */}
        {watchedCategory === "creditCard" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bonusValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cash Value (Optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="0.00"
                          data-testid="input-bonus-value"
                          className="pl-10"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Cash equivalent value of points/miles
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timeFrameMonths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Frame (Months)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="3"
                        data-testid="input-timeframe"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>
                      Months to meet spending requirement
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="spendRequirement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Spending Requirement</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="0.00"
                          data-testid="input-spend-requirement"
                          className="pl-10"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Amount needed to spend to earn bonus
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currentSpend"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Spend</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="0.00"
                          data-testid="input-current-spend"
                          className="pl-10"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Amount already spent toward requirement
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="annualFee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Annual Fee</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="0.00"
                        data-testid="input-annual-fee"
                        className="pl-10"
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
              name="feeWaivedFirstYear"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Fee Waived First Year</FormLabel>
                    <FormDescription>
                      Is the annual fee waived for the first year?
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-fee-waived"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </>
        )}

        {/* Requirements */}
        <FormField
          control={form.control}
          name="requirementsDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Requirements Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe the requirements to earn this bonus..."
                  data-testid="textarea-requirements"
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Detail any spending, deposit, or other requirements
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Important Dates */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Important Dates</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date fields - only show relevant ones based on bonus type */}
            {watchedCategory === "bank" ? (
              <>
                <FormField
                  control={form.control}
                  name="signupDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Signup Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              data-testid="date-signup"
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick signup date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requirementsDeadline"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Requirements Deadline</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              data-testid="date-requirements-deadline"
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick deadline</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            ) : (
              <>
                <FormField
                  control={form.control}
                  name="applicationDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Application Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              data-testid="date-application"
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick application date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="approvalDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Approval Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              data-testid="date-approval"
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick approval date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="spendDeadline"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Spending Deadline</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              data-testid="date-spend-deadline"
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick spending deadline</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="bonusReceivedDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Bonus Received Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          data-testid="date-bonus-received"
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick received date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Leave empty if not yet received
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Status and Tracking */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Status & Tracking</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">
                        <Badge variant="outline" className="mr-2">Pending</Badge>
                        Working on requirements
                      </SelectItem>
                      <SelectItem value="earned">
                        <Badge variant="default" className="mr-2">Earned</Badge>
                        Requirements met
                      </SelectItem>
                      <SelectItem value="received">
                        <Badge variant="default" className="mr-2 bg-green-500">Received</Badge>
                        Bonus received
                      </SelectItem>
                      <SelectItem value="expired">
                        <Badge variant="destructive" className="mr-2">Expired</Badge>
                        Deadline passed
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requirementsMet"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Requirements Met</FormLabel>
                    <FormDescription>
                      Have all requirements been completed?
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-requirements-met"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* Tax Information (Bank Bonuses Only) */}
          {watchedCategory === "bank" && (
            <FormField
              control={form.control}
              name="form1099Received"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">1099 Form Received</FormLabel>
                    <FormDescription>
                      Did you receive a 1099 tax form for this bonus?
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-1099-received"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Additional notes about this bonus..."
                  data-testid="textarea-notes"
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Any additional information or reminders
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className="flex justify-end space-x-2 pt-4">
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
            disabled={createBankBonusMutation.isPending || createCreditCardBonusMutation.isPending}
            data-testid="button-submit"
          >
            {createBankBonusMutation.isPending || createCreditCardBonusMutation.isPending ? (
              <>
                <Gift className="mr-2 h-4 w-4 animate-spin" />
                Adding Bonus...
              </>
            ) : (
              <>
                <Gift className="mr-2 h-4 w-4" />
                Add Bonus
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
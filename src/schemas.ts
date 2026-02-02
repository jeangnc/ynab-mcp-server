import { z } from "zod";

// Enums
export const TransactionClearedStatusSchema = z.enum(["cleared", "uncleared", "reconciled"]);

export const TransactionFlagColorSchema = z.enum([
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
]);

export const ScheduledTransactionFrequencySchema = z.enum([
  "never",
  "daily",
  "weekly",
  "everyOtherWeek",
  "twiceAMonth",
  "every4Weeks",
  "monthly",
  "everyOtherMonth",
  "every3Months",
  "every4Months",
  "twiceAYear",
  "yearly",
  "everyOtherYear",
]);

export const AccountTypeSchema = z.enum([
  "checking",
  "savings",
  "cash",
  "creditCard",
  "lineOfCredit",
  "otherAsset",
  "otherLiability",
  "mortgage",
  "autoLoan",
  "studentLoan",
  "personalLoan",
  "medicalDebt",
  "otherDebt",
]);

export const BudgetIdSchema = z.object({
  budget_id: z.string().describe("The budget ID (use 'last-used' for most recent)"),
});

export const AccountSchema = z.object({
  budget_id: z.string().describe("The budget ID"),
  account_id: z.string().describe("The account ID"),
});

export const CategorySchema = z.object({
  budget_id: z.string().describe("The budget ID"),
  category_id: z.string().describe("The category ID"),
});

export const TransactionsSchema = z.object({
  budget_id: z.string().describe("The budget ID"),
  since_date: z
    .string()
    .optional()
    .describe("Only return transactions on or after this date (YYYY-MM-DD)"),
  type: z.enum(["uncategorized", "unapproved"]).optional().describe("Filter by transaction type"),
  category_id: z.string().optional().describe("Filter by category ID"),
  payee_id: z.string().optional().describe("Filter by payee ID"),
  account_id: z.string().optional().describe("Filter by account ID"),
});

export const TransactionSchema = z.object({
  budget_id: z.string().describe("The budget ID"),
  transaction_id: z.string().describe("The transaction ID"),
});

export const MonthSchema = z.object({
  budget_id: z.string().describe("The budget ID"),
  month: z.string().describe("The budget month in ISO format (YYYY-MM-01)"),
});

// Write operation schemas
export const CreateTransactionSchema = z.object({
  budget_id: z.string().describe("The budget ID"),
  account_id: z.string().describe("The account ID for this transaction"),
  date: z.string().describe("The transaction date in ISO format (YYYY-MM-DD)"),
  amount: z.number().describe("The transaction amount (negative for expense, positive for income)"),
  payee_id: z.string().optional().describe("The payee ID"),
  payee_name: z.string().optional().describe("The payee name (used if payee_id is not provided)"),
  category_id: z.string().optional().describe("The category ID"),
  memo: z.string().optional().describe("A memo for the transaction"),
  cleared: TransactionClearedStatusSchema.optional().describe("The cleared status"),
  approved: z.boolean().optional().describe("Whether the transaction is approved"),
  flag_color: TransactionFlagColorSchema.optional().describe("The flag color"),
});

export const UpdateTransactionSchema = z.object({
  budget_id: z.string().describe("The budget ID"),
  transaction_id: z.string().describe("The transaction ID to update"),
  account_id: z.string().optional().describe("The account ID"),
  date: z.string().optional().describe("The transaction date in ISO format (YYYY-MM-DD)"),
  amount: z.number().optional().describe("The transaction amount"),
  payee_id: z.string().optional().describe("The payee ID"),
  payee_name: z.string().optional().describe("The payee name"),
  category_id: z.string().optional().describe("The category ID"),
  memo: z.string().optional().describe("A memo for the transaction"),
  cleared: TransactionClearedStatusSchema.optional().describe("The cleared status"),
  approved: z.boolean().optional().describe("Whether the transaction is approved"),
  flag_color: TransactionFlagColorSchema.optional().describe("The flag color"),
});

export const DeleteTransactionSchema = z.object({
  budget_id: z.string().describe("The budget ID"),
  transaction_id: z.string().describe("The transaction ID to delete"),
});

export const UpdateCategoryBudgetSchema = z.object({
  budget_id: z.string().describe("The budget ID"),
  month: z.string().describe("The budget month in ISO format (YYYY-MM-01)"),
  category_id: z.string().describe("The category ID"),
  budgeted: z.number().describe("The budgeted amount for this category"),
});

export const CreateAccountSchema = z.object({
  budget_id: z.string().describe("The budget ID"),
  name: z.string().describe("The account name"),
  type: AccountTypeSchema.describe("The account type"),
  balance: z.number().describe("The initial account balance"),
});

export const ScheduledTransactionSchema = z.object({
  budget_id: z.string().describe("The budget ID"),
  scheduled_transaction_id: z.string().describe("The scheduled transaction ID"),
});

export const CreateScheduledTransactionSchema = z.object({
  budget_id: z.string().describe("The budget ID"),
  account_id: z.string().describe("The account ID for this scheduled transaction"),
  date: z.string().describe("The first date for this scheduled transaction (YYYY-MM-DD)"),
  amount: z
    .number()
    .optional()
    .describe("The transaction amount (negative for expense, positive for income)"),
  payee_id: z.string().optional().describe("The payee ID"),
  payee_name: z.string().optional().describe("The payee name (used if payee_id is not provided)"),
  category_id: z.string().optional().describe("The category ID"),
  memo: z.string().optional().describe("A memo for the scheduled transaction"),
  flag_color: TransactionFlagColorSchema.optional().describe("The flag color"),
  frequency: ScheduledTransactionFrequencySchema.optional().describe(
    "The frequency of the scheduled transaction"
  ),
});

export const UpdateScheduledTransactionSchema = z.object({
  budget_id: z.string().describe("The budget ID"),
  scheduled_transaction_id: z.string().describe("The scheduled transaction ID to update"),
  account_id: z.string().optional().describe("The account ID"),
  date: z.string().optional().describe("The next date for this scheduled transaction (YYYY-MM-DD)"),
  amount: z.number().optional().describe("The transaction amount"),
  payee_id: z.string().optional().describe("The payee ID"),
  payee_name: z.string().optional().describe("The payee name"),
  category_id: z.string().optional().describe("The category ID"),
  memo: z.string().optional().describe("A memo for the scheduled transaction"),
  flag_color: TransactionFlagColorSchema.optional().describe("The flag color"),
  frequency: ScheduledTransactionFrequencySchema.optional().describe(
    "The frequency of the scheduled transaction"
  ),
});

export const DeleteScheduledTransactionSchema = z.object({
  budget_id: z.string().describe("The budget ID"),
  scheduled_transaction_id: z.string().describe("The scheduled transaction ID to delete"),
});

export const PayeeSchema = z.object({
  budget_id: z.string().describe("The budget ID"),
  payee_id: z.string().describe("The payee ID"),
});

export const UpdatePayeeSchema = z.object({
  budget_id: z.string().describe("The budget ID"),
  payee_id: z.string().describe("The payee ID"),
  name: z.string().describe("The new payee name (max 500 characters)"),
});

// History operation schemas
export const ListHistorySchema = z.object({
  budget_id: z.string().optional().describe("Filter by budget ID (optional)"),
  limit: z.number().optional().describe("Maximum number of entries to return (default: 20)"),
});

export const GetHistoryEntrySchema = z.object({
  entry_id: z.string().describe("The history entry ID"),
});

export const UndoOperationSchema = z.object({
  entry_id: z.string().describe("The history entry ID to undo"),
});

// Derived types from schemas
export type TransactionClearedStatus = z.infer<typeof TransactionClearedStatusSchema>;
export type TransactionFlagColor = z.infer<typeof TransactionFlagColorSchema>;
export type AccountType = z.infer<typeof AccountTypeSchema>;
export type ScheduledTransactionFrequency = z.infer<typeof ScheduledTransactionFrequencySchema>;

// Input types for client methods (omit budget_id which is passed separately)
export type CreateTransactionInput = Omit<z.infer<typeof CreateTransactionSchema>, "budget_id">;
export type UpdateTransactionInput = Omit<
  z.infer<typeof UpdateTransactionSchema>,
  "budget_id" | "transaction_id"
>;
export type CreateAccountInput = Omit<z.infer<typeof CreateAccountSchema>, "budget_id">;
export type CreateScheduledTransactionInput = Omit<
  z.infer<typeof CreateScheduledTransactionSchema>,
  "budget_id"
>;
export type UpdateScheduledTransactionInput = Omit<
  z.infer<typeof UpdateScheduledTransactionSchema>,
  "budget_id" | "scheduled_transaction_id"
>;

import { z } from "zod";

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

import { z } from "zod";
import {
  BudgetIdSchema,
  AccountSchema,
  CategorySchema,
  TransactionsSchema,
  TransactionSchema,
  MonthSchema,
  CreateTransactionSchema,
  UpdateTransactionSchema,
  DeleteTransactionSchema,
  UpdateCategoryBudgetSchema,
  CreateAccountSchema,
} from "./schemas.js";

export const tools = [
  {
    name: "list_budgets",
    description:
      "Get all budgets for the authenticated user. Returns budget names, IDs, and last modified dates.",
    inputSchema: z.toJSONSchema(z.object({})),
  },
  {
    name: "get_budget",
    description:
      "Get detailed information about a specific budget including accounts, categories, and settings.",
    inputSchema: z.toJSONSchema(BudgetIdSchema),
  },
  {
    name: "list_accounts",
    description:
      "Get all accounts for a budget. Returns account names, types, balances, and status.",
    inputSchema: z.toJSONSchema(BudgetIdSchema),
  },
  {
    name: "get_account",
    description: "Get detailed information about a specific account.",
    inputSchema: z.toJSONSchema(AccountSchema),
  },
  {
    name: "list_categories",
    description:
      "Get all categories for a budget, grouped by category group. Includes budgeted amounts and activity.",
    inputSchema: z.toJSONSchema(BudgetIdSchema),
  },
  {
    name: "get_category",
    description: "Get detailed information about a specific category including current month data.",
    inputSchema: z.toJSONSchema(CategorySchema),
  },
  {
    name: "list_transactions",
    description:
      "Get transactions for a budget. Supports filtering by date, type, category, payee, and account.",
    inputSchema: z.toJSONSchema(TransactionsSchema),
  },
  {
    name: "get_transaction",
    description: "Get detailed information about a specific transaction.",
    inputSchema: z.toJSONSchema(TransactionSchema),
  },
  {
    name: "list_payees",
    description: "Get all payees for a budget.",
    inputSchema: z.toJSONSchema(BudgetIdSchema),
  },
  {
    name: "list_scheduled_transactions",
    description: "Get all scheduled/recurring transactions for a budget.",
    inputSchema: z.toJSONSchema(BudgetIdSchema),
  },
  {
    name: "list_months",
    description:
      "Get all budget months. Returns month summaries with income, budgeted, and activity totals.",
    inputSchema: z.toJSONSchema(BudgetIdSchema),
  },
  {
    name: "get_month",
    description:
      "Get detailed budget information for a specific month including all category balances.",
    inputSchema: z.toJSONSchema(MonthSchema),
  },
  {
    name: "create_transaction",
    description:
      "Create a new transaction. Amount should be negative for expenses and positive for income.",
    inputSchema: z.toJSONSchema(CreateTransactionSchema),
  },
  {
    name: "update_transaction",
    description: "Update an existing transaction. Only provide the fields you want to change.",
    inputSchema: z.toJSONSchema(UpdateTransactionSchema),
  },
  {
    name: "delete_transaction",
    description: "Delete an existing transaction.",
    inputSchema: z.toJSONSchema(DeleteTransactionSchema),
  },
  {
    name: "update_category_budget",
    description: "Update the budgeted amount for a category in a specific month.",
    inputSchema: z.toJSONSchema(UpdateCategoryBudgetSchema),
  },
  {
    name: "create_account",
    description: "Create a new account in the budget.",
    inputSchema: z.toJSONSchema(CreateAccountSchema),
  },
] as const;

// Derive tool name union type from the tools array
export type ToolName = (typeof tools)[number]["name"];

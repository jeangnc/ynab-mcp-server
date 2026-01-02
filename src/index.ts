#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const YNAB_BASE_URL = "https://api.ynab.com/v1";

class YNABClient {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(path: string): Promise<T> {
    const response = await fetch(`${YNAB_BASE_URL}${path}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`YNAB API error (${response.status}): ${error}`);
    }

    const json = await response.json();
    return json.data as T;
  }

  async listBudgets() {
    return this.request<{ budgets: any[] }>("/budgets");
  }

  async getBudget(budgetId: string) {
    return this.request<{ budget: any }>(`/budgets/${budgetId}`);
  }

  async listAccounts(budgetId: string) {
    return this.request<{ accounts: any[] }>(`/budgets/${budgetId}/accounts`);
  }

  async getAccount(budgetId: string, accountId: string) {
    return this.request<{ account: any }>(`/budgets/${budgetId}/accounts/${accountId}`);
  }

  async listCategories(budgetId: string) {
    return this.request<{ category_groups: any[] }>(`/budgets/${budgetId}/categories`);
  }

  async getCategory(budgetId: string, categoryId: string) {
    return this.request<{ category: any }>(`/budgets/${budgetId}/categories/${categoryId}`);
  }

  async listTransactions(budgetId: string, params?: {
    sinceDate?: string;
    type?: string;
    categoryId?: string;
    payeeId?: string;
    accountId?: string;
  }) {
    let path = `/budgets/${budgetId}/transactions`;
    const queryParams: string[] = [];

    if (params?.sinceDate) queryParams.push(`since_date=${params.sinceDate}`);
    if (params?.type) queryParams.push(`type=${params.type}`);

    if (queryParams.length > 0) {
      path += `?${queryParams.join("&")}`;
    }

    let result = await this.request<{ transactions: any[] }>(path);

    // Client-side filtering for category and payee
    if (params?.categoryId) {
      result.transactions = result.transactions.filter(t => t.category_id === params.categoryId);
    }
    if (params?.payeeId) {
      result.transactions = result.transactions.filter(t => t.payee_id === params.payeeId);
    }
    if (params?.accountId) {
      result.transactions = result.transactions.filter(t => t.account_id === params.accountId);
    }

    return result;
  }

  async getTransaction(budgetId: string, transactionId: string) {
    return this.request<{ transaction: any }>(`/budgets/${budgetId}/transactions/${transactionId}`);
  }

  async listPayees(budgetId: string) {
    return this.request<{ payees: any[] }>(`/budgets/${budgetId}/payees`);
  }

  async listScheduledTransactions(budgetId: string) {
    return this.request<{ scheduled_transactions: any[] }>(`/budgets/${budgetId}/scheduled_transactions`);
  }

  async listMonths(budgetId: string) {
    return this.request<{ months: any[] }>(`/budgets/${budgetId}/months`);
  }

  async getMonth(budgetId: string, month: string) {
    return this.request<{ month: any }>(`/budgets/${budgetId}/months/${month}`);
  }
}

// Tool input schemas
const BudgetIdSchema = z.object({
  budget_id: z.string().describe("The budget ID (use 'last-used' for most recent)"),
});

const AccountSchema = z.object({
  budget_id: z.string().describe("The budget ID"),
  account_id: z.string().describe("The account ID"),
});

const CategorySchema = z.object({
  budget_id: z.string().describe("The budget ID"),
  category_id: z.string().describe("The category ID"),
});

const TransactionsSchema = z.object({
  budget_id: z.string().describe("The budget ID"),
  since_date: z.string().optional().describe("Only return transactions on or after this date (ISO format: YYYY-MM-DD)"),
  type: z.enum(["uncategorized", "unapproved"]).optional().describe("Filter by transaction type"),
  category_id: z.string().optional().describe("Filter by category ID"),
  payee_id: z.string().optional().describe("Filter by payee ID"),
  account_id: z.string().optional().describe("Filter by account ID"),
});

const TransactionSchema = z.object({
  budget_id: z.string().describe("The budget ID"),
  transaction_id: z.string().describe("The transaction ID"),
});

const MonthSchema = z.object({
  budget_id: z.string().describe("The budget ID"),
  month: z.string().describe("The budget month in ISO format (YYYY-MM-01)"),
});

// Tool definitions
const tools = [
  {
    name: "list_budgets",
    description: "Get all budgets for the authenticated user. Returns budget names, IDs, and last modified dates.",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_budget",
    description: "Get detailed information about a specific budget including accounts, categories, and settings.",
    inputSchema: {
      type: "object" as const,
      properties: {
        budget_id: { type: "string", description: "The budget ID (use 'last-used' for most recent)" },
      },
      required: ["budget_id"],
    },
  },
  {
    name: "list_accounts",
    description: "Get all accounts for a budget. Returns account names, types, balances, and status.",
    inputSchema: {
      type: "object" as const,
      properties: {
        budget_id: { type: "string", description: "The budget ID" },
      },
      required: ["budget_id"],
    },
  },
  {
    name: "get_account",
    description: "Get detailed information about a specific account.",
    inputSchema: {
      type: "object" as const,
      properties: {
        budget_id: { type: "string", description: "The budget ID" },
        account_id: { type: "string", description: "The account ID" },
      },
      required: ["budget_id", "account_id"],
    },
  },
  {
    name: "list_categories",
    description: "Get all categories for a budget, grouped by category group. Includes budgeted amounts and activity.",
    inputSchema: {
      type: "object" as const,
      properties: {
        budget_id: { type: "string", description: "The budget ID" },
      },
      required: ["budget_id"],
    },
  },
  {
    name: "get_category",
    description: "Get detailed information about a specific category including current month data.",
    inputSchema: {
      type: "object" as const,
      properties: {
        budget_id: { type: "string", description: "The budget ID" },
        category_id: { type: "string", description: "The category ID" },
      },
      required: ["budget_id", "category_id"],
    },
  },
  {
    name: "list_transactions",
    description: "Get transactions for a budget. Supports filtering by date, type, category, payee, and account.",
    inputSchema: {
      type: "object" as const,
      properties: {
        budget_id: { type: "string", description: "The budget ID" },
        since_date: { type: "string", description: "Only return transactions on or after this date (YYYY-MM-DD)" },
        type: { type: "string", enum: ["uncategorized", "unapproved"], description: "Filter by transaction type" },
        category_id: { type: "string", description: "Filter by category ID" },
        payee_id: { type: "string", description: "Filter by payee ID" },
        account_id: { type: "string", description: "Filter by account ID" },
      },
      required: ["budget_id"],
    },
  },
  {
    name: "get_transaction",
    description: "Get detailed information about a specific transaction.",
    inputSchema: {
      type: "object" as const,
      properties: {
        budget_id: { type: "string", description: "The budget ID" },
        transaction_id: { type: "string", description: "The transaction ID" },
      },
      required: ["budget_id", "transaction_id"],
    },
  },
  {
    name: "list_payees",
    description: "Get all payees for a budget.",
    inputSchema: {
      type: "object" as const,
      properties: {
        budget_id: { type: "string", description: "The budget ID" },
      },
      required: ["budget_id"],
    },
  },
  {
    name: "list_scheduled_transactions",
    description: "Get all scheduled/recurring transactions for a budget.",
    inputSchema: {
      type: "object" as const,
      properties: {
        budget_id: { type: "string", description: "The budget ID" },
      },
      required: ["budget_id"],
    },
  },
  {
    name: "list_months",
    description: "Get all budget months. Returns month summaries with income, budgeted, and activity totals.",
    inputSchema: {
      type: "object" as const,
      properties: {
        budget_id: { type: "string", description: "The budget ID" },
      },
      required: ["budget_id"],
    },
  },
  {
    name: "get_month",
    description: "Get detailed budget information for a specific month including all category balances.",
    inputSchema: {
      type: "object" as const,
      properties: {
        budget_id: { type: "string", description: "The budget ID" },
        month: { type: "string", description: "The budget month (YYYY-MM-01)" },
      },
      required: ["budget_id", "month"],
    },
  },
];

async function main() {
  const token = process.env.YNAB_API_TOKEN;
  if (!token) {
    console.error("Error: YNAB_API_TOKEN environment variable is required");
    process.exit(1);
  }

  const client = new YNABClient(token);

  const server = new Server(
    { name: "ynab-mcp-server", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result: any;

      switch (name) {
        case "list_budgets":
          result = await client.listBudgets();
          break;

        case "get_budget": {
          const { budget_id } = BudgetIdSchema.parse(args);
          result = await client.getBudget(budget_id);
          break;
        }

        case "list_accounts": {
          const { budget_id } = BudgetIdSchema.parse(args);
          result = await client.listAccounts(budget_id);
          break;
        }

        case "get_account": {
          const { budget_id, account_id } = AccountSchema.parse(args);
          result = await client.getAccount(budget_id, account_id);
          break;
        }

        case "list_categories": {
          const { budget_id } = BudgetIdSchema.parse(args);
          result = await client.listCategories(budget_id);
          break;
        }

        case "get_category": {
          const { budget_id, category_id } = CategorySchema.parse(args);
          result = await client.getCategory(budget_id, category_id);
          break;
        }

        case "list_transactions": {
          const params = TransactionsSchema.parse(args);
          result = await client.listTransactions(params.budget_id, {
            sinceDate: params.since_date,
            type: params.type,
            categoryId: params.category_id,
            payeeId: params.payee_id,
            accountId: params.account_id,
          });
          break;
        }

        case "get_transaction": {
          const { budget_id, transaction_id } = TransactionSchema.parse(args);
          result = await client.getTransaction(budget_id, transaction_id);
          break;
        }

        case "list_payees": {
          const { budget_id } = BudgetIdSchema.parse(args);
          result = await client.listPayees(budget_id);
          break;
        }

        case "list_scheduled_transactions": {
          const { budget_id } = BudgetIdSchema.parse(args);
          result = await client.listScheduledTransactions(budget_id);
          break;
        }

        case "list_months": {
          const { budget_id } = BudgetIdSchema.parse(args);
          result = await client.listMonths(budget_id);
          break;
        }

        case "get_month": {
          const { budget_id, month } = MonthSchema.parse(args);
          result = await client.getMonth(budget_id, month);
          break;
        }

        default:
          return {
            isError: true,
            content: [{ type: "text" as const, text: `Unknown tool: ${name}` }],
          };
      }

      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        isError: true,
        content: [{ type: "text" as const, text: `Error: ${message}` }],
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("YNAB MCP server running");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

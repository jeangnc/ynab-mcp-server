#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

import { YNABClient } from "./client.js";
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
import { tools, type ToolName } from "./tools.js";

type ToolHandler = (args: unknown) => Promise<unknown>;

function createHandlers(client: YNABClient): Record<ToolName, ToolHandler> {
  return {
    list_budgets: () => client.listBudgets(),

    get_budget: (args) => {
      const { budget_id } = BudgetIdSchema.parse(args);
      return client.getBudget(budget_id);
    },

    list_accounts: (args) => {
      const { budget_id } = BudgetIdSchema.parse(args);
      return client.listAccounts(budget_id);
    },

    get_account: (args) => {
      const { budget_id, account_id } = AccountSchema.parse(args);
      return client.getAccount(budget_id, account_id);
    },

    list_categories: (args) => {
      const { budget_id } = BudgetIdSchema.parse(args);
      return client.listCategories(budget_id);
    },

    get_category: (args) => {
      const { budget_id, category_id } = CategorySchema.parse(args);
      return client.getCategory(budget_id, category_id);
    },

    list_transactions: (args) => {
      const params = TransactionsSchema.parse(args);
      return client.listTransactions(params.budget_id, {
        sinceDate: params.since_date,
        type: params.type,
        categoryId: params.category_id,
        payeeId: params.payee_id,
        accountId: params.account_id,
      });
    },

    get_transaction: (args) => {
      const { budget_id, transaction_id } = TransactionSchema.parse(args);
      return client.getTransaction(budget_id, transaction_id);
    },

    list_payees: (args) => {
      const { budget_id } = BudgetIdSchema.parse(args);
      return client.listPayees(budget_id);
    },

    list_scheduled_transactions: (args) => {
      const { budget_id } = BudgetIdSchema.parse(args);
      return client.listScheduledTransactions(budget_id);
    },

    list_months: (args) => {
      const { budget_id } = BudgetIdSchema.parse(args);
      return client.listMonths(budget_id);
    },

    get_month: (args) => {
      const { budget_id, month } = MonthSchema.parse(args);
      return client.getMonth(budget_id, month);
    },

    create_transaction: (args) => {
      const { budget_id, ...transaction } = CreateTransactionSchema.parse(args);
      return client.createTransaction(budget_id, transaction);
    },

    update_transaction: (args) => {
      const { budget_id, transaction_id, ...updates } = UpdateTransactionSchema.parse(args);
      return client.updateTransaction(budget_id, transaction_id, updates);
    },

    delete_transaction: (args) => {
      const { budget_id, transaction_id } = DeleteTransactionSchema.parse(args);
      return client.deleteTransaction(budget_id, transaction_id);
    },

    update_category_budget: (args) => {
      const { budget_id, month, category_id, budgeted } = UpdateCategoryBudgetSchema.parse(args);
      return client.updateCategoryBudget(budget_id, month, category_id, budgeted);
    },

    create_account: (args) => {
      const { budget_id, ...account } = CreateAccountSchema.parse(args);
      return client.createAccount(budget_id, account);
    },
  };
}

async function main(): Promise<void> {
  const token = process.env["YNAB_API_TOKEN"];
  if (!token) {
    console.error("Error: YNAB_API_TOKEN environment variable is required");
    process.exit(1);
  }

  const client = new YNABClient(token);
  const handlers = createHandlers(client);

  const server = new Server(
    { name: "ynab-mcp-server", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, () => Promise.resolve({ tools }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    const handler = handlers[name as ToolName];
    if (!handler) {
      return {
        isError: true,
        content: [{ type: "text" as const, text: `Unknown tool: ${name}` }],
      };
    }

    try {
      const result = await handler(args);
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

main().catch((error: unknown) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

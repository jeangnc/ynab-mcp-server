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
import { tools } from "./tools.js";

async function main(): Promise<void> {
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

  server.setRequestHandler(ListToolsRequestSchema, () => Promise.resolve({ tools }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result: unknown;

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

        case "create_transaction": {
          const { budget_id, ...transaction } = CreateTransactionSchema.parse(args);
          result = await client.createTransaction(budget_id, transaction);
          break;
        }

        case "update_transaction": {
          const { budget_id, transaction_id, ...updates } = UpdateTransactionSchema.parse(args);
          result = await client.updateTransaction(budget_id, transaction_id, updates);
          break;
        }

        case "delete_transaction": {
          const { budget_id, transaction_id } = DeleteTransactionSchema.parse(args);
          result = await client.deleteTransaction(budget_id, transaction_id);
          break;
        }

        case "update_category_budget": {
          const { budget_id, month, category_id, budgeted } =
            UpdateCategoryBudgetSchema.parse(args);
          result = await client.updateCategoryBudget(budget_id, month, category_id, budgeted);
          break;
        }

        case "create_account": {
          const { budget_id, ...account } = CreateAccountSchema.parse(args);
          result = await client.createAccount(budget_id, account);
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

main().catch((error: unknown) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

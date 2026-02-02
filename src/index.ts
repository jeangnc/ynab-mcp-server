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
  ScheduledTransactionSchema,
  CreateScheduledTransactionSchema,
  UpdateScheduledTransactionSchema,
  DeleteScheduledTransactionSchema,
  UpdatePayeeSchema,
  ListHistorySchema,
  GetHistoryEntrySchema,
  UndoOperationSchema,
} from "./schemas.js";
import { tools, type ToolName } from "./tools.js";
import {
  HistoryStore,
  getDefaultHistoryPath,
  TrackedYNABClient,
  executeUndo,
  UndoError,
  isUndoable,
  type HistoryEntryId,
} from "./history/index.js";

type ToolHandler = (args: unknown) => Promise<unknown>;

interface HistoryListResponse {
  entries: Array<{
    id: string;
    timestamp: string;
    budgetId: string;
    operation: string;
    status: string;
    canUndo: boolean;
  }>;
}

function createHandlers(
  client: YNABClient,
  trackedClient: TrackedYNABClient,
  historyStore: HistoryStore
): Record<ToolName, ToolHandler> {
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

    // Write operations use TrackedYNABClient for history tracking
    create_transaction: (args) => {
      const { budget_id, ...transaction } = CreateTransactionSchema.parse(args);
      return trackedClient.createTransaction(budget_id, transaction);
    },

    update_transaction: (args) => {
      const { budget_id, transaction_id, ...updates } = UpdateTransactionSchema.parse(args);
      return trackedClient.updateTransaction(budget_id, transaction_id, updates);
    },

    delete_transaction: (args) => {
      const { budget_id, transaction_id } = DeleteTransactionSchema.parse(args);
      return trackedClient.deleteTransaction(budget_id, transaction_id);
    },

    update_category_budget: (args) => {
      const { budget_id, month, category_id, budgeted } = UpdateCategoryBudgetSchema.parse(args);
      return trackedClient.updateCategoryBudget(budget_id, month, category_id, budgeted);
    },

    create_account: (args) => {
      const { budget_id, ...account } = CreateAccountSchema.parse(args);
      return trackedClient.createAccount(budget_id, account);
    },

    get_scheduled_transaction: (args) => {
      const { budget_id, scheduled_transaction_id } = ScheduledTransactionSchema.parse(args);
      return client.getScheduledTransaction(budget_id, scheduled_transaction_id);
    },

    create_scheduled_transaction: (args) => {
      const { budget_id, ...scheduledTransaction } = CreateScheduledTransactionSchema.parse(args);
      return trackedClient.createScheduledTransaction(budget_id, scheduledTransaction);
    },

    update_scheduled_transaction: (args) => {
      const { budget_id, scheduled_transaction_id, ...updates } =
        UpdateScheduledTransactionSchema.parse(args);
      return trackedClient.updateScheduledTransaction(budget_id, scheduled_transaction_id, updates);
    },

    delete_scheduled_transaction: (args) => {
      const { budget_id, scheduled_transaction_id } = DeleteScheduledTransactionSchema.parse(args);
      return trackedClient.deleteScheduledTransaction(budget_id, scheduled_transaction_id);
    },

    update_payee: (args) => {
      const { budget_id, payee_id, name } = UpdatePayeeSchema.parse(args);
      return trackedClient.updatePayee(budget_id, payee_id, name);
    },

    // History operations (sync but wrapped in Promise for ToolHandler compatibility)
    list_history: (args): Promise<HistoryListResponse> => {
      const { budget_id, limit = 20 } = ListHistorySchema.parse(args);

      const entries = budget_id ? historyStore.getByBudget(budget_id) : historyStore.getAll();

      return Promise.resolve({
        entries: entries.slice(0, limit).map((entry) => ({
          id: entry.id,
          timestamp: entry.timestamp,
          budgetId: entry.budgetId,
          operation: entry.operation,
          status: entry.status,
          canUndo: isUndoable(entry),
        })),
      });
    },

    get_history_entry: (args) => {
      const { entry_id } = GetHistoryEntrySchema.parse(args);
      const entry = historyStore.get(entry_id as HistoryEntryId);

      if (!entry) {
        throw new Error(`History entry not found: ${entry_id}`);
      }

      return Promise.resolve({
        entry,
        canUndo: isUndoable(entry),
      });
    },

    undo_operation: async (args) => {
      const { entry_id } = UndoOperationSchema.parse(args);
      const entry = historyStore.get(entry_id as HistoryEntryId);

      if (!entry) {
        throw new Error(`History entry not found: ${entry_id}`);
      }

      try {
        await executeUndo(client, entry);
        await historyStore.updateStatus(entry.id, "undone");
        return {
          success: true,
          message: `Successfully undid ${entry.operation}`,
          entryId: entry.id,
        };
      } catch (error) {
        if (error instanceof UndoError) {
          // Don't update status for UndoError (e.g., already undone, can't undo account)
          throw error;
        }
        // Mark as failed for API errors
        await historyStore.updateStatus(entry.id, "undo_failed");
        throw error;
      }
    },
  };
}

async function main(): Promise<void> {
  const token = process.env["YNAB_API_TOKEN"];
  if (!token) {
    console.error("Error: YNAB_API_TOKEN environment variable is required");
    process.exit(1);
  }

  // Initialize history store
  const historyStore = new HistoryStore(getDefaultHistoryPath());
  await historyStore.load();

  // Initialize clients
  const client = new YNABClient(token);
  const trackedClient = new TrackedYNABClient(client, historyStore);

  const handlers = createHandlers(client, trackedClient, historyStore);

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

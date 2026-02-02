import type {
  YNABClient,
  CreateTransactionInput,
  CreateScheduledTransactionInput,
} from "../client.js";
import type {
  HistoryEntry,
  CreateTransactionEntry,
  UpdateTransactionEntry,
  DeleteTransactionEntry,
  CreateScheduledTransactionEntry,
  UpdateScheduledTransactionEntry,
  DeleteScheduledTransactionEntry,
  UpdateCategoryBudgetEntry,
  UpdatePayeeEntry,
  StoredTransactionState,
  StoredScheduledTransactionState,
} from "./types.js";

export class UndoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UndoError";
  }
}

export async function executeUndo(client: YNABClient, entry: HistoryEntry): Promise<void> {
  // Check if entry can be undone
  if (entry.status === "undone") {
    throw new UndoError("Entry has already been undone");
  }
  if (entry.status === "undo_failed") {
    throw new UndoError("Previous undo attempt failed");
  }

  switch (entry.operation) {
    case "create_transaction":
      await undoCreateTransaction(client, entry);
      break;
    case "update_transaction":
      await undoUpdateTransaction(client, entry);
      break;
    case "delete_transaction":
      await undoDeleteTransaction(client, entry);
      break;
    case "create_scheduled_transaction":
      await undoCreateScheduledTransaction(client, entry);
      break;
    case "update_scheduled_transaction":
      await undoUpdateScheduledTransaction(client, entry);
      break;
    case "delete_scheduled_transaction":
      await undoDeleteScheduledTransaction(client, entry);
      break;
    case "create_account":
      throw new UndoError(
        "Cannot undo account creation: YNAB API does not support account deletion"
      );
    case "update_category_budget":
      await undoUpdateCategoryBudget(client, entry);
      break;
    case "update_payee":
      await undoUpdatePayee(client, entry);
      break;
  }
}

async function undoCreateTransaction(
  client: YNABClient,
  entry: CreateTransactionEntry
): Promise<void> {
  await client.deleteTransaction(entry.budgetId, entry.createdId);
}

async function undoUpdateTransaction(
  client: YNABClient,
  entry: UpdateTransactionEntry
): Promise<void> {
  const { beforeState } = entry;
  await client.updateTransaction(entry.budgetId, entry.transactionId, {
    account_id: beforeState.account_id,
    date: beforeState.date,
    amount: beforeState.amount,
    payee_id: nullToUndefined(beforeState.payee_id),
    payee_name: nullToUndefined(beforeState.payee_name),
    category_id: nullToUndefined(beforeState.category_id),
    memo: nullToUndefined(beforeState.memo),
    cleared: beforeState.cleared,
    approved: beforeState.approved,
    flag_color: nullToUndefined(beforeState.flag_color),
  });
}

async function undoDeleteTransaction(
  client: YNABClient,
  entry: DeleteTransactionEntry
): Promise<void> {
  const { beforeState } = entry;
  await client.createTransaction(entry.budgetId, toTransactionInput(beforeState));
}

async function undoCreateScheduledTransaction(
  client: YNABClient,
  entry: CreateScheduledTransactionEntry
): Promise<void> {
  await client.deleteScheduledTransaction(entry.budgetId, entry.createdId);
}

async function undoUpdateScheduledTransaction(
  client: YNABClient,
  entry: UpdateScheduledTransactionEntry
): Promise<void> {
  const { beforeState } = entry;
  await client.updateScheduledTransaction(
    entry.budgetId,
    entry.scheduledTransactionId,
    toScheduledTransactionInput(beforeState)
  );
}

async function undoDeleteScheduledTransaction(
  client: YNABClient,
  entry: DeleteScheduledTransactionEntry
): Promise<void> {
  const { beforeState } = entry;
  await client.createScheduledTransaction(entry.budgetId, toScheduledTransactionInput(beforeState));
}

async function undoUpdateCategoryBudget(
  client: YNABClient,
  entry: UpdateCategoryBudgetEntry
): Promise<void> {
  await client.updateCategoryBudget(
    entry.budgetId,
    entry.month,
    entry.categoryId,
    entry.beforeBudgeted
  );
}

async function undoUpdatePayee(client: YNABClient, entry: UpdatePayeeEntry): Promise<void> {
  await client.updatePayee(entry.budgetId, entry.payeeId, entry.beforeName);
}

// Convert null to undefined for compatibility with client input types
function nullToUndefined<T>(value: T | null | undefined): T | undefined {
  return value === null ? undefined : value;
}

// Helper to convert stored state to transaction input (omitting id)
function toTransactionInput(state: StoredTransactionState): CreateTransactionInput {
  return {
    account_id: state.account_id,
    date: state.date,
    amount: state.amount,
    payee_id: nullToUndefined(state.payee_id),
    payee_name: nullToUndefined(state.payee_name),
    category_id: nullToUndefined(state.category_id),
    memo: nullToUndefined(state.memo),
    cleared: state.cleared,
    approved: state.approved,
    flag_color: nullToUndefined(state.flag_color),
  };
}

// Helper to convert stored state to scheduled transaction input (omitting id)
function toScheduledTransactionInput(
  state: StoredScheduledTransactionState
): CreateScheduledTransactionInput {
  return {
    account_id: state.account_id,
    date: state.date,
    amount: state.amount,
    payee_id: nullToUndefined(state.payee_id),
    payee_name: nullToUndefined(state.payee_name),
    category_id: nullToUndefined(state.category_id),
    memo: nullToUndefined(state.memo),
    flag_color: nullToUndefined(state.flag_color),
    frequency: state.frequency,
  };
}

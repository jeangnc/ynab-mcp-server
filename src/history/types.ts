import type {
  TransactionClearedStatus,
  TransactionFlagColor,
  ScheduledTransactionFrequency,
} from "../schemas.js";

// Branded type for history entry IDs
declare const historyEntryIdBrand: unique symbol;
export type HistoryEntryId = string & { readonly [historyEntryIdBrand]: never };

export function createHistoryEntryId(): HistoryEntryId {
  return crypto.randomUUID() as HistoryEntryId;
}

// Status of a history entry
export type HistoryEntryStatus = "success" | "undone" | "undo_failed";

// Stored transaction state for undo operations
// Note: Uses `| null | undefined` to handle both API null values and missing properties
export interface StoredTransactionState {
  readonly id: string;
  readonly account_id: string;
  readonly date: string;
  readonly amount: number;
  readonly payee_id: string | null | undefined;
  readonly payee_name: string | null | undefined;
  readonly category_id: string | null | undefined;
  readonly memo: string | null | undefined;
  readonly cleared: TransactionClearedStatus | undefined;
  readonly approved: boolean | undefined;
  readonly flag_color: TransactionFlagColor | null | undefined;
}

// Stored scheduled transaction state for undo operations
export interface StoredScheduledTransactionState {
  readonly id: string;
  readonly account_id: string;
  readonly date: string;
  readonly amount: number;
  readonly payee_id: string | null | undefined;
  readonly payee_name: string | null | undefined;
  readonly category_id: string | null | undefined;
  readonly memo: string | null | undefined;
  readonly flag_color: TransactionFlagColor | null | undefined;
  readonly frequency: ScheduledTransactionFrequency | undefined;
}

// Base interface for all history entries
export interface BaseHistoryEntry {
  readonly id: HistoryEntryId;
  readonly timestamp: string;
  readonly budgetId: string;
  readonly status: HistoryEntryStatus;
}

// Transaction operations
export interface CreateTransactionEntry extends BaseHistoryEntry {
  readonly operation: "create_transaction";
  readonly createdId: string;
}

export interface UpdateTransactionEntry extends BaseHistoryEntry {
  readonly operation: "update_transaction";
  readonly transactionId: string;
  readonly beforeState: StoredTransactionState;
}

export interface DeleteTransactionEntry extends BaseHistoryEntry {
  readonly operation: "delete_transaction";
  readonly transactionId: string;
  readonly beforeState: StoredTransactionState;
}

// Scheduled transaction operations
export interface CreateScheduledTransactionEntry extends BaseHistoryEntry {
  readonly operation: "create_scheduled_transaction";
  readonly createdId: string;
}

export interface UpdateScheduledTransactionEntry extends BaseHistoryEntry {
  readonly operation: "update_scheduled_transaction";
  readonly scheduledTransactionId: string;
  readonly beforeState: StoredScheduledTransactionState;
}

export interface DeleteScheduledTransactionEntry extends BaseHistoryEntry {
  readonly operation: "delete_scheduled_transaction";
  readonly scheduledTransactionId: string;
  readonly beforeState: StoredScheduledTransactionState;
}

// Account operations (not undoable)
export interface CreateAccountEntry extends BaseHistoryEntry {
  readonly operation: "create_account";
  readonly createdId: string;
  readonly canUndo: false;
}

// Category budget operations
export interface UpdateCategoryBudgetEntry extends BaseHistoryEntry {
  readonly operation: "update_category_budget";
  readonly categoryId: string;
  readonly month: string;
  readonly beforeBudgeted: number;
}

// Payee operations
export interface UpdatePayeeEntry extends BaseHistoryEntry {
  readonly operation: "update_payee";
  readonly payeeId: string;
  readonly beforeName: string;
}

// Discriminated union of all history entry types
export type HistoryEntry =
  | CreateTransactionEntry
  | UpdateTransactionEntry
  | DeleteTransactionEntry
  | CreateScheduledTransactionEntry
  | UpdateScheduledTransactionEntry
  | DeleteScheduledTransactionEntry
  | CreateAccountEntry
  | UpdateCategoryBudgetEntry
  | UpdatePayeeEntry;

// Type for operations that can be undone
export type UndoableHistoryEntry = Exclude<HistoryEntry, CreateAccountEntry>;

// Type guard to check if an entry can be undone
export function isUndoable(entry: HistoryEntry): entry is UndoableHistoryEntry {
  if (entry.operation === "create_account") {
    return false;
  }
  return entry.status === "success";
}

// Type for operation names
export type OperationType = HistoryEntry["operation"];

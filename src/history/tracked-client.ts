import type {
  YNABClient,
  CreateTransactionInput,
  UpdateTransactionInput,
  CreateAccountInput,
  CreateScheduledTransactionInput,
  UpdateScheduledTransactionInput,
  CreateTransactionResponse,
  UpdateTransactionResponse,
  DeleteTransactionResponse,
  CreateScheduledTransactionResponse,
  UpdateScheduledTransactionResponse,
  DeleteScheduledTransactionResponse,
  CreateAccountResponse,
  UpdateCategoryBudgetResponse,
  UpdatePayeeResponse,
} from "../client.js";
import type { HistoryStore } from "./history-store.js";
import type {
  CreateTransactionEntry,
  UpdateTransactionEntry,
  DeleteTransactionEntry,
  CreateScheduledTransactionEntry,
  UpdateScheduledTransactionEntry,
  DeleteScheduledTransactionEntry,
  CreateAccountEntry,
  UpdateCategoryBudgetEntry,
  UpdatePayeeEntry,
  StoredTransactionState,
  StoredScheduledTransactionState,
} from "./types.js";
import { createHistoryEntryId } from "./types.js";

export class TrackedYNABClient {
  constructor(
    private readonly client: YNABClient,
    private readonly historyStore: HistoryStore
  ) {}

  async createTransaction(
    budgetId: string,
    input: CreateTransactionInput
  ): Promise<CreateTransactionResponse> {
    const result = await this.client.createTransaction(budgetId, input);

    const entry: CreateTransactionEntry = {
      id: createHistoryEntryId(),
      timestamp: new Date().toISOString(),
      budgetId,
      status: "success",
      operation: "create_transaction",
      createdId: result.transaction.id,
    };

    await this.historyStore.add(entry);
    return result;
  }

  async updateTransaction(
    budgetId: string,
    transactionId: string,
    input: UpdateTransactionInput
  ): Promise<UpdateTransactionResponse> {
    // Fetch before state
    const { transaction: before } = await this.client.getTransaction(budgetId, transactionId);
    const beforeState = toStoredTransactionState(before);

    // Execute the update
    const result = await this.client.updateTransaction(budgetId, transactionId, input);

    const entry: UpdateTransactionEntry = {
      id: createHistoryEntryId(),
      timestamp: new Date().toISOString(),
      budgetId,
      status: "success",
      operation: "update_transaction",
      transactionId,
      beforeState,
    };

    await this.historyStore.add(entry);
    return result;
  }

  async deleteTransaction(
    budgetId: string,
    transactionId: string
  ): Promise<DeleteTransactionResponse> {
    // Fetch before state
    const { transaction: before } = await this.client.getTransaction(budgetId, transactionId);
    const beforeState = toStoredTransactionState(before);

    // Execute the delete
    const result = await this.client.deleteTransaction(budgetId, transactionId);

    const entry: DeleteTransactionEntry = {
      id: createHistoryEntryId(),
      timestamp: new Date().toISOString(),
      budgetId,
      status: "success",
      operation: "delete_transaction",
      transactionId,
      beforeState,
    };

    await this.historyStore.add(entry);
    return result;
  }

  async createScheduledTransaction(
    budgetId: string,
    input: CreateScheduledTransactionInput
  ): Promise<CreateScheduledTransactionResponse> {
    const result = await this.client.createScheduledTransaction(budgetId, input);

    const entry: CreateScheduledTransactionEntry = {
      id: createHistoryEntryId(),
      timestamp: new Date().toISOString(),
      budgetId,
      status: "success",
      operation: "create_scheduled_transaction",
      createdId: result.scheduled_transaction.id,
    };

    await this.historyStore.add(entry);
    return result;
  }

  async updateScheduledTransaction(
    budgetId: string,
    scheduledTransactionId: string,
    input: UpdateScheduledTransactionInput
  ): Promise<UpdateScheduledTransactionResponse> {
    // Fetch before state
    const { scheduled_transaction: before } = await this.client.getScheduledTransaction(
      budgetId,
      scheduledTransactionId
    );
    const beforeState = toStoredScheduledTransactionState(before);

    // Execute the update
    const result = await this.client.updateScheduledTransaction(
      budgetId,
      scheduledTransactionId,
      input
    );

    const entry: UpdateScheduledTransactionEntry = {
      id: createHistoryEntryId(),
      timestamp: new Date().toISOString(),
      budgetId,
      status: "success",
      operation: "update_scheduled_transaction",
      scheduledTransactionId,
      beforeState,
    };

    await this.historyStore.add(entry);
    return result;
  }

  async deleteScheduledTransaction(
    budgetId: string,
    scheduledTransactionId: string
  ): Promise<DeleteScheduledTransactionResponse> {
    // Fetch before state
    const { scheduled_transaction: before } = await this.client.getScheduledTransaction(
      budgetId,
      scheduledTransactionId
    );
    const beforeState = toStoredScheduledTransactionState(before);

    // Execute the delete
    const result = await this.client.deleteScheduledTransaction(budgetId, scheduledTransactionId);

    const entry: DeleteScheduledTransactionEntry = {
      id: createHistoryEntryId(),
      timestamp: new Date().toISOString(),
      budgetId,
      status: "success",
      operation: "delete_scheduled_transaction",
      scheduledTransactionId,
      beforeState,
    };

    await this.historyStore.add(entry);
    return result;
  }

  async createAccount(budgetId: string, input: CreateAccountInput): Promise<CreateAccountResponse> {
    const result = await this.client.createAccount(budgetId, input);

    const entry: CreateAccountEntry = {
      id: createHistoryEntryId(),
      timestamp: new Date().toISOString(),
      budgetId,
      status: "success",
      operation: "create_account",
      createdId: result.account.id,
      canUndo: false,
    };

    await this.historyStore.add(entry);
    return result;
  }

  async updateCategoryBudget(
    budgetId: string,
    month: string,
    categoryId: string,
    budgeted: number
  ): Promise<UpdateCategoryBudgetResponse> {
    // Fetch before state
    const { category: before } = await this.client.getCategory(budgetId, categoryId);
    const beforeBudgeted = before.budgeted;

    // Execute the update
    const result = await this.client.updateCategoryBudget(budgetId, month, categoryId, budgeted);

    const entry: UpdateCategoryBudgetEntry = {
      id: createHistoryEntryId(),
      timestamp: new Date().toISOString(),
      budgetId,
      status: "success",
      operation: "update_category_budget",
      categoryId,
      month,
      beforeBudgeted,
    };

    await this.historyStore.add(entry);
    return result;
  }

  async updatePayee(budgetId: string, payeeId: string, name: string): Promise<UpdatePayeeResponse> {
    // Fetch before state - need to list payees and find the one we're updating
    const { payees } = await this.client.listPayees(budgetId);
    const payee = payees.find((p) => p.id === payeeId);
    if (!payee) {
      throw new Error("Payee not found");
    }
    const beforeName = payee.name;

    // Execute the update
    const result = await this.client.updatePayee(budgetId, payeeId, name);

    const entry: UpdatePayeeEntry = {
      id: createHistoryEntryId(),
      timestamp: new Date().toISOString(),
      budgetId,
      status: "success",
      operation: "update_payee",
      payeeId,
      beforeName,
    };

    await this.historyStore.add(entry);
    return result;
  }
}

// Helper to extract storable state from a transaction
function toStoredTransactionState(transaction: {
  id: string;
  account_id: string;
  date: string;
  amount: number;
  payee_id?: string | null;
  payee_name?: string | null;
  category_id?: string | null;
  memo?: string | null;
  cleared?: string;
  approved?: boolean;
  flag_color?: string | null;
}): StoredTransactionState {
  return {
    id: transaction.id,
    account_id: transaction.account_id,
    date: transaction.date,
    amount: transaction.amount,
    payee_id: transaction.payee_id,
    payee_name: transaction.payee_name,
    category_id: transaction.category_id,
    memo: transaction.memo,
    cleared: transaction.cleared as StoredTransactionState["cleared"],
    approved: transaction.approved,
    flag_color: transaction.flag_color as StoredTransactionState["flag_color"],
  };
}

// Helper to extract storable state from a scheduled transaction
function toStoredScheduledTransactionState(scheduledTransaction: {
  id: string;
  account_id: string;
  date_next: string;
  amount: number;
  payee_id?: string | null;
  payee_name?: string | null;
  category_id?: string | null;
  memo?: string | null;
  flag_color?: string | null;
  frequency?: string;
}): StoredScheduledTransactionState {
  return {
    id: scheduledTransaction.id,
    account_id: scheduledTransaction.account_id,
    date: scheduledTransaction.date_next,
    amount: scheduledTransaction.amount,
    payee_id: scheduledTransaction.payee_id,
    payee_name: scheduledTransaction.payee_name,
    category_id: scheduledTransaction.category_id,
    memo: scheduledTransaction.memo,
    flag_color: scheduledTransaction.flag_color as StoredScheduledTransactionState["flag_color"],
    frequency: scheduledTransaction.frequency as StoredScheduledTransactionState["frequency"],
  };
}

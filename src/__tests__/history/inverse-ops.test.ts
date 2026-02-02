import { describe, it, expect, beforeEach, vi } from "vitest";
import { executeUndo, UndoError } from "../../history/inverse-ops.js";
import type { YNABClient } from "../../client.js";
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
} from "../../history/types.js";
import { createHistoryEntryId } from "../../history/types.js";

describe("executeUndo", () => {
  let mockClient: {
    deleteTransaction: ReturnType<typeof vi.fn>;
    updateTransaction: ReturnType<typeof vi.fn>;
    createTransaction: ReturnType<typeof vi.fn>;
    deleteScheduledTransaction: ReturnType<typeof vi.fn>;
    updateScheduledTransaction: ReturnType<typeof vi.fn>;
    createScheduledTransaction: ReturnType<typeof vi.fn>;
    updateCategoryBudget: ReturnType<typeof vi.fn>;
    updatePayee: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockClient = {
      deleteTransaction: vi.fn(),
      updateTransaction: vi.fn(),
      createTransaction: vi.fn(),
      deleteScheduledTransaction: vi.fn(),
      updateScheduledTransaction: vi.fn(),
      createScheduledTransaction: vi.fn(),
      updateCategoryBudget: vi.fn(),
      updatePayee: vi.fn(),
    };
  });

  describe("create_transaction", () => {
    it("deletes the created transaction", async () => {
      const entry: CreateTransactionEntry = {
        id: createHistoryEntryId(),
        timestamp: new Date().toISOString(),
        budgetId: "budget-123",
        status: "success",
        operation: "create_transaction",
        createdId: "tx-456",
      };

      mockClient.deleteTransaction.mockResolvedValueOnce({
        transaction: { id: "tx-456", deleted: true },
      });

      await executeUndo(mockClient as unknown as YNABClient, entry);

      expect(mockClient.deleteTransaction).toHaveBeenCalledWith("budget-123", "tx-456");
    });
  });

  describe("update_transaction", () => {
    it("restores the transaction to its before state", async () => {
      const entry: UpdateTransactionEntry = {
        id: createHistoryEntryId(),
        timestamp: new Date().toISOString(),
        budgetId: "budget-123",
        status: "success",
        operation: "update_transaction",
        transactionId: "tx-456",
        beforeState: {
          id: "tx-456",
          account_id: "account-789",
          date: "2025-01-01",
          amount: -50,
          memo: "Original memo",
          category_id: "cat-abc",
          payee_id: undefined,
          payee_name: undefined,
          cleared: undefined,
          approved: undefined,
          flag_color: undefined,
        },
      };

      mockClient.updateTransaction.mockResolvedValueOnce({
        transaction: { id: "tx-456" },
      });

      await executeUndo(mockClient as unknown as YNABClient, entry);

      expect(mockClient.updateTransaction).toHaveBeenCalledWith("budget-123", "tx-456", {
        account_id: "account-789",
        date: "2025-01-01",
        amount: -50,
        memo: "Original memo",
        category_id: "cat-abc",
      });
    });

    it("handles null values in before state", async () => {
      const entry: UpdateTransactionEntry = {
        id: createHistoryEntryId(),
        timestamp: new Date().toISOString(),
        budgetId: "budget-123",
        status: "success",
        operation: "update_transaction",
        transactionId: "tx-456",
        beforeState: {
          id: "tx-456",
          account_id: "account-789",
          date: "2025-01-01",
          amount: -50,
          memo: null,
          category_id: null,
          payee_id: null,
          payee_name: null,
          cleared: undefined,
          approved: undefined,
          flag_color: null,
        },
      };

      mockClient.updateTransaction.mockResolvedValueOnce({
        transaction: { id: "tx-456" },
      });

      await executeUndo(mockClient as unknown as YNABClient, entry);

      // null values are converted to undefined for the API call
      expect(mockClient.updateTransaction).toHaveBeenCalledWith("budget-123", "tx-456", {
        account_id: "account-789",
        date: "2025-01-01",
        amount: -50,
        memo: undefined,
        category_id: undefined,
        payee_id: undefined,
        payee_name: undefined,
        cleared: undefined,
        approved: undefined,
        flag_color: undefined,
      });
    });
  });

  describe("delete_transaction", () => {
    it("recreates the deleted transaction", async () => {
      const entry: DeleteTransactionEntry = {
        id: createHistoryEntryId(),
        timestamp: new Date().toISOString(),
        budgetId: "budget-123",
        status: "success",
        operation: "delete_transaction",
        transactionId: "tx-456",
        beforeState: {
          id: "tx-456",
          account_id: "account-789",
          date: "2025-01-01",
          amount: -75,
          payee_name: "Store",
          memo: "Groceries",
          payee_id: undefined,
          category_id: undefined,
          cleared: undefined,
          approved: undefined,
          flag_color: undefined,
        },
      };

      mockClient.createTransaction.mockResolvedValueOnce({
        transaction: { id: "tx-new-123" },
      });

      await executeUndo(mockClient as unknown as YNABClient, entry);

      expect(mockClient.createTransaction).toHaveBeenCalledWith("budget-123", {
        account_id: "account-789",
        date: "2025-01-01",
        amount: -75,
        payee_name: "Store",
        memo: "Groceries",
      });
    });
  });

  describe("create_scheduled_transaction", () => {
    it("deletes the created scheduled transaction", async () => {
      const entry: CreateScheduledTransactionEntry = {
        id: createHistoryEntryId(),
        timestamp: new Date().toISOString(),
        budgetId: "budget-123",
        status: "success",
        operation: "create_scheduled_transaction",
        createdId: "scheduled-456",
      };

      mockClient.deleteScheduledTransaction.mockResolvedValueOnce({
        scheduled_transaction: { id: "scheduled-456", deleted: true },
      });

      await executeUndo(mockClient as unknown as YNABClient, entry);

      expect(mockClient.deleteScheduledTransaction).toHaveBeenCalledWith(
        "budget-123",
        "scheduled-456"
      );
    });
  });

  describe("update_scheduled_transaction", () => {
    it("restores the scheduled transaction to its before state", async () => {
      const entry: UpdateScheduledTransactionEntry = {
        id: createHistoryEntryId(),
        timestamp: new Date().toISOString(),
        budgetId: "budget-123",
        status: "success",
        operation: "update_scheduled_transaction",
        scheduledTransactionId: "scheduled-456",
        beforeState: {
          id: "scheduled-456",
          account_id: "account-789",
          date: "2025-02-01",
          amount: -100,
          frequency: "monthly",
          payee_id: undefined,
          payee_name: undefined,
          category_id: undefined,
          memo: undefined,
          flag_color: undefined,
        },
      };

      mockClient.updateScheduledTransaction.mockResolvedValueOnce({
        scheduled_transaction: { id: "scheduled-456" },
      });

      await executeUndo(mockClient as unknown as YNABClient, entry);

      expect(mockClient.updateScheduledTransaction).toHaveBeenCalledWith(
        "budget-123",
        "scheduled-456",
        {
          account_id: "account-789",
          date: "2025-02-01",
          amount: -100,
          frequency: "monthly",
        }
      );
    });
  });

  describe("delete_scheduled_transaction", () => {
    it("recreates the deleted scheduled transaction", async () => {
      const entry: DeleteScheduledTransactionEntry = {
        id: createHistoryEntryId(),
        timestamp: new Date().toISOString(),
        budgetId: "budget-123",
        status: "success",
        operation: "delete_scheduled_transaction",
        scheduledTransactionId: "scheduled-456",
        beforeState: {
          id: "scheduled-456",
          account_id: "account-789",
          date: "2025-02-01",
          amount: -100,
          frequency: "weekly",
          memo: "Weekly payment",
          payee_id: undefined,
          payee_name: undefined,
          category_id: undefined,
          flag_color: undefined,
        },
      };

      mockClient.createScheduledTransaction.mockResolvedValueOnce({
        scheduled_transaction: { id: "scheduled-new-123" },
      });

      await executeUndo(mockClient as unknown as YNABClient, entry);

      expect(mockClient.createScheduledTransaction).toHaveBeenCalledWith("budget-123", {
        account_id: "account-789",
        date: "2025-02-01",
        amount: -100,
        frequency: "weekly",
        memo: "Weekly payment",
      });
    });
  });

  describe("update_category_budget", () => {
    it("restores the category budget to its before value", async () => {
      const entry: UpdateCategoryBudgetEntry = {
        id: createHistoryEntryId(),
        timestamp: new Date().toISOString(),
        budgetId: "budget-123",
        status: "success",
        operation: "update_category_budget",
        categoryId: "category-abc",
        month: "2025-01-01",
        beforeBudgeted: 500,
      };

      mockClient.updateCategoryBudget.mockResolvedValueOnce({
        category: { id: "category-abc", budgeted: 500 },
      });

      await executeUndo(mockClient as unknown as YNABClient, entry);

      expect(mockClient.updateCategoryBudget).toHaveBeenCalledWith(
        "budget-123",
        "2025-01-01",
        "category-abc",
        500
      );
    });
  });

  describe("update_payee", () => {
    it("restores the payee name to its before value", async () => {
      const entry: UpdatePayeeEntry = {
        id: createHistoryEntryId(),
        timestamp: new Date().toISOString(),
        budgetId: "budget-123",
        status: "success",
        operation: "update_payee",
        payeeId: "payee-def",
        beforeName: "Original Store Name",
      };

      mockClient.updatePayee.mockResolvedValueOnce({
        payee: { id: "payee-def", name: "Original Store Name" },
      });

      await executeUndo(mockClient as unknown as YNABClient, entry);

      expect(mockClient.updatePayee).toHaveBeenCalledWith(
        "budget-123",
        "payee-def",
        "Original Store Name"
      );
    });
  });

  describe("create_account", () => {
    it("throws UndoError for account creation", async () => {
      const entry: CreateAccountEntry = {
        id: createHistoryEntryId(),
        timestamp: new Date().toISOString(),
        budgetId: "budget-123",
        status: "success",
        operation: "create_account",
        createdId: "account-new",
        canUndo: false,
      };

      await expect(executeUndo(mockClient as unknown as YNABClient, entry)).rejects.toThrow(
        UndoError
      );
      await expect(executeUndo(mockClient as unknown as YNABClient, entry)).rejects.toThrow(
        "Cannot undo account creation"
      );
    });
  });

  describe("already undone entries", () => {
    it("throws UndoError when entry is already undone", async () => {
      const entry: CreateTransactionEntry = {
        id: createHistoryEntryId(),
        timestamp: new Date().toISOString(),
        budgetId: "budget-123",
        status: "undone",
        operation: "create_transaction",
        createdId: "tx-456",
      };

      await expect(executeUndo(mockClient as unknown as YNABClient, entry)).rejects.toThrow(
        UndoError
      );
      await expect(executeUndo(mockClient as unknown as YNABClient, entry)).rejects.toThrow(
        "Entry has already been undone"
      );
    });

    it("throws UndoError when undo previously failed", async () => {
      const entry: CreateTransactionEntry = {
        id: createHistoryEntryId(),
        timestamp: new Date().toISOString(),
        budgetId: "budget-123",
        status: "undo_failed",
        operation: "create_transaction",
        createdId: "tx-456",
      };

      await expect(executeUndo(mockClient as unknown as YNABClient, entry)).rejects.toThrow(
        UndoError
      );
      await expect(executeUndo(mockClient as unknown as YNABClient, entry)).rejects.toThrow(
        "Previous undo attempt failed"
      );
    });
  });

  describe("API errors", () => {
    it("propagates API errors", async () => {
      const entry: CreateTransactionEntry = {
        id: createHistoryEntryId(),
        timestamp: new Date().toISOString(),
        budgetId: "budget-123",
        status: "success",
        operation: "create_transaction",
        createdId: "tx-456",
      };

      mockClient.deleteTransaction.mockRejectedValueOnce(new Error("Transaction not found"));

      await expect(executeUndo(mockClient as unknown as YNABClient, entry)).rejects.toThrow(
        "Transaction not found"
      );
    });
  });
});

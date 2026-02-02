import { describe, it, expect, beforeEach, vi } from "vitest";
import { TrackedYNABClient } from "../../history/tracked-client.js";
import type { YNABClient } from "../../client.js";
import type { HistoryStore } from "../../history/history-store.js";
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

describe("TrackedYNABClient", () => {
  let mockClient: {
    createTransaction: ReturnType<typeof vi.fn>;
    updateTransaction: ReturnType<typeof vi.fn>;
    deleteTransaction: ReturnType<typeof vi.fn>;
    getTransaction: ReturnType<typeof vi.fn>;
    createScheduledTransaction: ReturnType<typeof vi.fn>;
    updateScheduledTransaction: ReturnType<typeof vi.fn>;
    deleteScheduledTransaction: ReturnType<typeof vi.fn>;
    getScheduledTransaction: ReturnType<typeof vi.fn>;
    createAccount: ReturnType<typeof vi.fn>;
    updateCategoryBudget: ReturnType<typeof vi.fn>;
    getCategory: ReturnType<typeof vi.fn>;
    updatePayee: ReturnType<typeof vi.fn>;
    listPayees: ReturnType<typeof vi.fn>;
  };

  let mockStore: {
    add: ReturnType<typeof vi.fn>;
  };

  let trackedClient: TrackedYNABClient;

  beforeEach(() => {
    mockClient = {
      createTransaction: vi.fn(),
      updateTransaction: vi.fn(),
      deleteTransaction: vi.fn(),
      getTransaction: vi.fn(),
      createScheduledTransaction: vi.fn(),
      updateScheduledTransaction: vi.fn(),
      deleteScheduledTransaction: vi.fn(),
      getScheduledTransaction: vi.fn(),
      createAccount: vi.fn(),
      updateCategoryBudget: vi.fn(),
      getCategory: vi.fn(),
      updatePayee: vi.fn(),
      listPayees: vi.fn(),
    };

    mockStore = {
      add: vi.fn(),
    };

    trackedClient = new TrackedYNABClient(
      mockClient as unknown as YNABClient,
      mockStore as unknown as HistoryStore
    );
  });

  describe("createTransaction", () => {
    it("creates transaction and records to history", async () => {
      const createdTransaction = {
        id: "tx-123",
        account_id: "account-456",
        date: "2025-01-15",
        amount: -50.25,
        memo: "Test",
        subtransactions: [],
      };

      mockClient.createTransaction.mockResolvedValueOnce({
        transaction: createdTransaction,
      });

      const result = await trackedClient.createTransaction("budget-123", {
        account_id: "account-456",
        date: "2025-01-15",
        amount: -50.25,
        memo: "Test",
      });

      expect(result.transaction.id).toBe("tx-123");
      expect(mockStore.add).toHaveBeenCalledTimes(1);

      const addedEntry = mockStore.add.mock.calls[0]![0] as CreateTransactionEntry;
      expect(addedEntry.operation).toBe("create_transaction");
      expect(addedEntry.budgetId).toBe("budget-123");
      expect(addedEntry.createdId).toBe("tx-123");
      expect(addedEntry.status).toBe("success");
    });
  });

  describe("updateTransaction", () => {
    it("fetches before state, updates, and records to history", async () => {
      const beforeTransaction = {
        id: "tx-123",
        account_id: "account-456",
        date: "2025-01-01",
        amount: -25,
        memo: "Original",
        category_id: "cat-abc",
        subtransactions: [],
      };

      const updatedTransaction = {
        ...beforeTransaction,
        amount: -50,
        memo: "Updated",
      };

      mockClient.getTransaction.mockResolvedValueOnce({
        transaction: beforeTransaction,
      });
      mockClient.updateTransaction.mockResolvedValueOnce({
        transaction: updatedTransaction,
      });

      const result = await trackedClient.updateTransaction("budget-123", "tx-123", {
        amount: -50,
        memo: "Updated",
      });

      expect(mockClient.getTransaction).toHaveBeenCalledWith("budget-123", "tx-123");
      expect(result.transaction.amount).toBe(-50);

      const addedEntry = mockStore.add.mock.calls[0]![0] as UpdateTransactionEntry;
      expect(addedEntry.operation).toBe("update_transaction");
      expect(addedEntry.transactionId).toBe("tx-123");
      expect(addedEntry.beforeState.amount).toBe(-25);
      expect(addedEntry.beforeState.memo).toBe("Original");
    });
  });

  describe("deleteTransaction", () => {
    it("fetches before state, deletes, and records to history", async () => {
      const beforeTransaction = {
        id: "tx-123",
        account_id: "account-456",
        date: "2025-01-01",
        amount: -75,
        memo: "To be deleted",
        subtransactions: [],
      };

      mockClient.getTransaction.mockResolvedValueOnce({
        transaction: beforeTransaction,
      });
      mockClient.deleteTransaction.mockResolvedValueOnce({
        transaction: { ...beforeTransaction, deleted: true },
      });

      await trackedClient.deleteTransaction("budget-123", "tx-123");

      expect(mockClient.getTransaction).toHaveBeenCalledWith("budget-123", "tx-123");

      const addedEntry = mockStore.add.mock.calls[0]![0] as DeleteTransactionEntry;
      expect(addedEntry.operation).toBe("delete_transaction");
      expect(addedEntry.transactionId).toBe("tx-123");
      expect(addedEntry.beforeState.amount).toBe(-75);
    });
  });

  describe("createScheduledTransaction", () => {
    it("creates scheduled transaction and records to history", async () => {
      const createdScheduledTransaction = {
        id: "scheduled-123",
        account_id: "account-456",
        date_first: "2025-02-01",
        date_next: "2025-02-01",
        amount: -100,
        frequency: "monthly",
        subtransactions: [],
      };

      mockClient.createScheduledTransaction.mockResolvedValueOnce({
        scheduled_transaction: createdScheduledTransaction,
      });

      const result = await trackedClient.createScheduledTransaction("budget-123", {
        account_id: "account-456",
        date: "2025-02-01",
        amount: -100,
        frequency: "monthly",
      });

      expect(result.scheduled_transaction.id).toBe("scheduled-123");

      const addedEntry = mockStore.add.mock.calls[0]![0] as CreateScheduledTransactionEntry;
      expect(addedEntry.operation).toBe("create_scheduled_transaction");
      expect(addedEntry.createdId).toBe("scheduled-123");
    });
  });

  describe("updateScheduledTransaction", () => {
    it("fetches before state, updates, and records to history", async () => {
      const beforeScheduledTransaction = {
        id: "scheduled-123",
        account_id: "account-456",
        date_first: "2025-02-01",
        date_next: "2025-02-01",
        amount: -100,
        frequency: "monthly",
        subtransactions: [],
      };

      mockClient.getScheduledTransaction.mockResolvedValueOnce({
        scheduled_transaction: beforeScheduledTransaction,
      });
      mockClient.updateScheduledTransaction.mockResolvedValueOnce({
        scheduled_transaction: { ...beforeScheduledTransaction, amount: -150 },
      });

      await trackedClient.updateScheduledTransaction("budget-123", "scheduled-123", {
        amount: -150,
      });

      expect(mockClient.getScheduledTransaction).toHaveBeenCalledWith(
        "budget-123",
        "scheduled-123"
      );

      const addedEntry = mockStore.add.mock.calls[0]![0] as UpdateScheduledTransactionEntry;
      expect(addedEntry.operation).toBe("update_scheduled_transaction");
      expect(addedEntry.beforeState.amount).toBe(-100);
    });
  });

  describe("deleteScheduledTransaction", () => {
    it("fetches before state, deletes, and records to history", async () => {
      const beforeScheduledTransaction = {
        id: "scheduled-123",
        account_id: "account-456",
        date_first: "2025-02-01",
        date_next: "2025-02-01",
        amount: -100,
        frequency: "weekly",
        subtransactions: [],
      };

      mockClient.getScheduledTransaction.mockResolvedValueOnce({
        scheduled_transaction: beforeScheduledTransaction,
      });
      mockClient.deleteScheduledTransaction.mockResolvedValueOnce({
        scheduled_transaction: { ...beforeScheduledTransaction, deleted: true },
      });

      await trackedClient.deleteScheduledTransaction("budget-123", "scheduled-123");

      const addedEntry = mockStore.add.mock.calls[0]![0] as DeleteScheduledTransactionEntry;
      expect(addedEntry.operation).toBe("delete_scheduled_transaction");
      expect(addedEntry.beforeState.frequency).toBe("weekly");
    });
  });

  describe("createAccount", () => {
    it("creates account and records to history with canUndo: false", async () => {
      const createdAccount = {
        id: "account-new-123",
        name: "New Checking",
        type: "checking",
        balance: 1000,
        cleared_balance: 1000,
        uncleared_balance: 0,
      };

      mockClient.createAccount.mockResolvedValueOnce({
        account: createdAccount,
      });

      const result = await trackedClient.createAccount("budget-123", {
        name: "New Checking",
        type: "checking",
        balance: 1000,
      });

      expect(result.account.id).toBe("account-new-123");

      const addedEntry = mockStore.add.mock.calls[0]![0] as CreateAccountEntry;
      expect(addedEntry.operation).toBe("create_account");
      expect(addedEntry.createdId).toBe("account-new-123");
      expect(addedEntry.canUndo).toBe(false);
    });
  });

  describe("updateCategoryBudget", () => {
    it("fetches before state, updates, and records to history", async () => {
      const beforeCategory = {
        id: "category-abc",
        budgeted: 300,
        activity: -100,
        balance: 200,
      };

      mockClient.getCategory.mockResolvedValueOnce({
        category: beforeCategory,
      });
      mockClient.updateCategoryBudget.mockResolvedValueOnce({
        category: { ...beforeCategory, budgeted: 500 },
      });

      await trackedClient.updateCategoryBudget("budget-123", "2025-01-01", "category-abc", 500);

      expect(mockClient.getCategory).toHaveBeenCalledWith("budget-123", "category-abc");

      const addedEntry = mockStore.add.mock.calls[0]![0] as UpdateCategoryBudgetEntry;
      expect(addedEntry.operation).toBe("update_category_budget");
      expect(addedEntry.beforeBudgeted).toBe(300);
      expect(addedEntry.month).toBe("2025-01-01");
    });
  });

  describe("updatePayee", () => {
    it("fetches before state, updates, and records to history", async () => {
      mockClient.listPayees.mockResolvedValueOnce({
        payees: [
          { id: "payee-def", name: "Original Store", deleted: false },
          { id: "payee-other", name: "Other Payee", deleted: false },
        ],
      });
      mockClient.updatePayee.mockResolvedValueOnce({
        payee: { id: "payee-def", name: "New Store Name", deleted: false },
      });

      await trackedClient.updatePayee("budget-123", "payee-def", "New Store Name");

      expect(mockClient.listPayees).toHaveBeenCalledWith("budget-123");

      const addedEntry = mockStore.add.mock.calls[0]![0] as UpdatePayeeEntry;
      expect(addedEntry.operation).toBe("update_payee");
      expect(addedEntry.beforeName).toBe("Original Store");
    });

    it("throws error when payee not found", async () => {
      mockClient.listPayees.mockResolvedValueOnce({
        payees: [{ id: "payee-other", name: "Other Payee", deleted: false }],
      });

      await expect(
        trackedClient.updatePayee("budget-123", "payee-nonexistent", "New Name")
      ).rejects.toThrow("Payee not found");
    });
  });

  describe("does not record on API failure", () => {
    it("does not record history when create fails", async () => {
      mockClient.createTransaction.mockRejectedValueOnce(new Error("API Error"));

      await expect(
        trackedClient.createTransaction("budget-123", {
          account_id: "account-456",
          date: "2025-01-15",
          amount: -50,
        })
      ).rejects.toThrow("API Error");

      expect(mockStore.add).not.toHaveBeenCalled();
    });

    it("does not record history when update fails", async () => {
      mockClient.getTransaction.mockResolvedValueOnce({
        transaction: { id: "tx-123", account_id: "acc-1", date: "2025-01-01", amount: -25 },
      });
      mockClient.updateTransaction.mockRejectedValueOnce(new Error("API Error"));

      await expect(
        trackedClient.updateTransaction("budget-123", "tx-123", { amount: -50 })
      ).rejects.toThrow("API Error");

      expect(mockStore.add).not.toHaveBeenCalled();
    });
  });
});

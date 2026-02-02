import { describe, it, expect, beforeEach, vi } from "vitest";
import { YNABClient } from "../client.js";
import { mockBudget, mockTransaction, mockScheduledTransaction, mockPayee } from "./fixtures.js";

// Create mock functions that we can control
const mockGetBudgets = vi.fn();
const mockGetTransactions = vi.fn();
const mockCreateTransaction = vi.fn();
const mockUpdateTransaction = vi.fn();
const mockDeleteTransaction = vi.fn();
const mockUpdateMonthCategory = vi.fn();
const mockCreateAccount = vi.fn();
const mockGetScheduledTransactionById = vi.fn();
const mockCreateScheduledTransaction = vi.fn();
const mockUpdateScheduledTransaction = vi.fn();
const mockDeleteScheduledTransaction = vi.fn();
const mockUpdatePayee = vi.fn();

// Mock the ynab module
vi.mock("ynab", () => {
  return {
    API: class MockAPI {
      budgets = { getBudgets: mockGetBudgets };
      transactions = {
        getTransactions: mockGetTransactions,
        createTransaction: mockCreateTransaction,
        updateTransaction: mockUpdateTransaction,
        deleteTransaction: mockDeleteTransaction,
      };
      categories = { updateMonthCategory: mockUpdateMonthCategory };
      accounts = { createAccount: mockCreateAccount };
      scheduledTransactions = {
        getScheduledTransactionById: mockGetScheduledTransactionById,
        createScheduledTransaction: mockCreateScheduledTransaction,
        updateScheduledTransaction: mockUpdateScheduledTransaction,
        deleteScheduledTransaction: mockDeleteScheduledTransaction,
      };
      payees = { updatePayee: mockUpdatePayee };
    },
    utils: { convertMilliUnitsToCurrencyAmount: (m: number) => m / 1000 },
  };
});

describe("YNABClient", () => {
  let client: YNABClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new YNABClient("test-token");
  });

  describe("listBudgets", () => {
    it("returns budgets on success", async () => {
      mockGetBudgets.mockResolvedValueOnce({
        data: { budgets: [mockBudget] },
      });

      const result = await client.listBudgets();

      expect(result.budgets).toHaveLength(1);
      expect(result.budgets[0]?.id).toBe("budget-123");
    });

    it("throws on API error", async () => {
      mockGetBudgets.mockRejectedValueOnce(new Error("Unauthorized"));

      await expect(client.listBudgets()).rejects.toThrow("Unauthorized");
    });
  });

  describe("listTransactions", () => {
    it("filters by category_id client-side", async () => {
      const tx1 = { ...mockTransaction, category_id: "cat-1" };
      const tx2 = { ...mockTransaction, id: "tx-2", category_id: "cat-2" };

      mockGetTransactions.mockResolvedValueOnce({
        data: { transactions: [tx1, tx2] },
      });

      const result = await client.listTransactions("budget-123", { categoryId: "cat-1" });

      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0]?.category_id).toBe("cat-1");
    });
  });

  describe("createTransaction", () => {
    it("creates transaction with amount converted to milliunits", async () => {
      const createdTransaction = {
        ...mockTransaction,
        id: "new-tx-123",
        amount: -50250,
      };

      mockCreateTransaction.mockResolvedValueOnce({
        data: { transaction: createdTransaction },
      });

      const result = await client.createTransaction("budget-123", {
        account_id: "account-456",
        date: "2025-01-15",
        amount: -50.25,
        memo: "Test transaction",
      });

      expect(mockCreateTransaction).toHaveBeenCalledWith("budget-123", {
        transaction: {
          account_id: "account-456",
          date: "2025-01-15",
          amount: -50250,
          memo: "Test transaction",
        },
      });
      expect(result.transaction.id).toBe("new-tx-123");
      expect(result.transaction.amount).toBe(-50.25);
    });

    it("passes through optional fields", async () => {
      const createdTransaction = { ...mockTransaction, amount: -25000 };

      mockCreateTransaction.mockResolvedValueOnce({
        data: { transaction: createdTransaction },
      });

      await client.createTransaction("budget-123", {
        account_id: "account-456",
        date: "2025-01-15",
        amount: -25,
        payee_id: "payee-789",
        category_id: "category-abc",
        cleared: "cleared",
        approved: true,
        flag_color: "green",
      });

      expect(mockCreateTransaction).toHaveBeenCalledWith("budget-123", {
        transaction: {
          account_id: "account-456",
          date: "2025-01-15",
          amount: -25000,
          payee_id: "payee-789",
          category_id: "category-abc",
          cleared: "cleared",
          approved: true,
          flag_color: "green",
        },
      });
    });

    it("throws error when API returns null transaction", async () => {
      mockCreateTransaction.mockResolvedValueOnce({
        data: { transaction: null },
      });

      await expect(
        client.createTransaction("budget-123", {
          account_id: "account-456",
          date: "2025-01-15",
          amount: -50.25,
        })
      ).rejects.toThrow("Transaction creation failed: no transaction returned");
    });
  });

  describe("updateTransaction", () => {
    it("updates transaction with converted amount", async () => {
      const updatedTransaction = { ...mockTransaction, amount: -75000, memo: "Updated" };

      mockUpdateTransaction.mockResolvedValueOnce({
        data: { transaction: updatedTransaction },
      });

      const result = await client.updateTransaction("budget-123", "tx-789", {
        amount: -75,
        memo: "Updated",
      });

      expect(mockUpdateTransaction).toHaveBeenCalledWith("budget-123", "tx-789", {
        transaction: {
          amount: -75000,
          memo: "Updated",
        },
      });
      expect(result.transaction.amount).toBe(-75);
    });

    it("updates without amount conversion when amount not provided", async () => {
      const updatedTransaction = { ...mockTransaction, memo: "New memo" };

      mockUpdateTransaction.mockResolvedValueOnce({
        data: { transaction: updatedTransaction },
      });

      await client.updateTransaction("budget-123", "tx-789", {
        memo: "New memo",
        cleared: "reconciled",
      });

      expect(mockUpdateTransaction).toHaveBeenCalledWith("budget-123", "tx-789", {
        transaction: {
          memo: "New memo",
          cleared: "reconciled",
        },
      });
    });
  });

  describe("deleteTransaction", () => {
    it("deletes transaction and returns result", async () => {
      const deletedTransaction = { ...mockTransaction, deleted: true };

      mockDeleteTransaction.mockResolvedValueOnce({
        data: { transaction: deletedTransaction },
      });

      const result = await client.deleteTransaction("budget-123", "tx-789");

      expect(mockDeleteTransaction).toHaveBeenCalledWith("budget-123", "tx-789");
      expect(result.transaction.deleted).toBe(true);
      expect(result.transaction.amount).toBe(-5);
    });
  });

  describe("updateCategoryBudget", () => {
    it("updates category budget with amount converted to milliunits", async () => {
      const updatedCategory = {
        id: "category-abc",
        budgeted: 500000,
        activity: -100000,
        balance: 400000,
      };

      mockUpdateMonthCategory.mockResolvedValueOnce({
        data: { category: updatedCategory },
      });

      const result = await client.updateCategoryBudget(
        "budget-123",
        "2025-01-01",
        "category-abc",
        500
      );

      expect(mockUpdateMonthCategory).toHaveBeenCalledWith(
        "budget-123",
        "2025-01-01",
        "category-abc",
        {
          category: { budgeted: 500000 },
        }
      );
      expect(result.category.budgeted).toBe(500);
    });
  });

  describe("createAccount", () => {
    it("creates account with balance converted to milliunits", async () => {
      const createdAccount = {
        id: "new-account-123",
        name: "New Checking",
        type: "checking",
        balance: 1000000,
        cleared_balance: 1000000,
        uncleared_balance: 0,
      };

      mockCreateAccount.mockResolvedValueOnce({
        data: { account: createdAccount },
      });

      const result = await client.createAccount("budget-123", {
        name: "New Checking",
        type: "checking",
        balance: 1000,
      });

      expect(mockCreateAccount).toHaveBeenCalledWith("budget-123", {
        account: {
          name: "New Checking",
          type: "checking",
          balance: 1000000,
        },
      });
      expect(result.account.id).toBe("new-account-123");
      expect(result.account.balance).toBe(1000);
    });
  });

  describe("getScheduledTransaction", () => {
    it("returns scheduled transaction with amount converted to units", async () => {
      mockGetScheduledTransactionById.mockResolvedValueOnce({
        data: { scheduled_transaction: mockScheduledTransaction },
      });

      const result = await client.getScheduledTransaction("budget-123", "scheduled-123");

      expect(mockGetScheduledTransactionById).toHaveBeenCalledWith("budget-123", "scheduled-123");
      expect(result.scheduled_transaction.id).toBe("scheduled-123");
      expect(result.scheduled_transaction.amount).toBe(-10);
    });
  });

  describe("createScheduledTransaction", () => {
    it("creates scheduled transaction with amount converted to milliunits", async () => {
      const createdScheduledTransaction = {
        ...mockScheduledTransaction,
        id: "new-scheduled-123",
        amount: -50250,
      };

      mockCreateScheduledTransaction.mockResolvedValueOnce({
        data: { scheduled_transaction: createdScheduledTransaction },
      });

      const result = await client.createScheduledTransaction("budget-123", {
        account_id: "account-456",
        date: "2025-02-01",
        amount: -50.25,
        frequency: "monthly",
        memo: "Test scheduled transaction",
      });

      expect(mockCreateScheduledTransaction).toHaveBeenCalledWith("budget-123", {
        scheduled_transaction: {
          account_id: "account-456",
          date: "2025-02-01",
          amount: -50250,
          frequency: "monthly",
          memo: "Test scheduled transaction",
        },
      });
      expect(result.scheduled_transaction.id).toBe("new-scheduled-123");
      expect(result.scheduled_transaction.amount).toBe(-50.25);
    });

    it("passes through optional fields", async () => {
      const createdScheduledTransaction = { ...mockScheduledTransaction, amount: -25000 };

      mockCreateScheduledTransaction.mockResolvedValueOnce({
        data: { scheduled_transaction: createdScheduledTransaction },
      });

      await client.createScheduledTransaction("budget-123", {
        account_id: "account-456",
        date: "2025-02-15",
        amount: -25,
        payee_id: "payee-789",
        category_id: "category-abc",
        frequency: "weekly",
        flag_color: "green",
      });

      expect(mockCreateScheduledTransaction).toHaveBeenCalledWith("budget-123", {
        scheduled_transaction: {
          account_id: "account-456",
          date: "2025-02-15",
          amount: -25000,
          payee_id: "payee-789",
          category_id: "category-abc",
          frequency: "weekly",
          flag_color: "green",
        },
      });
    });
  });

  describe("updateScheduledTransaction", () => {
    it("updates scheduled transaction with converted amount", async () => {
      const updatedScheduledTransaction = {
        ...mockScheduledTransaction,
        amount: -75000,
        memo: "Updated",
      };

      mockUpdateScheduledTransaction.mockResolvedValueOnce({
        data: { scheduled_transaction: updatedScheduledTransaction },
      });

      const result = await client.updateScheduledTransaction("budget-123", "scheduled-123", {
        amount: -75,
        memo: "Updated",
      });

      expect(mockUpdateScheduledTransaction).toHaveBeenCalledWith("budget-123", "scheduled-123", {
        scheduled_transaction: {
          amount: -75000,
          memo: "Updated",
        },
      });
      expect(result.scheduled_transaction.amount).toBe(-75);
    });

    it("updates without amount conversion when amount not provided", async () => {
      const updatedScheduledTransaction = { ...mockScheduledTransaction, memo: "New memo" };

      mockUpdateScheduledTransaction.mockResolvedValueOnce({
        data: { scheduled_transaction: updatedScheduledTransaction },
      });

      await client.updateScheduledTransaction("budget-123", "scheduled-123", {
        memo: "New memo",
        frequency: "weekly",
      });

      expect(mockUpdateScheduledTransaction).toHaveBeenCalledWith("budget-123", "scheduled-123", {
        scheduled_transaction: {
          memo: "New memo",
          frequency: "weekly",
        },
      });
    });
  });

  describe("deleteScheduledTransaction", () => {
    it("deletes scheduled transaction and returns result", async () => {
      const deletedScheduledTransaction = { ...mockScheduledTransaction, deleted: true };

      mockDeleteScheduledTransaction.mockResolvedValueOnce({
        data: { scheduled_transaction: deletedScheduledTransaction },
      });

      const result = await client.deleteScheduledTransaction("budget-123", "scheduled-123");

      expect(mockDeleteScheduledTransaction).toHaveBeenCalledWith("budget-123", "scheduled-123");
      expect(result.scheduled_transaction.deleted).toBe(true);
      expect(result.scheduled_transaction.amount).toBe(-10);
    });
  });

  describe("updatePayee", () => {
    it("updates payee name", async () => {
      const updatedPayee = { ...mockPayee, name: "New Payee Name" };

      mockUpdatePayee.mockResolvedValueOnce({
        data: { payee: updatedPayee },
      });

      const result = await client.updatePayee("budget-123", "payee-def", "New Payee Name");

      expect(mockUpdatePayee).toHaveBeenCalledWith("budget-123", "payee-def", {
        payee: { name: "New Payee Name" },
      });
      expect(result.payee.name).toBe("New Payee Name");
    });
  });
});

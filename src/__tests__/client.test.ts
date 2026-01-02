import { describe, it, expect, beforeEach, vi } from "vitest";
import { YNABClient } from "../client.js";
import { mockBudget, mockTransaction } from "./fixtures.js";

// Create mock functions that we can control
const mockGetBudgets = vi.fn();
const mockGetTransactions = vi.fn();

// Mock the ynab module
vi.mock("ynab", () => {
  return {
    API: class MockAPI {
      budgets = { getBudgets: mockGetBudgets };
      transactions = { getTransactions: mockGetTransactions };
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
      expect(result.budgets[0].id).toBe("budget-123");
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
      expect(result.transactions[0].category_id).toBe("cat-1");
    });
  });
});

import { describe, it, expect, beforeEach, vi } from "vitest";
import { YNABClient } from "../client.js";
import { mockBudget, mockTransaction, createApiResponse } from "./fixtures.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("YNABClient", () => {
  let client: YNABClient;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new YNABClient("test-token");
  });

  describe("listBudgets", () => {
    it("returns budgets on success", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createApiResponse({ budgets: [mockBudget] })),
      });

      const result = await client.listBudgets();

      expect(result.budgets).toHaveLength(1);
      expect(result.budgets[0].id).toBe("budget-123");
    });

    it("throws on API error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Unauthorized"),
      });

      await expect(client.listBudgets()).rejects.toThrow("YNAB API error (401)");
    });
  });

  describe("listTransactions", () => {
    it("filters by category_id client-side", async () => {
      const tx1 = { ...mockTransaction, category_id: "cat-1" };
      const tx2 = { ...mockTransaction, id: "tx-2", category_id: "cat-2" };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createApiResponse({ transactions: [tx1, tx2] })),
      });

      const result = await client.listTransactions("budget-123", { categoryId: "cat-1" });

      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].category_id).toBe("cat-1");
    });
  });
});

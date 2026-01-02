import { describe, it, expect } from "vitest";
import { BudgetIdSchema, TransactionsSchema, MonthSchema } from "../schemas.js";

describe("Input Schemas", () => {
  describe("BudgetIdSchema", () => {
    it("accepts valid budget_id", () => {
      const result = BudgetIdSchema.safeParse({ budget_id: "last-used" });
      expect(result.success).toBe(true);
    });

    it("rejects missing budget_id", () => {
      const result = BudgetIdSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("TransactionsSchema", () => {
    it("accepts all optional filters", () => {
      const result = TransactionsSchema.safeParse({
        budget_id: "budget-123",
        since_date: "2025-01-01",
        type: "uncategorized",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid type", () => {
      const result = TransactionsSchema.safeParse({
        budget_id: "budget-123",
        type: "invalid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("MonthSchema", () => {
    it("accepts valid month", () => {
      const result = MonthSchema.safeParse({ budget_id: "budget-123", month: "2025-01-01" });
      expect(result.success).toBe(true);
    });
  });
});

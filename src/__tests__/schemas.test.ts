import { describe, it, expect } from "vitest";
import {
  BudgetIdSchema,
  TransactionsSchema,
  MonthSchema,
  TransactionClearedStatusSchema,
  TransactionFlagColorSchema,
  AccountTypeSchema,
  CreateTransactionSchema,
  UpdateTransactionSchema,
  DeleteTransactionSchema,
  UpdateCategoryBudgetSchema,
  CreateAccountSchema,
} from "../schemas.js";

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

  describe("TransactionClearedStatusSchema", () => {
    it("accepts valid cleared statuses", () => {
      expect(TransactionClearedStatusSchema.safeParse("cleared").success).toBe(true);
      expect(TransactionClearedStatusSchema.safeParse("uncleared").success).toBe(true);
      expect(TransactionClearedStatusSchema.safeParse("reconciled").success).toBe(true);
    });

    it("rejects invalid status", () => {
      expect(TransactionClearedStatusSchema.safeParse("invalid").success).toBe(false);
    });
  });

  describe("TransactionFlagColorSchema", () => {
    it("accepts valid flag colors", () => {
      expect(TransactionFlagColorSchema.safeParse("red").success).toBe(true);
      expect(TransactionFlagColorSchema.safeParse("orange").success).toBe(true);
      expect(TransactionFlagColorSchema.safeParse("yellow").success).toBe(true);
      expect(TransactionFlagColorSchema.safeParse("green").success).toBe(true);
      expect(TransactionFlagColorSchema.safeParse("blue").success).toBe(true);
      expect(TransactionFlagColorSchema.safeParse("purple").success).toBe(true);
    });

    it("rejects invalid color", () => {
      expect(TransactionFlagColorSchema.safeParse("pink").success).toBe(false);
    });
  });

  describe("AccountTypeSchema", () => {
    it("accepts valid account types", () => {
      expect(AccountTypeSchema.safeParse("checking").success).toBe(true);
      expect(AccountTypeSchema.safeParse("savings").success).toBe(true);
      expect(AccountTypeSchema.safeParse("cash").success).toBe(true);
      expect(AccountTypeSchema.safeParse("creditCard").success).toBe(true);
      expect(AccountTypeSchema.safeParse("lineOfCredit").success).toBe(true);
      expect(AccountTypeSchema.safeParse("otherAsset").success).toBe(true);
      expect(AccountTypeSchema.safeParse("otherLiability").success).toBe(true);
      expect(AccountTypeSchema.safeParse("mortgage").success).toBe(true);
      expect(AccountTypeSchema.safeParse("autoLoan").success).toBe(true);
      expect(AccountTypeSchema.safeParse("studentLoan").success).toBe(true);
      expect(AccountTypeSchema.safeParse("personalLoan").success).toBe(true);
      expect(AccountTypeSchema.safeParse("medicalDebt").success).toBe(true);
      expect(AccountTypeSchema.safeParse("otherDebt").success).toBe(true);
    });

    it("rejects invalid type", () => {
      expect(AccountTypeSchema.safeParse("invalid").success).toBe(false);
    });
  });

  describe("CreateTransactionSchema", () => {
    it("accepts valid transaction with required fields", () => {
      const result = CreateTransactionSchema.safeParse({
        budget_id: "budget-123",
        account_id: "account-456",
        date: "2025-01-15",
        amount: -50.25,
      });
      expect(result.success).toBe(true);
    });

    it("accepts transaction with all optional fields", () => {
      const result = CreateTransactionSchema.safeParse({
        budget_id: "budget-123",
        account_id: "account-456",
        date: "2025-01-15",
        amount: -50.25,
        payee_id: "payee-789",
        payee_name: "Grocery Store",
        category_id: "category-abc",
        memo: "Weekly groceries",
        cleared: "cleared",
        approved: true,
        flag_color: "green",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing required fields", () => {
      const result = CreateTransactionSchema.safeParse({
        budget_id: "budget-123",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid cleared status", () => {
      const result = CreateTransactionSchema.safeParse({
        budget_id: "budget-123",
        account_id: "account-456",
        date: "2025-01-15",
        amount: -50.25,
        cleared: "invalid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("UpdateTransactionSchema", () => {
    it("accepts valid update with required fields only", () => {
      const result = UpdateTransactionSchema.safeParse({
        budget_id: "budget-123",
        transaction_id: "transaction-789",
      });
      expect(result.success).toBe(true);
    });

    it("accepts update with optional fields", () => {
      const result = UpdateTransactionSchema.safeParse({
        budget_id: "budget-123",
        transaction_id: "transaction-789",
        amount: -75.0,
        memo: "Updated memo",
        category_id: "category-new",
        cleared: "reconciled",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing transaction_id", () => {
      const result = UpdateTransactionSchema.safeParse({
        budget_id: "budget-123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("DeleteTransactionSchema", () => {
    it("accepts valid delete request", () => {
      const result = DeleteTransactionSchema.safeParse({
        budget_id: "budget-123",
        transaction_id: "transaction-789",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing transaction_id", () => {
      const result = DeleteTransactionSchema.safeParse({
        budget_id: "budget-123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("UpdateCategoryBudgetSchema", () => {
    it("accepts valid category budget update", () => {
      const result = UpdateCategoryBudgetSchema.safeParse({
        budget_id: "budget-123",
        month: "2025-01-01",
        category_id: "category-abc",
        budgeted: 500.0,
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing budgeted amount", () => {
      const result = UpdateCategoryBudgetSchema.safeParse({
        budget_id: "budget-123",
        month: "2025-01-01",
        category_id: "category-abc",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("CreateAccountSchema", () => {
    it("accepts valid account with required fields", () => {
      const result = CreateAccountSchema.safeParse({
        budget_id: "budget-123",
        name: "My Checking",
        type: "checking",
        balance: 1000.0,
      });
      expect(result.success).toBe(true);
    });

    it("accepts account with zero balance", () => {
      const result = CreateAccountSchema.safeParse({
        budget_id: "budget-123",
        name: "New Savings",
        type: "savings",
        balance: 0,
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing name", () => {
      const result = CreateAccountSchema.safeParse({
        budget_id: "budget-123",
        type: "checking",
        balance: 1000.0,
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid account type", () => {
      const result = CreateAccountSchema.safeParse({
        budget_id: "budget-123",
        name: "My Account",
        type: "invalid",
        balance: 1000.0,
      });
      expect(result.success).toBe(false);
    });
  });
});

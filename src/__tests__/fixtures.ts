import type {
  BudgetSummary,
  Account,
  TransactionDetail,
  Category,
  CategoryGroupWithCategories,
  Payee,
  MonthSummary,
  ScheduledTransactionDetail,
} from "../types.js";

export const mockBudget: BudgetSummary = {
  id: "budget-123",
  name: "My Budget",
  last_modified_on: "2025-01-01T00:00:00Z",
};

export const mockAccount: Account = {
  id: "account-456",
  name: "Checking",
  type: "checking",
  on_budget: true,
  closed: false,
  note: null,
  balance: 100000,
  cleared_balance: 100000,
  uncleared_balance: 0,
  transfer_payee_id: null,
  deleted: false,
};

export const mockTransaction: TransactionDetail = {
  id: "transaction-789",
  date: "2025-01-01",
  amount: -5000,
  cleared: "cleared",
  approved: true,
  account_id: "account-456",
  account_name: "Checking",
  category_id: "category-abc",
  payee_id: "payee-def",
  deleted: false,
  subtransactions: [],
};

export const mockCategory: Category = {
  id: "category-abc",
  category_group_id: "group-xyz",
  name: "Groceries",
  hidden: false,
  budgeted: 50000,
  activity: -25000,
  balance: 25000,
  deleted: false,
};

export const mockCategoryGroup: CategoryGroupWithCategories = {
  id: "group-xyz",
  name: "Everyday Expenses",
  hidden: false,
  deleted: false,
  categories: [mockCategory],
};

export const mockPayee: Payee = {
  id: "payee-def",
  name: "Grocery Store",
  deleted: false,
};

export const mockMonth: MonthSummary = {
  month: "2025-01-01",
  income: 500000,
  budgeted: 400000,
  activity: -250000,
  to_be_budgeted: 100000,
  deleted: false,
};

export const mockScheduledTransaction: ScheduledTransactionDetail = {
  id: "scheduled-123",
  date_first: "2025-01-01",
  date_next: "2025-02-01",
  frequency: "monthly",
  amount: -10000,
  account_id: "account-456",
  account_name: "Checking",
  deleted: false,
  subtransactions: [],
};

export function createApiResponse<T>(data: T): { data: T } {
  return { data };
}

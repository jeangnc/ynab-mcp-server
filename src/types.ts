// YNAB API Types
// Based on https://api.ynab.com/

export type Milliunits = number;

export type AccountType =
  | "checking"
  | "savings"
  | "cash"
  | "creditCard"
  | "lineOfCredit"
  | "otherAsset"
  | "otherLiability"
  | "mortgage"
  | "autoLoan"
  | "studentLoan"
  | "personalLoan"
  | "medicalDebt"
  | "otherDebt";

export type TransactionClearedStatus = "cleared" | "uncleared" | "reconciled";
export type TransactionFlagColor = "red" | "orange" | "yellow" | "green" | "blue" | "purple" | null;
export type CategoryGoalType = "TB" | "TBD" | "MF" | "NEED" | "DEBT" | null;

export type ScheduledFrequency =
  | "never"
  | "daily"
  | "weekly"
  | "everyOtherWeek"
  | "twiceAMonth"
  | "every4Weeks"
  | "monthly"
  | "everyOtherMonth"
  | "every3Months"
  | "every4Months"
  | "twiceAYear"
  | "yearly"
  | "everyOtherYear";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  on_budget: boolean;
  closed: boolean;
  note: string | null;
  balance: Milliunits;
  cleared_balance: Milliunits;
  uncleared_balance: Milliunits;
  transfer_payee_id: string | null;
  deleted: boolean;
}

export interface BudgetSummary {
  id: string;
  name: string;
  last_modified_on?: string;
  first_month?: string;
  last_month?: string;
}

export interface Category {
  id: string;
  category_group_id: string;
  category_group_name?: string;
  name: string;
  hidden: boolean;
  budgeted: Milliunits;
  activity: Milliunits;
  balance: Milliunits;
  goal_type?: CategoryGoalType;
  deleted: boolean;
}

export interface CategoryGroup {
  id: string;
  name: string;
  hidden: boolean;
  deleted: boolean;
}

export interface CategoryGroupWithCategories extends CategoryGroup {
  categories: Category[];
}

export interface Payee {
  id: string;
  name: string;
  transfer_account_id?: string | null;
  deleted: boolean;
}

export interface SubTransaction {
  id: string;
  transaction_id: string;
  amount: Milliunits;
  memo?: string | null;
  payee_id?: string | null;
  category_id?: string | null;
  deleted: boolean;
}

export interface TransactionDetail {
  id: string;
  date: string;
  amount: Milliunits;
  memo?: string | null;
  cleared: TransactionClearedStatus;
  approved: boolean;
  flag_color?: TransactionFlagColor;
  account_id: string;
  payee_id?: string | null;
  category_id?: string | null;
  deleted: boolean;
  account_name: string;
  payee_name?: string | null;
  category_name?: string | null;
  subtransactions: SubTransaction[];
}

export interface ScheduledTransactionDetail {
  id: string;
  date_first: string;
  date_next: string;
  frequency: ScheduledFrequency;
  amount: Milliunits;
  memo?: string | null;
  flag_color?: TransactionFlagColor;
  account_id: string;
  payee_id?: string | null;
  category_id?: string | null;
  deleted: boolean;
  account_name: string;
  payee_name?: string | null;
  category_name?: string | null;
  subtransactions: SubTransaction[];
}

export interface MonthSummary {
  month: string;
  income: Milliunits;
  budgeted: Milliunits;
  activity: Milliunits;
  to_be_budgeted: Milliunits;
  deleted: boolean;
}

export interface MonthDetail extends MonthSummary {
  categories: Category[];
}

// API Response types
export interface BudgetsResponse {
  budgets: BudgetSummary[];
}

export interface BudgetResponse {
  budget: BudgetSummary & { accounts: Account[] };
}

export interface AccountsResponse {
  accounts: Account[];
}

export interface AccountResponse {
  account: Account;
}

export interface CategoriesResponse {
  category_groups: CategoryGroupWithCategories[];
}

export interface CategoryResponse {
  category: Category;
}

export interface TransactionsResponse {
  transactions: TransactionDetail[];
}

export interface TransactionResponse {
  transaction: TransactionDetail;
}

export interface PayeesResponse {
  payees: Payee[];
}

export interface ScheduledTransactionsResponse {
  scheduled_transactions: ScheduledTransactionDetail[];
}

export interface MonthsResponse {
  months: MonthSummary[];
}

export interface MonthResponse {
  month: MonthDetail;
}

export type ToolResult =
  | BudgetsResponse
  | BudgetResponse
  | AccountsResponse
  | AccountResponse
  | CategoriesResponse
  | CategoryResponse
  | TransactionsResponse
  | TransactionResponse
  | PayeesResponse
  | ScheduledTransactionsResponse
  | MonthsResponse
  | MonthResponse;

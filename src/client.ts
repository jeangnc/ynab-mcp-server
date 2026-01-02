import type {
  BudgetsResponse,
  BudgetResponse,
  AccountsResponse,
  AccountResponse,
  CategoriesResponse,
  CategoryResponse,
  TransactionsResponse,
  TransactionResponse,
  PayeesResponse,
  ScheduledTransactionsResponse,
  MonthsResponse,
  MonthResponse,
} from "./types.js";

const YNAB_BASE_URL = "https://api.ynab.com/v1";

function toUnit(milliunits: number): number {
  return milliunits / 1000;
}

export interface TransactionFilters {
  sinceDate?: string;
  type?: string;
  categoryId?: string;
  payeeId?: string;
  accountId?: string;
}

export class YNABClient {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(path: string): Promise<T> {
    const response = await fetch(`${YNAB_BASE_URL}${path}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`YNAB API error (${response.status}): ${error}`);
    }

    const json = (await response.json()) as { data: T };
    return json.data;
  }

  async listBudgets(): Promise<BudgetsResponse> {
    return this.request<BudgetsResponse>("/budgets");
  }

  async getBudget(budgetId: string): Promise<BudgetResponse> {
    const result = await this.request<BudgetResponse>(`/budgets/${budgetId}`);
    return {
      budget: {
        ...result.budget,
        accounts: result.budget.accounts.map((account) => ({
          ...account,
          balance: toUnit(account.balance),
          cleared_balance: toUnit(account.cleared_balance),
          uncleared_balance: toUnit(account.uncleared_balance),
        })),
      },
    };
  }

  async listAccounts(budgetId: string): Promise<AccountsResponse> {
    const result = await this.request<AccountsResponse>(`/budgets/${budgetId}/accounts`);
    return {
      accounts: result.accounts.map((account) => ({
        ...account,
        balance: toUnit(account.balance),
        cleared_balance: toUnit(account.cleared_balance),
        uncleared_balance: toUnit(account.uncleared_balance),
      })),
    };
  }

  async getAccount(budgetId: string, accountId: string): Promise<AccountResponse> {
    const result = await this.request<AccountResponse>(
      `/budgets/${budgetId}/accounts/${accountId}`
    );
    return {
      account: {
        ...result.account,
        balance: toUnit(result.account.balance),
        cleared_balance: toUnit(result.account.cleared_balance),
        uncleared_balance: toUnit(result.account.uncleared_balance),
      },
    };
  }

  async listCategories(budgetId: string): Promise<CategoriesResponse> {
    const result = await this.request<CategoriesResponse>(`/budgets/${budgetId}/categories`);
    return {
      category_groups: result.category_groups.map((group) => ({
        ...group,
        categories: group.categories.map((category) => ({
          ...category,
          budgeted: toUnit(category.budgeted),
          activity: toUnit(category.activity),
          balance: toUnit(category.balance),
        })),
      })),
    };
  }

  async getCategory(budgetId: string, categoryId: string): Promise<CategoryResponse> {
    const result = await this.request<CategoryResponse>(
      `/budgets/${budgetId}/categories/${categoryId}`
    );
    return {
      category: {
        ...result.category,
        budgeted: toUnit(result.category.budgeted),
        activity: toUnit(result.category.activity),
        balance: toUnit(result.category.balance),
      },
    };
  }

  async listTransactions(
    budgetId: string,
    filters?: TransactionFilters
  ): Promise<TransactionsResponse> {
    let path = `/budgets/${budgetId}/transactions`;
    const queryParams: string[] = [];

    if (filters?.sinceDate) {
      queryParams.push(`since_date=${encodeURIComponent(filters.sinceDate)}`);
    }
    if (filters?.type) {
      queryParams.push(`type=${encodeURIComponent(filters.type)}`);
    }

    if (queryParams.length > 0) {
      path += `?${queryParams.join("&")}`;
    }

    const result = await this.request<TransactionsResponse>(path);
    let transactions = result.transactions;

    if (filters?.categoryId) {
      transactions = transactions.filter((t) => t.category_id === filters.categoryId);
    }
    if (filters?.payeeId) {
      transactions = transactions.filter((t) => t.payee_id === filters.payeeId);
    }
    if (filters?.accountId) {
      transactions = transactions.filter((t) => t.account_id === filters.accountId);
    }

    return {
      transactions: transactions.map((t) => ({
        ...t,
        amount: toUnit(t.amount),
        subtransactions: t.subtransactions.map((st) => ({
          ...st,
          amount: toUnit(st.amount),
        })),
      })),
    };
  }

  async getTransaction(budgetId: string, transactionId: string): Promise<TransactionResponse> {
    const result = await this.request<TransactionResponse>(
      `/budgets/${budgetId}/transactions/${transactionId}`
    );
    return {
      transaction: {
        ...result.transaction,
        amount: toUnit(result.transaction.amount),
        subtransactions: result.transaction.subtransactions.map((st) => ({
          ...st,
          amount: toUnit(st.amount),
        })),
      },
    };
  }

  async listPayees(budgetId: string): Promise<PayeesResponse> {
    return this.request<PayeesResponse>(`/budgets/${budgetId}/payees`);
  }

  async listScheduledTransactions(budgetId: string): Promise<ScheduledTransactionsResponse> {
    const result = await this.request<ScheduledTransactionsResponse>(
      `/budgets/${budgetId}/scheduled_transactions`
    );
    return {
      scheduled_transactions: result.scheduled_transactions.map((t) => ({
        ...t,
        amount: toUnit(t.amount),
        subtransactions: t.subtransactions.map((st) => ({
          ...st,
          amount: toUnit(st.amount),
        })),
      })),
    };
  }

  async listMonths(budgetId: string): Promise<MonthsResponse> {
    const result = await this.request<MonthsResponse>(`/budgets/${budgetId}/months`);
    return {
      months: result.months.map((m) => ({
        ...m,
        income: toUnit(m.income),
        budgeted: toUnit(m.budgeted),
        activity: toUnit(m.activity),
        to_be_budgeted: toUnit(m.to_be_budgeted),
      })),
    };
  }

  async getMonth(budgetId: string, month: string): Promise<MonthResponse> {
    const result = await this.request<MonthResponse>(`/budgets/${budgetId}/months/${month}`);
    return {
      month: {
        ...result.month,
        income: toUnit(result.month.income),
        budgeted: toUnit(result.month.budgeted),
        activity: toUnit(result.month.activity),
        to_be_budgeted: toUnit(result.month.to_be_budgeted),
        categories: result.month.categories.map((category) => ({
          ...category,
          budgeted: toUnit(category.budgeted),
          activity: toUnit(category.activity),
          balance: toUnit(category.balance),
        })),
      },
    };
  }
}

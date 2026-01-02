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
    return this.request<BudgetResponse>(`/budgets/${budgetId}`);
  }

  async listAccounts(budgetId: string): Promise<AccountsResponse> {
    return this.request<AccountsResponse>(`/budgets/${budgetId}/accounts`);
  }

  async getAccount(budgetId: string, accountId: string): Promise<AccountResponse> {
    return this.request<AccountResponse>(`/budgets/${budgetId}/accounts/${accountId}`);
  }

  async listCategories(budgetId: string): Promise<CategoriesResponse> {
    return this.request<CategoriesResponse>(`/budgets/${budgetId}/categories`);
  }

  async getCategory(budgetId: string, categoryId: string): Promise<CategoryResponse> {
    return this.request<CategoryResponse>(`/budgets/${budgetId}/categories/${categoryId}`);
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

    return { transactions };
  }

  async getTransaction(budgetId: string, transactionId: string): Promise<TransactionResponse> {
    return this.request<TransactionResponse>(`/budgets/${budgetId}/transactions/${transactionId}`);
  }

  async listPayees(budgetId: string): Promise<PayeesResponse> {
    return this.request<PayeesResponse>(`/budgets/${budgetId}/payees`);
  }

  async listScheduledTransactions(budgetId: string): Promise<ScheduledTransactionsResponse> {
    return this.request<ScheduledTransactionsResponse>(
      `/budgets/${budgetId}/scheduled_transactions`
    );
  }

  async listMonths(budgetId: string): Promise<MonthsResponse> {
    return this.request<MonthsResponse>(`/budgets/${budgetId}/months`);
  }

  async getMonth(budgetId: string, month: string): Promise<MonthResponse> {
    return this.request<MonthResponse>(`/budgets/${budgetId}/months/${month}`);
  }
}

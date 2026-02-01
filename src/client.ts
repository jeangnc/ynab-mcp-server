import type {
  BudgetSummary,
  BudgetDetail,
  Account,
  Category,
  CategoryGroupWithCategories,
  TransactionDetail,
  SubTransaction,
  Payee,
  ScheduledTransactionDetail,
  ScheduledSubTransaction,
  MonthSummary,
  MonthDetail,
} from "ynab";
import * as ynab from "ynab";
import { toUnit, toMilliunits } from "./currency.js";
import type {
  CreateTransactionInput,
  UpdateTransactionInput,
  CreateAccountInput,
} from "./schemas.js";

// Re-export types from schemas for consumers
export type {
  CreateTransactionInput,
  UpdateTransactionInput,
  CreateAccountInput,
} from "./schemas.js";

export interface TransactionFilters {
  readonly sinceDate?: string | undefined;
  readonly type?: "uncategorized" | "unapproved" | undefined;
  readonly categoryId?: string | undefined;
  readonly payeeId?: string | undefined;
  readonly accountId?: string | undefined;
}

// Response types with currency amounts converted to units
type WithConvertedBalances<T> = Omit<T, "balance" | "cleared_balance" | "uncleared_balance"> & {
  readonly balance: number;
  readonly cleared_balance: number;
  readonly uncleared_balance: number;
};

type WithConvertedCurrency<T> = Omit<T, "budgeted" | "activity" | "balance"> & {
  readonly budgeted: number;
  readonly activity: number;
  readonly balance: number;
};

type WithConvertedAmount<T> = Omit<T, "amount"> & {
  readonly amount: number;
};

type WithConvertedMonthCurrency<T> = Omit<
  T,
  "income" | "budgeted" | "activity" | "to_be_budgeted"
> & {
  readonly income: number;
  readonly budgeted: number;
  readonly activity: number;
  readonly to_be_budgeted: number;
};

type ConvertedSubTransaction = WithConvertedAmount<SubTransaction>;
type ConvertedScheduledSubTransaction = WithConvertedAmount<ScheduledSubTransaction>;

type ConvertedTransaction = WithConvertedAmount<Omit<TransactionDetail, "subtransactions">> & {
  readonly subtransactions: readonly ConvertedSubTransaction[];
};

type ConvertedScheduledTransaction = WithConvertedAmount<
  Omit<ScheduledTransactionDetail, "subtransactions">
> & {
  readonly subtransactions: readonly ConvertedScheduledSubTransaction[];
};

type ConvertedAccount = WithConvertedBalances<Account>;

type ConvertedCategory = WithConvertedCurrency<Category>;

type ConvertedCategoryGroup = Omit<CategoryGroupWithCategories, "categories"> & {
  readonly categories: readonly ConvertedCategory[];
};

type ConvertedMonthSummary = WithConvertedMonthCurrency<MonthSummary>;

type ConvertedMonthDetail = WithConvertedMonthCurrency<Omit<MonthDetail, "categories">> & {
  readonly categories: readonly ConvertedCategory[];
};

// Budget type with converted accounts
type ConvertedBudgetDetail = Omit<BudgetDetail, "accounts"> & {
  readonly accounts?: readonly ConvertedAccount[] | undefined;
};

// Response interfaces
export interface ListBudgetsResponse {
  readonly budgets: readonly BudgetSummary[];
}

export interface GetBudgetResponse {
  readonly budget: ConvertedBudgetDetail;
}

export interface ListAccountsResponse {
  readonly accounts: readonly ConvertedAccount[];
}

export interface GetAccountResponse {
  readonly account: ConvertedAccount;
}

export interface ListCategoriesResponse {
  readonly category_groups: readonly ConvertedCategoryGroup[];
}

export interface GetCategoryResponse {
  readonly category: ConvertedCategory;
}

export interface ListTransactionsResponse {
  readonly transactions: readonly ConvertedTransaction[];
}

export interface GetTransactionResponse {
  readonly transaction: ConvertedTransaction;
}

export interface ListPayeesResponse {
  readonly payees: readonly Payee[];
}

export interface ListScheduledTransactionsResponse {
  readonly scheduled_transactions: readonly ConvertedScheduledTransaction[];
}

export interface ListMonthsResponse {
  readonly months: readonly ConvertedMonthSummary[];
}

export interface GetMonthResponse {
  readonly month: ConvertedMonthDetail;
}

export interface CreateTransactionResponse {
  readonly transaction: ConvertedTransaction;
}

export interface UpdateTransactionResponse {
  readonly transaction: ConvertedTransaction;
}

export interface DeleteTransactionResponse {
  readonly transaction: ConvertedTransaction;
}

export interface UpdateCategoryBudgetResponse {
  readonly category: ConvertedCategory;
}

export interface CreateAccountResponse {
  readonly account: ConvertedAccount;
}

export class YNABClient {
  private readonly api: ynab.API;

  constructor(token: string) {
    this.api = new ynab.API(token);
  }

  async listBudgets(): Promise<ListBudgetsResponse> {
    const response = await this.api.budgets.getBudgets();
    return { budgets: response.data.budgets };
  }

  async getBudget(budgetId: string): Promise<GetBudgetResponse> {
    const response = await this.api.budgets.getBudgetById(budgetId);
    const budget = response.data.budget;
    return {
      budget: {
        ...budget,
        accounts: budget.accounts?.map((account) => ({
          ...account,
          balance: toUnit(account.balance),
          cleared_balance: toUnit(account.cleared_balance),
          uncleared_balance: toUnit(account.uncleared_balance),
        })),
      },
    };
  }

  async listAccounts(budgetId: string): Promise<ListAccountsResponse> {
    const response = await this.api.accounts.getAccounts(budgetId);
    return {
      accounts: response.data.accounts.map((account) => ({
        ...account,
        balance: toUnit(account.balance),
        cleared_balance: toUnit(account.cleared_balance),
        uncleared_balance: toUnit(account.uncleared_balance),
      })),
    };
  }

  async getAccount(budgetId: string, accountId: string): Promise<GetAccountResponse> {
    const response = await this.api.accounts.getAccountById(budgetId, accountId);
    const account = response.data.account;
    return {
      account: {
        ...account,
        balance: toUnit(account.balance),
        cleared_balance: toUnit(account.cleared_balance),
        uncleared_balance: toUnit(account.uncleared_balance),
      },
    };
  }

  async listCategories(budgetId: string): Promise<ListCategoriesResponse> {
    const response = await this.api.categories.getCategories(budgetId);
    return {
      category_groups: response.data.category_groups.map((group) => ({
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

  async getCategory(budgetId: string, categoryId: string): Promise<GetCategoryResponse> {
    const response = await this.api.categories.getCategoryById(budgetId, categoryId);
    const category = response.data.category;
    return {
      category: {
        ...category,
        budgeted: toUnit(category.budgeted),
        activity: toUnit(category.activity),
        balance: toUnit(category.balance),
      },
    };
  }

  async listTransactions(
    budgetId: string,
    filters?: TransactionFilters
  ): Promise<ListTransactionsResponse> {
    const response = await this.api.transactions.getTransactions(
      budgetId,
      filters?.sinceDate,
      filters?.type
    );

    let transactions = response.data.transactions;

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

  async getTransaction(budgetId: string, transactionId: string): Promise<GetTransactionResponse> {
    const response = await this.api.transactions.getTransactionById(budgetId, transactionId);
    const transaction = response.data.transaction;
    return {
      transaction: {
        ...transaction,
        amount: toUnit(transaction.amount),
        subtransactions: transaction.subtransactions.map((st) => ({
          ...st,
          amount: toUnit(st.amount),
        })),
      },
    };
  }

  async listPayees(budgetId: string): Promise<ListPayeesResponse> {
    const response = await this.api.payees.getPayees(budgetId);
    return { payees: response.data.payees };
  }

  async listScheduledTransactions(budgetId: string): Promise<ListScheduledTransactionsResponse> {
    const response = await this.api.scheduledTransactions.getScheduledTransactions(budgetId);
    return {
      scheduled_transactions: response.data.scheduled_transactions.map((t) => ({
        ...t,
        amount: toUnit(t.amount),
        subtransactions: t.subtransactions.map((st) => ({
          ...st,
          amount: toUnit(st.amount),
        })),
      })),
    };
  }

  async listMonths(budgetId: string): Promise<ListMonthsResponse> {
    const response = await this.api.months.getBudgetMonths(budgetId);
    return {
      months: response.data.months.map((m) => ({
        ...m,
        income: toUnit(m.income),
        budgeted: toUnit(m.budgeted),
        activity: toUnit(m.activity),
        to_be_budgeted: toUnit(m.to_be_budgeted),
      })),
    };
  }

  async getMonth(budgetId: string, month: string): Promise<GetMonthResponse> {
    const response = await this.api.months.getBudgetMonth(budgetId, month);
    const monthData = response.data.month;
    return {
      month: {
        ...monthData,
        income: toUnit(monthData.income),
        budgeted: toUnit(monthData.budgeted),
        activity: toUnit(monthData.activity),
        to_be_budgeted: toUnit(monthData.to_be_budgeted),
        categories: monthData.categories.map((category) => ({
          ...category,
          budgeted: toUnit(category.budgeted),
          activity: toUnit(category.activity),
          balance: toUnit(category.balance),
        })),
      },
    };
  }

  async createTransaction(
    budgetId: string,
    input: CreateTransactionInput
  ): Promise<CreateTransactionResponse> {
    const transaction = {
      account_id: input.account_id,
      date: input.date,
      amount: toMilliunits(input.amount),
      ...(input.payee_id !== undefined && { payee_id: input.payee_id }),
      ...(input.payee_name !== undefined && { payee_name: input.payee_name }),
      ...(input.category_id !== undefined && { category_id: input.category_id }),
      ...(input.memo !== undefined && { memo: input.memo }),
      ...(input.cleared !== undefined && { cleared: input.cleared }),
      ...(input.approved !== undefined && { approved: input.approved }),
      ...(input.flag_color !== undefined && { flag_color: input.flag_color }),
    };

    const response = await this.api.transactions.createTransaction(budgetId, { transaction });
    const created = response.data.transaction;
    if (!created) {
      throw new Error("Transaction creation failed: no transaction returned");
    }
    return {
      transaction: {
        ...created,
        amount: toUnit(created.amount),
        subtransactions:
          created.subtransactions?.map((st) => ({
            ...st,
            amount: toUnit(st.amount),
          })) ?? [],
      },
    };
  }

  async updateTransaction(
    budgetId: string,
    transactionId: string,
    input: UpdateTransactionInput
  ): Promise<UpdateTransactionResponse> {
    const transaction = {
      ...(input.account_id && { account_id: input.account_id }),
      ...(input.date && { date: input.date }),
      ...(input.amount !== undefined && { amount: toMilliunits(input.amount) }),
      ...(input.payee_id !== undefined && { payee_id: input.payee_id }),
      ...(input.payee_name !== undefined && { payee_name: input.payee_name }),
      ...(input.category_id !== undefined && { category_id: input.category_id }),
      ...(input.memo !== undefined && { memo: input.memo }),
      ...(input.cleared && { cleared: input.cleared }),
      ...(input.approved !== undefined && { approved: input.approved }),
      ...(input.flag_color !== undefined && { flag_color: input.flag_color }),
    };

    const response = await this.api.transactions.updateTransaction(budgetId, transactionId, {
      transaction,
    });
    const updated = response.data.transaction;
    return {
      transaction: {
        ...updated,
        amount: toUnit(updated.amount),
        subtransactions: updated.subtransactions.map((st) => ({
          ...st,
          amount: toUnit(st.amount),
        })),
      },
    };
  }

  async deleteTransaction(
    budgetId: string,
    transactionId: string
  ): Promise<DeleteTransactionResponse> {
    const response = await this.api.transactions.deleteTransaction(budgetId, transactionId);
    const deleted = response.data.transaction;
    return {
      transaction: {
        ...deleted,
        amount: toUnit(deleted.amount),
        subtransactions: deleted.subtransactions.map((st) => ({
          ...st,
          amount: toUnit(st.amount),
        })),
      },
    };
  }

  async updateCategoryBudget(
    budgetId: string,
    month: string,
    categoryId: string,
    budgeted: number
  ): Promise<UpdateCategoryBudgetResponse> {
    const response = await this.api.categories.updateMonthCategory(budgetId, month, categoryId, {
      category: { budgeted: toMilliunits(budgeted) },
    });
    const category = response.data.category;
    return {
      category: {
        ...category,
        budgeted: toUnit(category.budgeted),
        activity: toUnit(category.activity),
        balance: toUnit(category.balance),
      },
    };
  }

  async createAccount(budgetId: string, input: CreateAccountInput): Promise<CreateAccountResponse> {
    const response = await this.api.accounts.createAccount(budgetId, {
      account: {
        name: input.name,
        type: input.type,
        balance: toMilliunits(input.balance),
      },
    });
    const account = response.data.account;
    return {
      account: {
        ...account,
        balance: toUnit(account.balance),
        cleared_balance: toUnit(account.cleared_balance),
        uncleared_balance: toUnit(account.uncleared_balance),
      },
    };
  }
}

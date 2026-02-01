import * as ynab from "ynab";

const toUnit = (milliunits: number) => ynab.utils.convertMilliUnitsToCurrencyAmount(milliunits);
const toMilliunits = (amount: number) => Math.round(amount * 1000);

export interface TransactionFilters {
  sinceDate?: string;
  type?: "uncategorized" | "unapproved";
  categoryId?: string;
  payeeId?: string;
  accountId?: string;
}

export interface CreateTransactionInput {
  account_id: string;
  date: string;
  amount: number;
  payee_id?: string;
  payee_name?: string;
  category_id?: string;
  memo?: string;
  cleared?: "cleared" | "uncleared" | "reconciled";
  approved?: boolean;
  flag_color?: "red" | "orange" | "yellow" | "green" | "blue" | "purple";
}

export interface UpdateTransactionInput {
  account_id?: string;
  date?: string;
  amount?: number;
  payee_id?: string;
  payee_name?: string;
  category_id?: string;
  memo?: string;
  cleared?: "cleared" | "uncleared" | "reconciled";
  approved?: boolean;
  flag_color?: "red" | "orange" | "yellow" | "green" | "blue" | "purple";
}

export interface CreateAccountInput {
  name: string;
  type: string;
  balance: number;
}

export class YNABClient {
  private api: ynab.API;

  constructor(token: string) {
    this.api = new ynab.API(token);
  }

  async listBudgets() {
    const response = await this.api.budgets.getBudgets();
    return { budgets: response.data.budgets };
  }

  async getBudget(budgetId: string) {
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

  async listAccounts(budgetId: string) {
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

  async getAccount(budgetId: string, accountId: string) {
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

  async listCategories(budgetId: string) {
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

  async getCategory(budgetId: string, categoryId: string) {
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

  async listTransactions(budgetId: string, filters?: TransactionFilters) {
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

  async getTransaction(budgetId: string, transactionId: string) {
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

  async listPayees(budgetId: string) {
    const response = await this.api.payees.getPayees(budgetId);
    return { payees: response.data.payees };
  }

  async listScheduledTransactions(budgetId: string) {
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

  async listMonths(budgetId: string) {
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

  async getMonth(budgetId: string, month: string) {
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

  async createTransaction(budgetId: string, input: CreateTransactionInput) {
    const transaction = {
      account_id: input.account_id,
      date: input.date,
      amount: toMilliunits(input.amount),
      payee_id: input.payee_id,
      payee_name: input.payee_name,
      category_id: input.category_id,
      memo: input.memo,
      cleared: input.cleared,
      approved: input.approved,
      flag_color: input.flag_color,
    };

    const response = await this.api.transactions.createTransaction(budgetId, { transaction });
    const created = response.data.transaction!;
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

  async updateTransaction(budgetId: string, transactionId: string, input: UpdateTransactionInput) {
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

  async deleteTransaction(budgetId: string, transactionId: string) {
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
  ) {
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

  async createAccount(budgetId: string, input: CreateAccountInput) {
    const response = await this.api.accounts.createAccount(budgetId, {
      account: {
        name: input.name,
        type: input.type as ynab.AccountType,
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

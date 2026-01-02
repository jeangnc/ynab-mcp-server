import * as ynab from "ynab";

const toUnit = (milliunits: number) => ynab.utils.convertMilliUnitsToCurrencyAmount(milliunits);

export interface TransactionFilters {
  sinceDate?: string;
  type?: "uncategorized" | "unapproved";
  categoryId?: string;
  payeeId?: string;
  accountId?: string;
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
}

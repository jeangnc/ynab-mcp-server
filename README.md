# YNAB MCP Server

Talk to your finances.

## What is this?

[YNAB (You Need A Budget)](https://ynab.com) is a popular budgeting app that helps you gain control of your money. This MCP server connects AI assistants to your YNAB data, giving you conversational access to:

- Your budgets and accounts
- Transaction history and patterns
- Category balances and spending insights
- Scheduled and recurring transactions
- Creating and managing transactions
- Updating category budgets
- Creating accounts

## Installation

### Via npx (recommended)

No installation required. Configure your Claude client to use npx directly (see below).

### Via npm (global)

```bash
npm install -g ynab-mcp-server
```

### From source

```bash
git clone https://github.com/jeangnc/ynab-mcp-server.git
cd ynab-mcp-server
make install
make build
```

## Configuration

First, set your YNAB API token in your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
export YNAB_API_TOKEN="your-token-here"
```

### Claude Code

```bash
claude mcp add ynab --scope user --env YNAB_API_TOKEN='${YNAB_API_TOKEN}' -- npx -y ynab-mcp-server
```

### Claude Desktop

Add to `~/.config/claude/claude_desktop_config.json` (Linux) or `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "ynab": {
      "command": "npx",
      "args": ["-y", "ynab-mcp-server"],
      "env": {
        "YNAB_API_TOKEN": "${YNAB_API_TOKEN}"
      }
    }
  }
}
```

### Manual usage

```bash
YNAB_API_TOKEN=$YNAB_API_TOKEN npx ynab-mcp-server
```

## Available Tools

### Read Tools

| Tool | Description |
|------|-------------|
| `list_budgets` | Get all budgets for the authenticated user. Returns budget names, IDs, and last modified dates. |
| `get_budget` | Get detailed information about a specific budget including accounts, categories, and settings. |
| `list_accounts` | Get all accounts for a budget. Returns account names, types, balances, and status. |
| `get_account` | Get detailed information about a specific account. |
| `list_categories` | Get all categories for a budget, grouped by category group. Includes budgeted amounts and activity. |
| `get_category` | Get detailed information about a specific category including current month data. |
| `list_transactions` | Get transactions for a budget. Supports filtering by date, type, category, payee, and account. |
| `get_transaction` | Get detailed information about a specific transaction. |
| `list_payees` | Get all payees for a budget. |
| `list_scheduled_transactions` | Get all scheduled/recurring transactions for a budget. |
| `list_months` | Get all budget months. Returns month summaries with income, budgeted, and activity totals. |
| `get_month` | Get detailed budget information for a specific month including all category balances. |

### Write Tools

| Tool | Description |
|------|-------------|
| `create_transaction` | Create a new transaction. Amount should be negative for expenses and positive for income. |
| `update_transaction` | Update an existing transaction. Only provide the fields you want to change. |
| `delete_transaction` | Delete an existing transaction. |
| `update_category_budget` | Update the budgeted amount for a category in a specific month. |
| `create_account` | Create a new account in the budget. |
| `get_scheduled_transaction` | Get detailed information about a specific scheduled transaction. |
| `create_scheduled_transaction` | Create a new scheduled/recurring transaction. Date must be in the future (max 5 years). |
| `update_scheduled_transaction` | Update an existing scheduled transaction. Only provide fields you want to change. |
| `delete_scheduled_transaction` | Delete an existing scheduled transaction. |
| `update_payee` | Update a payee's name. The name must be a maximum of 500 characters. |

## Makefile Commands

```
make install  # Install dependencies
make build    # Compile TypeScript
make run      # Run compiled server
make dev      # Run TypeScript directly
make clean    # Remove build artifacts
```

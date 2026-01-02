# YNAB MCP Server

MCP (Model Context Protocol) server for the YNAB (You Need A Budget) API.

## Setup

```bash
make install
make build
```

## Usage

Set your YNAB API token and run:

```bash
YNAB_API_TOKEN=your-token make run
```

### Claude Desktop Configuration

Add to `~/.config/claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ynab": {
      "command": "node",
      "args": ["/path/to/ynab-mcp-server/build/index.js"],
      "env": {
        "YNAB_API_TOKEN": "your-token-here"
      }
    }
  }
}
```

## Available Tools

| Tool | Description |
|------|-------------|
| `list_budgets` | Get all budgets for the authenticated user |
| `get_budget` | Get detailed budget information |
| `list_accounts` | List all accounts in a budget |
| `get_account` | Get specific account details |
| `list_categories` | Get categories grouped by category group |
| `get_category` | Get single category details |
| `list_transactions` | Get transactions with optional filters |
| `get_transaction` | Get single transaction details |
| `list_payees` | Get all payees |
| `list_scheduled_transactions` | Get recurring transactions |
| `list_months` | Get budget month summaries |
| `get_month` | Get detailed month with category balances |

## Makefile Commands

```
make install  # Install dependencies
make build    # Compile TypeScript
make run      # Run compiled server
make dev      # Run TypeScript directly
make clean    # Remove build artifacts
```

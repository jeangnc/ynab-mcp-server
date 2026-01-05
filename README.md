# YNAB MCP Server

Talk to your finances.

## What is this?

[YNAB (You Need A Budget)](https://ynab.com) is a popular budgeting app that helps you gain control of your money. This MCP server connects AI assistants to your YNAB data, giving you conversational access to:

- Your budgets and accounts
- Transaction history and patterns
- Category balances and spending insights
- Scheduled and recurring transactions

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

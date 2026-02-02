import * as fs from "fs/promises";
import * as path from "path";
import type { HistoryEntry, HistoryEntryId, HistoryEntryStatus } from "./types.js";

export interface HistoryStoreOptions {
  readonly maxEntries?: number;
}

const DEFAULT_MAX_ENTRIES = 100;

export class HistoryStore {
  private readonly filePath: string;
  private readonly maxEntries: number;
  private entries: HistoryEntry[] = [];

  constructor(filePath: string, options: HistoryStoreOptions = {}) {
    this.filePath = filePath;
    this.maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
  }

  async load(): Promise<void> {
    try {
      const content = await fs.readFile(this.filePath, "utf-8");
      const parsed: unknown = JSON.parse(content);

      if (!Array.isArray(parsed)) {
        this.entries = [];
        return;
      }

      // Trust persisted data structure - validated on write
      this.entries = parsed as HistoryEntry[];
    } catch {
      // File doesn't exist or is corrupt - start with empty history
      this.entries = [];
    }
  }

  async add(entry: HistoryEntry): Promise<void> {
    // Add to the beginning (newest first)
    this.entries.unshift(entry);

    // Evict oldest entries if we exceed max
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(0, this.maxEntries);
    }

    await this.save();
  }

  get(id: HistoryEntryId): HistoryEntry | undefined {
    return this.entries.find((entry) => entry.id === id);
  }

  getAll(): readonly HistoryEntry[] {
    return this.entries;
  }

  getByBudget(budgetId: string): readonly HistoryEntry[] {
    return this.entries.filter((entry) => entry.budgetId === budgetId);
  }

  async updateStatus(id: HistoryEntryId, status: HistoryEntryStatus): Promise<void> {
    const index = this.entries.findIndex((entry) => entry.id === id);
    if (index === -1) {
      throw new Error("History entry not found");
    }

    const existing = this.entries[index];
    if (!existing) {
      throw new Error("History entry not found");
    }

    // Create a new entry with updated status - spread preserves discriminated union
    const updated: HistoryEntry = { ...existing, status };
    this.entries[index] = updated;

    await this.save();
  }

  async clear(): Promise<void> {
    this.entries = [];
    await this.save();
  }

  private async save(): Promise<void> {
    // Ensure directory exists
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });

    await fs.writeFile(this.filePath, JSON.stringify(this.entries, null, 2));
  }
}

// Default history file location
export function getDefaultHistoryPath(): string {
  const homeDir = process.env["HOME"] ?? process.env["USERPROFILE"] ?? ".";
  return path.join(homeDir, ".ynab-mcp-history.json");
}

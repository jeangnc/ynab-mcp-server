import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import { HistoryStore } from "../../history/history-store.js";
import type { HistoryEntry, HistoryEntryId, CreateTransactionEntry } from "../../history/types.js";
import { createHistoryEntryId } from "../../history/types.js";

// Use a temp directory for tests
const testHistoryDir = path.join(os.tmpdir(), "ynab-mcp-test");
const testHistoryFile = path.join(testHistoryDir, "history.json");

describe("HistoryStore", () => {
  beforeEach(async () => {
    // Clean up test directory before each test
    await fs.rm(testHistoryDir, { recursive: true, force: true });
    await fs.mkdir(testHistoryDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testHistoryDir, { recursive: true, force: true });
  });

  function createTestEntry(
    overrides: Partial<CreateTransactionEntry> = {}
  ): CreateTransactionEntry {
    return {
      id: createHistoryEntryId(),
      timestamp: new Date().toISOString(),
      budgetId: "budget-123",
      status: "success",
      operation: "create_transaction",
      createdId: "tx-123",
      ...overrides,
    };
  }

  describe("initialization", () => {
    it("creates empty history when file does not exist", async () => {
      const store = new HistoryStore(testHistoryFile);
      await store.load();

      const entries = store.getAll();
      expect(entries).toEqual([]);
    });

    it("loads existing history from file", async () => {
      const entry = createTestEntry();
      await fs.writeFile(testHistoryFile, JSON.stringify([entry]));

      const store = new HistoryStore(testHistoryFile);
      await store.load();

      const entries = store.getAll();
      expect(entries).toHaveLength(1);
      expect(entries[0]?.id).toBe(entry.id);
    });

    it("resets to empty history when file is corrupt", async () => {
      await fs.writeFile(testHistoryFile, "not valid json");

      const store = new HistoryStore(testHistoryFile);
      await store.load();

      const entries = store.getAll();
      expect(entries).toEqual([]);
    });

    it("resets to empty history when file contains non-array", async () => {
      await fs.writeFile(testHistoryFile, JSON.stringify({ foo: "bar" }));

      const store = new HistoryStore(testHistoryFile);
      await store.load();

      const entries = store.getAll();
      expect(entries).toEqual([]);
    });
  });

  describe("add", () => {
    it("adds entry to history", async () => {
      const store = new HistoryStore(testHistoryFile);
      await store.load();

      const entry = createTestEntry();
      await store.add(entry);

      const entries = store.getAll();
      expect(entries).toHaveLength(1);
      expect(entries[0]).toEqual(entry);
    });

    it("persists entry to file", async () => {
      const store = new HistoryStore(testHistoryFile);
      await store.load();

      const entry = createTestEntry();
      await store.add(entry);

      // Read file directly to verify persistence
      const fileContent = await fs.readFile(testHistoryFile, "utf-8");
      const persisted = JSON.parse(fileContent) as CreateTransactionEntry[];
      expect(persisted).toHaveLength(1);
      expect(persisted[0]?.id).toBe(entry.id);
    });

    it("adds entries in reverse chronological order (newest first)", async () => {
      const store = new HistoryStore(testHistoryFile);
      await store.load();

      const entry1 = createTestEntry({ createdId: "tx-1" });
      const entry2 = createTestEntry({ createdId: "tx-2" });

      await store.add(entry1);
      await store.add(entry2);

      const entries = store.getAll();
      expect((entries[0] as CreateTransactionEntry).createdId).toBe("tx-2");
      expect((entries[1] as CreateTransactionEntry).createdId).toBe("tx-1");
    });
  });

  describe("get", () => {
    it("returns entry by id", async () => {
      const store = new HistoryStore(testHistoryFile);
      await store.load();

      const entry = createTestEntry();
      await store.add(entry);

      const retrieved = store.get(entry.id);
      expect(retrieved).toEqual(entry);
    });

    it("returns undefined for non-existent id", async () => {
      const store = new HistoryStore(testHistoryFile);
      await store.load();

      const retrieved = store.get("non-existent" as HistoryEntryId);
      expect(retrieved).toBeUndefined();
    });
  });

  describe("getAll", () => {
    it("returns all entries", async () => {
      const store = new HistoryStore(testHistoryFile);
      await store.load();

      const entry1 = createTestEntry({ createdId: "tx-1" });
      const entry2 = createTestEntry({ createdId: "tx-2" });

      await store.add(entry1);
      await store.add(entry2);

      const entries = store.getAll();
      expect(entries).toHaveLength(2);
    });

    it("returns entries in reverse chronological order", async () => {
      const store = new HistoryStore(testHistoryFile);
      await store.load();

      const entry1 = createTestEntry({ createdId: "tx-1" });
      const entry2 = createTestEntry({ createdId: "tx-2" });
      const entry3 = createTestEntry({ createdId: "tx-3" });

      await store.add(entry1);
      await store.add(entry2);
      await store.add(entry3);

      const entries = store.getAll();
      expect(entries.map((e) => (e as CreateTransactionEntry).createdId)).toEqual([
        "tx-3",
        "tx-2",
        "tx-1",
      ]);
    });
  });

  describe("getByBudget", () => {
    it("returns entries filtered by budget id", async () => {
      const store = new HistoryStore(testHistoryFile);
      await store.load();

      const entry1 = createTestEntry({ budgetId: "budget-1", createdId: "tx-1" });
      const entry2 = createTestEntry({ budgetId: "budget-2", createdId: "tx-2" });
      const entry3 = createTestEntry({ budgetId: "budget-1", createdId: "tx-3" });

      await store.add(entry1);
      await store.add(entry2);
      await store.add(entry3);

      const entries = store.getByBudget("budget-1");
      expect(entries).toHaveLength(2);
      expect(entries.every((e) => e.budgetId === "budget-1")).toBe(true);
    });

    it("returns empty array when no entries match", async () => {
      const store = new HistoryStore(testHistoryFile);
      await store.load();

      const entry = createTestEntry({ budgetId: "budget-1" });
      await store.add(entry);

      const entries = store.getByBudget("budget-other");
      expect(entries).toEqual([]);
    });
  });

  describe("updateStatus", () => {
    it("updates entry status", async () => {
      const store = new HistoryStore(testHistoryFile);
      await store.load();

      const entry = createTestEntry();
      await store.add(entry);

      await store.updateStatus(entry.id, "undone");

      const updated = store.get(entry.id);
      expect(updated?.status).toBe("undone");
    });

    it("persists status change to file", async () => {
      const store = new HistoryStore(testHistoryFile);
      await store.load();

      const entry = createTestEntry();
      await store.add(entry);
      await store.updateStatus(entry.id, "undo_failed");

      // Read file directly to verify persistence
      const fileContent = await fs.readFile(testHistoryFile, "utf-8");
      const persisted = JSON.parse(fileContent) as HistoryEntry[];
      expect(persisted[0]?.status).toBe("undo_failed");
    });

    it("throws error for non-existent entry", async () => {
      const store = new HistoryStore(testHistoryFile);
      await store.load();

      await expect(store.updateStatus("non-existent" as HistoryEntryId, "undone")).rejects.toThrow(
        "History entry not found"
      );
    });
  });

  describe("clear", () => {
    it("removes all entries", async () => {
      const store = new HistoryStore(testHistoryFile);
      await store.load();

      await store.add(createTestEntry({ createdId: "tx-1" }));
      await store.add(createTestEntry({ createdId: "tx-2" }));

      await store.clear();

      expect(store.getAll()).toEqual([]);
    });

    it("persists cleared state to file", async () => {
      const store = new HistoryStore(testHistoryFile);
      await store.load();

      await store.add(createTestEntry());
      await store.clear();

      const fileContent = await fs.readFile(testHistoryFile, "utf-8");
      expect(JSON.parse(fileContent) as unknown).toEqual([]);
    });
  });

  describe("maxEntries", () => {
    it("evicts oldest entries when max is exceeded", async () => {
      const store = new HistoryStore(testHistoryFile, { maxEntries: 3 });
      await store.load();

      await store.add(createTestEntry({ createdId: "tx-1" }));
      await store.add(createTestEntry({ createdId: "tx-2" }));
      await store.add(createTestEntry({ createdId: "tx-3" }));
      await store.add(createTestEntry({ createdId: "tx-4" }));

      const entries = store.getAll();
      expect(entries).toHaveLength(3);
      // Oldest (tx-1) should be evicted, newest should remain
      expect(entries.map((e) => (e as CreateTransactionEntry).createdId)).toEqual([
        "tx-4",
        "tx-3",
        "tx-2",
      ]);
    });

    it("defaults to 100 entries", async () => {
      const store = new HistoryStore(testHistoryFile);
      await store.load();

      // Verify default by checking the store handles many entries
      for (let i = 0; i < 105; i++) {
        await store.add(createTestEntry({ createdId: `tx-${i}` }));
      }

      const entries = store.getAll();
      expect(entries).toHaveLength(100);
    });
  });

  describe("concurrent operations", () => {
    it("handles multiple adds without data loss", async () => {
      const store = new HistoryStore(testHistoryFile);
      await store.load();

      // Add entries sequentially but quickly
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(store.add(createTestEntry({ createdId: `tx-${i}` })));
      }
      await Promise.all(promises);

      const entries = store.getAll();
      expect(entries).toHaveLength(10);
    });
  });

  describe("reload", () => {
    it("reloads history from file", async () => {
      const store = new HistoryStore(testHistoryFile);
      await store.load();

      // Add entry through store
      const entry = createTestEntry();
      await store.add(entry);

      // Manually modify file
      const newEntry = createTestEntry({ createdId: "external-tx" });
      await fs.writeFile(testHistoryFile, JSON.stringify([newEntry]));

      // Reload
      await store.load();

      const entries = store.getAll();
      expect(entries).toHaveLength(1);
      expect((entries[0] as CreateTransactionEntry).createdId).toBe("external-tx");
    });
  });
});

import { describe, it, expect } from "vitest";
import { formatError } from "../errors.js";

describe("formatError", () => {
  it("uses the message of an Error", () => {
    expect(formatError(new Error("boom"))).toBe("boom");
  });

  it("formats the YNAB API error body the SDK throws", () => {
    const body = { error: { id: "401", name: "unauthorized", detail: "Unauthorized" } };
    expect(formatError(body)).toBe("YNAB API error 401 unauthorized: Unauthorized");
  });

  it("formats a YNAB error without detail", () => {
    expect(formatError({ error: { id: "429", name: "too_many_requests" } })).toBe(
      "YNAB API error 429 too_many_requests"
    );
  });

  it("formats a YNAB error with only detail", () => {
    expect(formatError({ error: { detail: "Resource not found" } })).toBe(
      "YNAB API error: Resource not found"
    );
  });

  it("serializes other objects instead of printing [object Object]", () => {
    expect(formatError({ reason: "unexpected" })).toBe('{"reason":"unexpected"}');
  });

  it("serializes a non-string detail", () => {
    expect(
      formatError({ error: { id: "400", name: "bad_request", detail: { field: "date" } } })
    ).toBe('YNAB API error 400 bad_request: {"field":"date"}');
  });

  it("does not print [object Object] for objects that cannot be serialized", () => {
    const circular: Record<string, unknown> = {};
    circular["self"] = circular;
    expect(formatError(circular)).toBe("Unserializable error object");
  });

  it("stringifies primitives", () => {
    expect(formatError("plain text")).toBe("plain text");
    expect(formatError(42)).toBe("42");
    expect(formatError(undefined)).toBe("undefined");
  });
});

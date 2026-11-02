interface YNABErrorDetail {
  id?: unknown;
  name?: unknown;
  detail?: unknown;
}

function isYNABErrorResponse(error: unknown): error is { error: YNABErrorDetail } {
  return (
    typeof error === "object" &&
    error !== null &&
    "error" in error &&
    typeof (error as { error: unknown }).error === "object" &&
    (error as { error: unknown }).error !== null
  );
}

/**
 * Turns anything a tool handler throws into a readable message.
 *
 * The YNAB SDK does not throw an Error for API failures: on any non-2xx response it
 * throws the parsed response body, `{ error: { id, name, detail } }`. Passing that to
 * String() yields "[object Object]", hiding the reason (bad token, rate limit, missing
 * resource) from the client.
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (isYNABErrorResponse(error)) {
    const { id, name, detail } = error.error;
    const label = [id, name]
      .filter(
        (part): part is string | number => typeof part === "string" || typeof part === "number"
      )
      .filter((part) => part !== "")
      .join(" ");
    const prefix = label ? `YNAB API error ${label}` : "YNAB API error";
    if (detail === undefined || detail === "") {
      return prefix;
    }
    return `${prefix}: ${typeof detail === "string" ? detail : JSON.stringify(detail)}`;
  }

  if (typeof error === "object" && error !== null) {
    try {
      return JSON.stringify(error);
    } catch {
      return "Unserializable error object";
    }
  }

  return String(error);
}

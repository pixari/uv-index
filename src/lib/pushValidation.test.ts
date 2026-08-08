import { describe, expect, it } from "vitest";
import type { NextRequest } from "next/server";
import { parseJsonBody, parseLocale, parseSubscriptionInput } from "./pushValidation";

// parseJsonBody only ever touches req.json() — a minimal double is enough
// and avoids depending on how NextRequest happens to construct itself.
function reqWithBody(body: unknown): NextRequest {
  return { json: async () => body } as unknown as NextRequest;
}

function reqWithInvalidJson(): NextRequest {
  return {
    json: async () => {
      throw new SyntaxError("Unexpected token");
    },
  } as unknown as NextRequest;
}

describe("parseJsonBody", () => {
  it("resolves the parsed body", async () => {
    expect(await parseJsonBody(reqWithBody({ a: 1 }))).toEqual({ a: 1 });
  });

  it("resolves undefined (never throws) when the body isn't valid JSON", async () => {
    expect(await parseJsonBody(reqWithInvalidJson())).toBeUndefined();
  });
});

const VALID_SUBSCRIPTION = {
  subscription: {
    endpoint: "https://fcm.googleapis.com/fcm/send/abc123",
    keys: { p256dh: "p256dh-key", auth: "auth-key" },
  },
};

describe("parseSubscriptionInput", () => {
  it("extracts endpoint/p256dh/auth from a valid subscription", () => {
    expect(parseSubscriptionInput(VALID_SUBSCRIPTION)).toEqual({
      endpoint: "https://fcm.googleapis.com/fcm/send/abc123",
      p256dh: "p256dh-key",
      auth: "auth-key",
    });
  });

  it("rejects a missing subscription or missing keys", () => {
    expect(parseSubscriptionInput({})).toBeNull();
    expect(parseSubscriptionInput({ subscription: {} })).toBeNull();
    expect(
      parseSubscriptionInput({
        subscription: { endpoint: "https://example.com/x", keys: { p256dh: "a" } },
      }),
    ).toBeNull();
  });

  it("rejects an endpoint that isn't a URL", () => {
    expect(
      parseSubscriptionInput({
        subscription: { endpoint: "not-a-url", keys: { p256dh: "a", auth: "b" } },
      }),
    ).toBeNull();
  });
});

describe("parseLocale", () => {
  it("passes through a known locale", () => {
    expect(parseLocale("de")).toBe("de");
  });

  it("falls back to the default locale for anything unknown or missing", () => {
    expect(parseLocale("xx")).toBe("it");
    expect(parseLocale(undefined)).toBe("it");
    expect(parseLocale(42)).toBe("it");
  });
});

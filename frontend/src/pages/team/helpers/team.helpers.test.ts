import {
  countExternalConnections,
  isExternalConnection,
  resolveConnectionOrigin,
} from "@/pages/team/helpers/team.helpers";
import type { CompanyConnectedClient } from "@/pages/team/types/team.types";
import { describe, expect, test } from "vitest";

const UNKNOWN_ADDRESS = "No address on record";

function connection(redirectUris: string[]): CompanyConnectedClient {
  return {
    id: "grant-1",
    clientId: "client-1",
    clientName: "Claude Code",
    redirectUris,
    connectedAt: "2026-08-01T10:00:00.000Z",
    lastUsedAt: null,
    employee: {
      id: "customer-1",
      firstName: "Dana",
      lastName: "Levi",
      email: "dana@example.com",
    },
  };
}

describe("resolveConnectionOrigin", () => {
  test("identifies a connection by host and port", () => {
    expect(resolveConnectionOrigin(connection(["http://localhost:54321/cb"]), UNKNOWN_ADDRESS)).toBe(
      "localhost:54321",
    );
  });

  // A grant outlives its client's registration, and a blank cell would leave the
  // self-reported app name as the only thing naming the connection.
  test("says so when the client registration is gone", () => {
    expect(resolveConnectionOrigin(connection([]), UNKNOWN_ADDRESS)).toBe(UNKNOWN_ADDRESS);
  });
});

describe("isExternalConnection", () => {
  test("treats a loopback address as the person's own machine", () => {
    expect(isExternalConnection(connection(["http://localhost:54321/cb"]))).toBe(false);
    expect(isExternalConnection(connection(["http://127.0.0.1:54321/cb"]))).toBe(false);
  });

  test("treats an internet host as data leaving the company", () => {
    expect(isExternalConnection(connection(["https://aura-cloud-verify.io/cb"]))).toBe(true);
  });

  // Loud, not silent: an address we cannot read is not evidence that it is local.
  test("treats an address it cannot parse as external", () => {
    expect(isExternalConnection(connection(["com.example.app:/cb"]))).toBe(true);
    expect(isExternalConnection(connection([]))).toBe(true);
  });
});

describe("countExternalConnections", () => {
  test("counts only the connections reaching outside the company", () => {
    const grants = [
      connection(["http://localhost:54321/cb"]),
      connection(["https://aura-cloud-verify.io/cb"]),
      connection(["http://localhost:8080/cb"]),
    ];

    expect(countExternalConnections(grants)).toBe(1);
  });

  // The summary sentence names a destination, so an address nobody can read is not one
  // of them — even though the row it sits on is still tagged.
  test("leaves out a connection whose address is unknown", () => {
    const unknown = connection([]);

    expect(isExternalConnection(unknown)).toBe(true);
    expect(countExternalConnections([unknown])).toBe(0);
  });

  test("counts nothing when nobody has connected", () => {
    expect(countExternalConnections([])).toBe(0);
  });
});

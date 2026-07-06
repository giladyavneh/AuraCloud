// This module MUST be the very first import of the entry point.
// ESM executes imports in order, so everything here runs before any other
// module's import-time side effects (e.g. utils' dotenv.config() call).
import dns from "dns";

// IPv4 DNS fix — Node 24 prefers IPv6 which breaks MongoDB Atlas SRV lookups.
// Must precede any network call (same as api-server/src/index.ts).
dns.setServers(["8.8.8.8", "1.1.1.1"]);

// stdout is the MCP stdio protocol channel — reroute all stdout logging to
// stderr (utils/connectMongo console.log's "Mongo Live" and a persistent
// "reconnected" listener would otherwise corrupt the protocol stream).
console.log = console.info = console.debug = (...args: unknown[]): void => {
  console.error(...args);
};

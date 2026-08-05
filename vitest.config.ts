import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Resolve the workspace package to its source, mirroring the tsconfig `paths`.
    // Left alone, tests would run against whatever was last built into utils/dist.
    alias: {
      utils: fileURLToPath(new URL("./utils/src/index.ts", import.meta.url)),
      // Mirrors the frontend's own vite alias, so its helpers keep their `@/` imports.
      "@": fileURLToPath(new URL("./frontend/src", import.meta.url)),
    },
  },
  test: {
    include: ["*/src/**/*.test.ts"],
    // config.ts calls dotenv.config(), so without pinning these a developer's own .env
    // would decide what the tests assert against. JWT_SECRET only has to stay constant
    // within a run, so that a token signed in a test verifies in the same test.
    env: {
      JWT_SECRET: "test-jwt-secret",
      FRONTEND_URL: "http://localhost:5173",
      ISSUER_URL: "http://localhost:3000",
    },
  },
});

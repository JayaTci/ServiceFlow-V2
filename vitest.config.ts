import { defineConfig } from "vitest/config";

/** Vitest configuration for pure unit tests that do not need a browser DOM. */
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: [
      "src/**/*.test.ts",
      "ServiceFlow_v2Backend/tests/**/*.test.ts",
      "ServiceFlow_v2Shared/tests/**/*.test.ts",
    ],
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
      "@frontend": new URL("./ServiceFlow_v2Frontend/src", import.meta.url).pathname,
      "@backend": new URL("./ServiceFlow_v2Backend/src", import.meta.url).pathname,
      "@database": new URL("./ServiceFlow_v2Database/src", import.meta.url).pathname,
      "@shared": new URL("./ServiceFlow_v2Shared/src", import.meta.url).pathname,
    },
  },
});

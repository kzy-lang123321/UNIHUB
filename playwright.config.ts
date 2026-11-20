import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  timeout: 120000,
  workers: 1,
  use: {
    baseURL: "http://localhost:8081",
    channel: process.env.PLAYWRIGHT_CHANNEL,
    viewport: { width: 412, height: 915 },
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "npx expo start --web --port 8081",
      url: "http://localhost:8081",
      reuseExistingServer: true,
      timeout: 120000,
    },
    {
      command: "node scripts/library-ui-harness.mjs",
      url: "http://127.0.0.1:8890",
      reuseExistingServer: true,
      timeout: 30000,
    },
  ],
});

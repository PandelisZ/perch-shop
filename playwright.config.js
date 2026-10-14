import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  reporter: [["list"]],
  use: { baseURL: process.env.SHOP_URL ?? "http://localhost:4173/" },
  webServer: process.env.SHOP_URL
    ? undefined
    : { command: "npm run serve", url: "http://localhost:4173/", reuseExistingServer: true },
});

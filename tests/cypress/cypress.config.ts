import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173",
    specPattern: "cypress/e2e/**/*.cy.{ts,js}",
    supportFile: "cypress/support/e2e.ts",
    viewportWidth: 1440,
    viewportHeight: 900,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 8000,
    requestTimeout: 15000,
    retries: {
      runMode: 1,
      openMode: 0,
    },
    env: {
      apiUrl: "http://localhost:8080/api/v1",
    },
    setupNodeEvents(_on, config) {
      // place for plugins; keep empty to avoid extra deps in academic project
      return config;
    },
  },
});

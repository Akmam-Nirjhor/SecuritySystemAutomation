const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "https://192.168.10.227",
    specPattern: "cypress/e2e/**/*.cy.js",
    experimentalOriginDependencies: true, // lets cy.origin() use Cypress.require() for page objects
    chromeWebSecurity: false, // app (https) and Keycloak (http:9080) are different origins
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 60000,
    retries: { runMode: 1, openMode: 0 },
    video: false,
    screenshotOnRunFailure: true,
    expose: {
      keycloakOrigin: "http://192.168.10.227:9080",
      realm: "MicroCube_QA",
    },
    setupNodeEvents(on, config) {
      on("task", {
        // Reads the first sheet of an .xlsx file and returns its rows as objects
        // keyed by the header row, e.g. [{ username: "...", password: "..." }]
        // Pass a path string (first sheet) or { filePath, sheet } to pick a sheet by name.
        readExcel(arg) {
          const XLSX = require("xlsx");
          const { filePath, sheet: sheetName, keyValue } =
            typeof arg === "string" ? { filePath: arg } : arg;
          const workbook = XLSX.readFile(filePath);
          const name = sheetName || workbook.SheetNames[0];
          const sheet = workbook.Sheets[name];
          if (!sheet) {
            throw new Error(
              `Sheet "${name}" not found in ${filePath}. Available: ${workbook.SheetNames.join(", ")}`
            );
          }
          if (keyValue) {
            // Vertical layout: column A = field label, column B = value.
            // Returns { "User ID *": "231", ... } using the cells' displayed text.
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
            return Object.fromEntries(
              rows.filter((r) => r[0] !== undefined).map((r) => [String(r[0]).trim(), r[1]])
            );
          }
          return XLSX.utils.sheet_to_json(sheet);
        },
      });
      return config;
    },
  },
});

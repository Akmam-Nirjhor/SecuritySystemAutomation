/**
 * cy.login(): opens the User App page, which redirects to Keycloak, fills
 * username/password and clicks Sign In (via KeycloakLoginPage). Afterwards the
 * browser is back on the User App page, logged in.
 *
 * No cy.session() here: the launcher app keeps its tokens in memory, so a cached
 * session does not keep it logged in and a second visit lands on the login page.
 * Credentials come from the Excel file (see below).
 */
Cypress.Commands.add("login", (rowIndex = 0) => {
  // Credentials come from the first row of cypress/fixtures/users.xlsx
  // (columns: username, password). Pass a different rowIndex to use another user.
  cy.task("readExcel", "cypress/fixtures/users.xlsx").then((rows) => {
    const { username, password } = rows[rowIndex];
    cy.log(`Logging in as ${username}`);
    cy.visit("/launcher-app/feature/userapp"); // redirects to Keycloak
    cy.origin(
      Cypress.expose("keycloakOrigin"),
      { args: { username, password } },
      ({ username, password }) => {
        const LoginPage = Cypress.require("../pages/KeycloakLoginPage");
        new LoginPage().assertLoaded().login(username, password);
      }
    );
    cy.url({ timeout: 30000 }).should("include", "/launcher-app/feature/userapp");
  });
});

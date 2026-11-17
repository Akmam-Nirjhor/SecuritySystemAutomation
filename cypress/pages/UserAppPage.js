const BasePage = require("./BasePage");

/**
 * Launcher "User App" feature page: /launcher-app/feature/userapp
 * TODO: replace the placeholder selectors below with real data-testid / stable
 * selectors once the page content is known.
 */
class UserAppPage extends BasePage {
  constructor() {
    super("/launcher-app/feature/userapp");
  }

  get root() {
    return cy.get("body");
  }

  assertLoaded() {
    this.assertUrlContains("/launcher-app/feature/userapp");
    this.root.should("be.visible");
    return this;
  }
}

module.exports = UserAppPage;

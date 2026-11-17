const BasePage = require("./BasePage");

/**
 * Sentinel app landing page: /sentinel-app/landing/home
 */
class SentinelHomePage extends BasePage {
  constructor() {
    super("/sentinel-app/landing/home");
  }

  get functionsMenu() {
    return cy.contains("app-sidebar .nav-label", "Functions", { timeout: 30000 });
  }

  assertLoaded() {
    this.assertUrlContains("/sentinel-app/landing/home");
    this.functionsMenu.should("be.visible");
    return this;
  }

  openFunctions() {
    this.functionsMenu.click();
    return this;
  }

  openUserProfileRegistration() {
    cy.contains("[data-function-flyout] *", "User Profile Registration", { timeout: 10000 })
      .should("be.visible")
      .click();
    this.assertUrlContains("/sentinel-app/feature/settings/functions/user-register");
    return this;
  }
}

module.exports = SentinelHomePage;

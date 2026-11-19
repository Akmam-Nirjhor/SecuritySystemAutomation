/**
 * Base class for all page objects. Holds the page path and shared helpers.
 */
const PAGE_SETTLE_MS = 3000;

class BasePage {
  constructor(path = "/") {
    this.path = path;
  }

  visit() {
    cy.visit(this.path);
    return this;
  }

  // Gives a newly opened page time to finish loading (overlays, API calls) before the next step
  settle(ms = PAGE_SETTLE_MS) {
    cy.wait(ms);
    return this;
  }

  // Every page's assertLoaded() goes through here, so each new page gets the settle wait
  assertUrlContains(fragment) {
    cy.url().should("include", fragment);
    return this.settle();
  }
}

module.exports = BasePage;

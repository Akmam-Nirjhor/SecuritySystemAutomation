/**
 * Base class for all page objects. Holds the page path and shared helpers.
 */
class BasePage {
  constructor(path = "/") {
    this.path = path;
  }

  visit() {
    cy.visit(this.path);
    return this;
  }

  assertUrlContains(fragment) {
    cy.url().should("include", fragment);
    return this;
  }
}

module.exports = BasePage;

/**
 * Keycloak login page (realm MicroCube_QA). Lives on a different origin, so its
 * methods must be called from inside cy.origin() — see support/commands.js.
 */
class KeycloakLoginPage {
  get usernameInput() {
    return cy.get("#username");
  }
  get passwordInput() {
    return cy.get("#password");
  }
  get submitButton() {
    return cy.get("button#kc-login[name='login']");
  }
  get errorMessage() {
    return cy.get("#input-error, .kc-feedback-text, .alert-error");
  }

  assertLoaded() {
    this.usernameInput.should("be.visible");
    this.passwordInput.should("be.visible");
    return this;
  }

  login(username, password) {
    this.usernameInput.clear().type(username);
    this.passwordInput.clear().type(password, { log: false });
    this.submitButton.click();
  }
}

module.exports = KeycloakLoginPage;

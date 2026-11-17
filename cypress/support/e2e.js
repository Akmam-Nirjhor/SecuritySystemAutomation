import "./commands";

// Known harmless error thrown by the app's own code (not by the tests). Without this,
// Cypress fails the test the moment the app throws it.
Cypress.on("uncaught:exception", (err) => {
  if (err.message.includes("Element attr did not return a valid number")) {
    return false; // ignore it, keep the test running
  }
  // any other app error still fails the test
});

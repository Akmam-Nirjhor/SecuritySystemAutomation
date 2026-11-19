const { startRecording } = require("../support/recorder");

/**
 * NOT a real test. Run it, then do the whole flow BY HAND in the browser window it opens:
 * register a user, go to Approval Flow, approve it, then look the user up on the registration page.
 * Every backend call is saved to cypress/downloads/manual-traffic.json (every 10 s, for 10 minutes).
 * Close the runner when you are done.
 */
describe("Record manual flow", { testIsolation: false }, () => {
  it("records the API calls while you register and approve by hand", () => {
    cy.login();
    const rec = startRecording();
    cy.visit("/sentinel-app/landing/home");
    for (let i = 0; i < 60; i++) {
      cy.wait(10000);
      rec.save("cypress/downloads/manual-traffic.json");
    }
  });
});

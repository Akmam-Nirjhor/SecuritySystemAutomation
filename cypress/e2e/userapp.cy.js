const UserAppPage = require("../pages/UserAppPage");
const SentinelHomePage = require("../pages/SentinelHomePage");
const UserRegisterPage = require("../pages/UserRegisterPage");
const ApprovalFlowPage = require("../pages/ApprovalFlowPage");
const { startRecording } = require("../support/recorder");

// testIsolation: false keeps the browser session (Keycloak cookie) between the tests,
// so we log in once in before() instead of once per test.
describe("Launcher - User App", { testIsolation: false }, () => {
  const userAppPage = new UserAppPage();
  const sentinelHomePage = new SentinelHomePage();
  const userRegisterPage = new UserRegisterPage();
  const approvalFlowPage = new ApprovalFlowPage();

  let recorder = null;

  before(() => {
    cy.login(); // once for the whole spec; ends on the User App page, logged in
  });

  // Also runs when a test fails, so the traffic up to the failure is always saved
  afterEach(() => {
    if (recorder) recorder.save("cypress/downloads/automation-traffic.json");
  });

  it("opens the User App page after login", () => {
    userAppPage.assertLoaded();
  });

  it("opens User Profile Registration from Functions", () => {
    sentinelHomePage.visit().assertLoaded().openFunctions().openUserProfileRegistration();
    cy.contains("h1", "User Profile Registration").should("be.visible");
  });

  it("fills User Profile Registration from the Excel sheet", () => {
    // The previous test already left us on the registration page: do not load it a second time
    cy.location("pathname").then((path) => {
      if (!path.includes("/functions/user-register")) {
        sentinelHomePage.visit().assertLoaded().openFunctions().openUserProfileRegistration();
      }
    });
    cy.contains("h1", "User Profile Registration").should("be.visible");

    // Sheet layout: column A = field label, column B = value
    cy.task("readExcel", {
      filePath: "cypress/fixtures/users.xlsx",
      sheet: "UserProfileRegistration",
      keyValue: true,
    }).then((sheet) => {
      // DEBUG: record every backend call of this run (compare with manual-traffic.json)
      recorder = startRecording();
      cy.intercept("POST", "**/User/Register").as("register");
      cy.intercept("GET", "**/User/UserExistByEmail*").as("emailExists");
      cy.intercept("GET", "**/User/UserExistByEmployeeId*").as("employeeExists");
      userRegisterPage.fillFromSheet(sheet);
      // DEBUG: what the app's own "already exists?" checks answered for this email / employee id
      cy.get("@emailExists.all").then((calls) => {
        cy.get("@employeeExists.all").then((emp) => {
          const last = (c) => (c.length ? { url: c[c.length - 1].request.url, status: c[c.length - 1].response?.statusCode, body: c[c.length - 1].response?.body } : null);
          const result = { email: last(calls), employeeId: last(emp) };
          cy.writeFile("cypress/downloads/exist-checks.json", result);
          // Guard 1: stop BEFORE saving if the app says the email / employee id is already taken.
          // (Saving anyway shows "Save Successful", but the user is never created later.)
          const taken = (r) => r && (r.body === true || r.body?.exists === true || String(r.body).toLowerCase() === "true");
          expect(taken(result.email), `email already exists in the system: ${userRegisterPage.toRow(sheet).emailId} (change it in Excel)`).to.not.eq(true);
          expect(taken(result.employeeId), "employee id already exists in the system (change it in Excel)").to.not.eq(true);
        });
      });
      userRegisterPage.save();
      cy.wait("@register").then(({ request, response }) => {
        // the server says "successful" even when fields are empty, so check what was really sent
        const expected = userRegisterPage.toRow(sheet);
        ["businessHourStart", "businessHourEnd"].forEach((k) => {
          if (expected[k]) expect(request.body[k], `${k} sent to server`).to.eq(expected[k]);
        });
        cy.writeFile("cypress/downloads/register-request.json", {
          body: request.body,
          status: response && response.statusCode,
          response: response && response.body,
        });
      });

      // After saving, open Approval Flow from the sidebar (we start on the register page,
      // so the URL really changes and this proves the click worked)
      // Registration is complete: give the backend 3 seconds to create the approval request
      userRegisterPage.settle();
      approvalFlowPage.watchPendingItems();
      sentinelHomePage.openApprovalFlow();
      // URL check only (+3 s wait): the "Approval Flow Items" heading may already be gone if the
      // app opens the request by itself, and viewItemFor() verifies "Process Approval" anyway.
      approvalFlowPage.assertUrlContains("/poc/approval-flow-items");
      approvalFlowPage.viewItemFor(userRegisterPage.toRow(sheet).userId);

      // The Process Approval page must show exactly what we registered, then approve it
      userRegisterPage.assertMatchesRow(userRegisterPage.toRow(sheet));
      // DEBUG: capture the approval request/response, to compare with a manual approval
      cy.intercept("POST", "**/Approval/Sets/*/Decisions").as("decision");
      approvalFlowPage.approve();
      cy.wait("@decision").then(({ request, response }) => {
        cy.writeFile("cypress/downloads/decision-request.json", {
          url: request.url,
          body: request.body,
          status: response && response.statusCode,
          response: response && response.body,
        });
      });

      // Guard 2: the user must really exist after approval. Open the registration page and look
      // the User ID up the same way the app does; a 400/404 here fails the test with the reason.
      sentinelHomePage.openFunctions().openUserProfileRegistration();
      userRegisterPage.assertUserRegistered(userRegisterPage.toRow(sheet).userId);
    });
  });
});

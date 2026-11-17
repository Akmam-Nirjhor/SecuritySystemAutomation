const UserAppPage = require("../pages/UserAppPage");
const SentinelHomePage = require("../pages/SentinelHomePage");
const UserRegisterPage = require("../pages/UserRegisterPage");
const ApprovalFlowPage = require("../pages/ApprovalFlowPage");

describe("Launcher - User App", () => {
  const userAppPage = new UserAppPage();
  const sentinelHomePage = new SentinelHomePage();
  const userRegisterPage = new UserRegisterPage();
  const approvalFlowPage = new ApprovalFlowPage();

  beforeEach(() => {
    cy.login(); // ends on the User App page, logged in
  });

  it("opens the User App page after login", () => {
    userAppPage.assertLoaded();
  });

  it("opens User Profile Registration from Functions", () => {
    sentinelHomePage.visit().assertLoaded().openFunctions().openUserProfileRegistration();
    cy.contains("h1", "User Profile Registration").should("be.visible");
  });

  it("fills User Profile Registration from the Excel sheet", () => {
    sentinelHomePage.visit().assertLoaded().openFunctions().openUserProfileRegistration();
    userRegisterPage.assertLoaded();

    // Sheet layout: column A = field label, column B = value
    cy.task("readExcel", {
      filePath: "cypress/fixtures/users.xlsx",
      sheet: "UserProfileRegistration",
      keyValue: true,
    }).then((sheet) => {
      userRegisterPage.fillFromSheet(sheet);
      userRegisterPage.save();

      // After saving, open Approval Flow from the sidebar (we start on the register page,
      // so the URL really changes and this proves the click worked)
      sentinelHomePage.openApprovalFlow();
      approvalFlowPage.assertLoaded().viewFirstItem();

      // The Process Approval page must show exactly what we registered, then approve it
      userRegisterPage.assertMatchesRow(userRegisterPage.toRow(sheet));
      approvalFlowPage.approve();
    });
  });
});

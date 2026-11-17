const UserAppPage = require("../pages/UserAppPage");
const SentinelHomePage = require("../pages/SentinelHomePage");
const UserRegisterPage = require("../pages/UserRegisterPage");

describe("Launcher - User App", () => {
  const userAppPage = new UserAppPage();
  const sentinelHomePage = new SentinelHomePage();
  const userRegisterPage = new UserRegisterPage();

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
    });
    userRegisterPage.save();
  });
});

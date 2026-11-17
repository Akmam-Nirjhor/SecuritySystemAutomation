const BasePage = require("./BasePage");

/**
 * Sentinel > Functions > User Profile Registration
 * /sentinel-app/feature/settings/functions/user-register
 *
 * Excel column -> input selector (Angular `controlname` attribute where known).
 */
const FIELDS = {
  userId: "input[controlname='userNm']", // placeholder "Enter User ID"
  firstName: "input[placeholder='Enter First Name']", // TODO: confirm its controlname
  lastName: "input[controlname='lastName']",
  employeeId: "input[controlname='employeeId']",
  emailId: "input[controlname='userEmailId']",
  mobileNo: "input[controlname='mobileNumber']",
  businessHour: "input[controlname='businessHour']",
  sessionExpiredTime: "input[controlname='sessionExpTime']",
  userExpiryDate: "input[controlname='userExpiryDate']",
};

// Excel label (column A, without the trailing "*", lower-cased) -> field key above
const LABELS = {
  "user id": "userId",
  "first name": "firstName",
  "last name": "lastName",
  "office id": "officeId",
  "employee id": "employeeId",
  "email id": "emailId",
  "mobile no": "mobileNo",
  "business hour": "businessHour",
  "session expired time": "sessionExpiredTime",
  "user expiry date": "userExpiryDate",
  "user terminal ip": "userTerminalIp",
  "upload image": "photo", // file name inside cypress/fixtures/images/, e.g. john.jpg
};

/** Turns the { "User ID *": "231", ... } sheet object into { userId: "231", ... }. */
function rowFromSheet(sheet) {
  const row = {};
  Object.entries(sheet).forEach(([label, value]) => {
    const key = LABELS[label.replace(/\*/g, "").trim().toLowerCase()];
    if (key) row[key] = value;
  });
  // 12122026 -> 12-12-2026 (datepicker placeholder is DD-MM-YYYY)
  if (/^\d{8}$/.test(String(row.userExpiryDate || "").trim())) {
    const d = String(row.userExpiryDate).trim();
    row.userExpiryDate = `${d.slice(0, 2)}-${d.slice(2, 4)}-${d.slice(4)}`;
  }
  return row;
}

const OFFICE ="input[controlname='officeId']";
const TERMINAL_IP = "input[controlname='userTerminalIpInput']";
const PHOTO_INPUT = "input[type='file']"; // TODO: narrow with controlname if the page has several file inputs
const ADD_BUTTON = "button[aria-label='ADD']";
const SAVE_BUTTON = "#btn-action-save";

const hasValue = (v) => v !== undefined && v !== null && String(v).trim() !== "";

class UserRegisterPage extends BasePage {
  constructor() {
    super("/sentinel-app/feature/settings/functions/user-register");
  }

  assertLoaded() {
    this.assertUrlContains("/functions/user-register");
    cy.contains("h1", "User Profile Registration").should("be.visible");
    return this;
  }

  /** Fills the form from the label/value sheet object. Empty cells are skipped. */
  fillFromSheet(sheet) {
    return this.fillFromRow(rowFromSheet(sheet));
  }

  /** Converts the sheet object into { firstName, lastName, ... } (e.g. to compare later). */
  toRow(sheet) {
    return rowFromSheet(sheet);
  }

  /**
   * On a page that shows the same form (e.g. Process Approval), checks every field holds the
   * value we registered (User ID included: it comes from the Excel sheet).
   */
  assertMatchesRow(row) {
    Object.entries(FIELDS).forEach(([column, selector]) => {
      if (!hasValue(row[column])) return;
      cy.get(selector, { timeout: 15000 }).should("have.value", String(row[column]).trim());
    });
    const office = hasValue(row.officeId) ? String(row.officeId).trim() : "Head office";
    cy.get(OFFICE).invoke("val").should("contain", office);
    return this;
  }

  /** Fills the form from one { userId, firstName, ... } object. */
  fillFromRow(row) {
    Object.entries(FIELDS).forEach(([column, selector]) => {
      if (!hasValue(row[column])) return;
      // scrollIntoView + force: the field can be partly clipped by the form's scroll area
      cy.get(selector, { timeout: 15000 })
        .scrollIntoView()
        .clear({ force: true })
        .type(String(row[column]).trim(), { force: true });
    });

    // Office ID cell empty -> pick "Head office" from the dropdown
    this.selectOffice(hasValue(row.officeId) ? String(row.officeId).trim() : "Head office");
    if (hasValue(row.userTerminalIp)) this.addTerminalIp(String(row.userTerminalIp).trim());
    if (hasValue(row.photo)) this.uploadPhoto(String(row.photo).trim());
    return this;
  }

  // Uploads cypress/fixtures/images/<fileName>. Update the Excel "Photo" cell to change the image.
  uploadPhoto(fileName) {
    const path = `cypress/fixtures/images/${fileName}`;
    cy.readFile(path, null, { log: false }).should("exist"); // clear failure if the file is missing
    cy.get(PHOTO_INPUT).selectFile(path, { force: true }); // file inputs are often hidden
    return this;
  }

  // No typing: opens the dropdown and clicks the option whose text contains `text`.
  // Options look like "0001 - Head office" (div.dropdown-option > span.option-label).
  selectOffice(text) {
    // 30s: a loading overlay can cover the form for a while; click retries until it is gone
    cy.get(OFFICE, { timeout: 30000 }).click({ timeout: 30000 });
    cy.contains(".dropdown-menu .dropdown-option .option-label", text, { timeout: 10000 })
      .should("be.visible")
      .click();
    return this;
  }

  addTerminalIp(ip) {
    cy.get(TERMINAL_IP).clear().type(ip);
    cy.get(ADD_BUTTON).should("not.be.disabled").click(); // enabled only for a valid IP
    return this;
  }

  save() {
    cy.get(SAVE_BUTTON).click();
    return this;
  }
}

module.exports = UserRegisterPage;

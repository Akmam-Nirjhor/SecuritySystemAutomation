const BasePage = require("./BasePage");

/**
 * Sentinel > Approval Flow > Approval Flow Items
 * /sentinel-app/poc/approval-flow-items
 */
const VIEW_BUTTON = "button.action-btn.view-btn"; // the eye icon in the Actions column
const APPROVE_BUTTON = "button[aria-label='Approve']"; // on the Process Approval page

class ApprovalFlowPage extends BasePage {
  constructor() {
    super("/sentinel-app/poc/approval-flow-items");
  }

  assertLoaded() {
    this.assertUrlContains("/poc/approval-flow-items");
    cy.contains("Approval Flow Items").should("be.visible");
    return this;
  }

  /** Clicks the View (eye) button of the first row in the list (the newest request). */
  viewFirstItem() {
    cy.get(VIEW_BUTTON, { timeout: 15000 }).first().should("be.visible").click();
    cy.contains("Process Approval", { timeout: 15000 }).should("be.visible");
    return this;
  }

  approve() {
    cy.get(APPROVE_BUTTON).should("be.visible").click();
    return this;
  }
}

module.exports = ApprovalFlowPage;

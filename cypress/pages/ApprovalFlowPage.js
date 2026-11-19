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
    return this.settle(); // new page: let the form data load
  }

  /**
   * Opens the request of the user we just registered: the row whose text contains the User ID
   * (the list is not sorted newest-first, so "first row" can be an older pending request).
   */
  viewItemFor(userId) {
    const id = String(userId).trim();
    // The list data tells us which row is ours; the grid numbers its buttons by row index
    cy.wait("@pendingItems", { timeout: 30000 }).then(({ response }) => {
      const body = response && response.body;
      const items = Array.isArray(body)
        ? body
        : Object.values(body || {}).find((v) => Array.isArray(v)) || [];
      // The list items do not contain the User ID (only setId, displayName, actionType, ...).
      // Our request is the newest one: the highest setId. The Process Approval page assertion
      // that follows checks the User ID, so a wrong pick fails there instead of approving it.
      // Only pending "Register User Profile" CREATE requests are candidates.
      let index = -1;
      items.forEach((item, i) => {
        const candidate =
          item.actionType === "CREATE" &&
          item.approveFlag === "PENDING" &&
          /register user profile/i.test(item.displayName || "");
        if (candidate && (index < 0 || Number(item.setId) > Number(items[index].setId))) index = i;
      });
      expect(index, `a pending item in the list (${items.length} items)`).to.be.gte(0);
      cy.log(`Opening newest request: setId ${items[index].setId} (row ${index}) for User ID ${id}`);
      // If the app has already opened a request page by itself, there is no list to click in
      cy.location("pathname").then((path) => {
        if (path.includes("/approval-flow-movement/")) {
          cy.log(`App already opened ${path}; not clicking the list`);
          return;
        }
        cy.get(`#grid-approval-flow-items-row-i${index}-view`, { timeout: 15000 })
          .scrollIntoView()
          .click();
      });
    });
    cy.contains("Process Approval", { timeout: 15000 }).should("be.visible");
    return this.settle();
  }

  /** Call BEFORE opening the list, so the list request can be inspected by viewItemFor(). */
  watchPendingItems() {
    cy.intercept("GET", "**/Changeboard/Approval/Items?view=PENDING*").as("pendingItems");
    return this;
  }

  approve() {
    // The button can sit below the fold / inside a scroll area, so scroll to it first
    cy.get(APPROVE_BUTTON, { timeout: 15000 })
      .scrollIntoView()
      .should("not.be.disabled")
      .click({ force: true }); // force: a sticky footer / overlay can cover it and block a normal click
    // Approval is done when the app sends the decision and leaves the Process Approval page
    cy.location("pathname", { timeout: 20000 }).should("include", "/poc/approval-flow-items");
    return this;
  }
}

module.exports = ApprovalFlowPage;

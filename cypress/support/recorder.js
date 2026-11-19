/**
 * Records every call the app makes to the backend (port 9999): method, url, request body,
 * status and response body. Used to compare a manual run with the automated one.
 *
 *   const rec = startRecording();   // call once, before the actions you want to record
 *   rec.save("cypress/downloads/x.json");
 */
function summarize(body) {
  if (body === undefined || body === null) return null;
  if (typeof body === "object" && !(body instanceof ArrayBuffer) && !ArrayBuffer.isView(body)) {
    const s = JSON.stringify(body);
    return s.length > 1500 ? `${s.slice(0, 1500)}…(truncated)` : body;
  }
  const s = typeof body === "string" ? body : `[binary ${body.byteLength || body.length || "?"} bytes]`;
  return s.length > 1500 ? `${s.slice(0, 1500)}…(truncated)` : s;
}

function startRecording() {
  const calls = [];
  // Passive: only observes. The specific cy.intercept() aliases in the specs keep working.
  cy.intercept({ url: "**:9999/**" }, (req) => {
    const entry = { time: new Date().toISOString(), method: req.method, url: req.url, body: summarize(req.body) };
    calls.push(entry);
    req.on("response", (res) => {
      entry.status = res.statusCode;
      entry.response = summarize(res.body);
    });
  });
  return { calls, save: (file) => cy.writeFile(file, calls) };
}

module.exports = { startRecording };

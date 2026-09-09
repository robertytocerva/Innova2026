import test from "node:test";
import assert from "node:assert/strict";

process.env.DATABASE_URL ||= "postgres://user:pass@localhost/db";
const { evaluateComparison } = await import("../src/services/rule-engine.service.js");
const { verdictFromMapStatus } = await import("../src/services/comparison.service.js");

const clean = {
  forestLossPct: 0.2,
  forestStatus: "pass",
  fireDetected: false,
  fireStatus: "pass",
  anpOverlap: false,
  anpOverlapPct: 0,
  anpStatus: "pass",
};

test("returns cumple when all indicators pass", () => {
  assert.equal(evaluateComparison(clean).verdict, "cumple");
});

test("returns no cumple when a critical indicator fails", () => {
  assert.equal(evaluateComparison({ ...clean, forestLossPct: 2, forestStatus: "fail" }).verdict, "no cumple");
});

test("marks the boundary band for review", () => {
  const result = evaluateComparison({ ...clean, forestLossPct: 0.9 });
  assert.equal(result.verdict, "requiere revision");
  assert.equal(result.boundaryFlag, true);
});

test("does not treat unavailable sources as compliant", () => {
  const result = evaluateComparison({ ...clean, anpOverlap: null, anpOverlapPct: null, anpStatus: "unknown" });
  assert.equal(result.verdict, "requiere revision");
});

test("maps every interactive map state to the matching report verdict", () => {
  assert.equal(verdictFromMapStatus("aprobada"), "cumple");
  assert.equal(verdictFromMapStatus("bloqueada"), "no cumple");
  assert.equal(verdictFromMapStatus("en_revision"), "requiere revision");
});

"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const GiftExchange = require("../assignment.js");

function cycleLength(assignment) {
  const edges = new Map(
    assignment.map((row) => [row.giver, row.recipient])
  );
  const start = assignment[0].giver;
  const visited = [start];
  let current = edges.get(start);

  while (current !== start) {
    visited.push(current);
    current = edges.get(current);
  }

  return visited.length;
}

function fastRandomInt(maxExclusive) {
  return Math.floor(Math.random() * maxExclusive);
}

test("prepare trims lines and drops blank ones", () => {
  const result = GiftExchange.prepare("  Alice  \n\n   \nBob \n");

  assert.equal(result.ok, true);
  assert.deepEqual(result.names, ["Alice", "Bob"]);
});

test("prepare preserves internal spacing and punctuation", () => {
  const result = GiftExchange.prepare("Mary Jane O'Neil");

  assert.equal(result.ok, true);
  assert.deepEqual(result.names, ["Mary Jane O'Neil"]);
});

test("prepare rejects names that differ only by case", () => {
  const result = GiftExchange.prepare("Alice\nalice\nCarol");

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "DUPLICATE");
  assert.match(result.error.message, /Alice/);
  assert.match(result.error.message, /more than once/);
});

test("prepare accepts distinct names", () => {
  const result = GiftExchange.prepare("Alice\nAlicia\nCarol");

  assert.equal(result.ok, true);
  assert.deepEqual(result.names, ["Alice", "Alicia", "Carol"]);
});

test("generate rejects one participant with a count-aware message", () => {
  const result = GiftExchange.generate(["Alice"]);

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "TOO_FEW");
  assert.match(result.error.message, /at least 3 names/i);
  assert.match(result.error.message, /you have 1/);
});

test("generate rejects two participants with a count-aware message", () => {
  const result = GiftExchange.generate(["Alice", "Bob"]);

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "TOO_FEW");
  assert.match(result.error.message, /at least 3 names/i);
  assert.match(result.error.message, /you have 2/);
});

test("generate accepts three participants as one cycle with a warning", () => {
  const names = ["Alice", "Bob", "Carol"];
  const result = GiftExchange.generate(names);

  assert.equal(result.ok, true);
  assert.equal(result.assignment.length, 3);
  assert.equal(cycleLength(result.assignment), 3);
  assert.match(result.warning, /easy to guess/i);
  assert.equal(GiftExchange.verify(names, result.assignment).ok, true);
});

function assertValidAssignment(names, assignment) {
  assert.equal(assignment.length, names.length, "one row per participant");

  const givers = new Set();
  const recipients = new Set();
  const edges = new Map();

  for (const row of assignment) {
    assert.ok(names.includes(row.giver), "unknown giver: " + row.giver);
    assert.ok(names.includes(row.recipient), "unknown recipient: " + row.recipient);
    givers.add(row.giver);
    recipients.add(row.recipient);
    edges.set(row.giver, row.recipient);
  }

  assert.equal(givers.size, names.length, "every participant gives once");
  assert.equal(recipients.size, names.length, "every participant receives once");

  for (const name of names) {
    const recipient = edges.get(name);
    assert.notEqual(recipient, name, "self-assignment for " + name);
    assert.notEqual(
      edges.get(recipient),
      name,
      "two-person pair between " + name + " and " + recipient
    );
  }
}

for (let n = 4; n <= 30; n++) {
  test("invariants hold across 10,000 assignments for n=" + n, () => {
    const names = Array.from({ length: n }, (_, i) => "Person " + (i + 1));

    for (let i = 0; i < 10000; i++) {
      const result = GiftExchange.generate(names, { randomInt: fastRandomInt });
      assert.equal(result.ok, true, "generation failed on trial " + i);
      assertValidAssignment(names, result.assignment);
    }
  });
}

test("n=4 reaches all six valid assignments without gross skew", () => {
  const names = ["Alice", "Bob", "Carol", "Dave"];
  const counts = new Map();

  for (let i = 0; i < 10000; i++) {
    const result = GiftExchange.generate(names, { randomInt: fastRandomInt });
    assert.equal(result.ok, true);
    const signature = result.assignment.map((row) => row.recipient).join(">");
    counts.set(signature, (counts.get(signature) || 0) + 1);
  }

  assert.equal(counts.size, 6, "all six valid four-person assignments appear");

  for (const [signature, count] of counts) {
    assert.ok(
      count > 1000 && count < 2400,
      "grossly skewed frequency for " + signature + ": " + count
    );
  }
});

test("an invalid-only random source trips the attempt limit", () => {
  const result = GiftExchange.generate(["A", "B", "C", "D"], {
    randomInt: (max) => max - 1,
    attemptLimit: 25,
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "RETRY_LIMIT");
  assert.equal(result.assignment, undefined);
});

test("verify rejects a tampered self-assignment", () => {
  const names = ["A", "B", "C", "D"];
  const valid = GiftExchange.generate(names);
  const tampered = valid.assignment.map((row, index) =>
    index === 0 ? { giver: row.giver, recipient: row.giver } : row
  );

  const checked = GiftExchange.verify(names, tampered);
  assert.equal(checked.ok, false);
  assert.ok(checked.reasons.length > 0);
});

test("verify rejects a tampered two-person pair", () => {
  const names = ["A", "B", "C", "D"];
  const tampered = [
    { giver: "A", recipient: "B" },
    { giver: "B", recipient: "A" },
    { giver: "C", recipient: "D" },
    { giver: "D", recipient: "C" },
  ];

  const checked = GiftExchange.verify(names, tampered);
  assert.equal(checked.ok, false);
  assert.ok(
    checked.reasons.some((reason) => /assigned to each other/.test(reason))
  );
});

test("core runs without a browser document", () => {
  assert.equal(typeof globalThis.document, "undefined");
  const result = GiftExchange.generate(["A", "B", "C", "D"]);

  assert.equal(result.ok, true);
  assertValidAssignment(["A", "B", "C", "D"], result.assignment);
});

(function (root, factory) {
  "use strict";

  var api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.GiftExchange = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var ATTEMPT_LIMIT = 10000;
  var STORAGE_KEY = "gift-exchange.names.v1";
  var cryptoSource =
    typeof globalThis !== "undefined" && globalThis.crypto
      ? globalThis.crypto
      : null;

  function makeError(code, message) {
    return { code: code, message: message };
  }

  function prepare(rawText) {
    var text = typeof rawText === "string" ? rawText : "";
    var lines = text.split(/\r?\n/);
    var names = [];
    var seen = Object.create(null);

    for (var i = 0; i < lines.length; i++) {
      var name = lines[i].trim();
      if (!name) {
        continue;
      }

      var key = name.toLowerCase();
      if (seen[key]) {
        return {
          ok: false,
          error: makeError(
            "DUPLICATE",
            '"' +
              seen[key] +
              '" appears more than once. Each participant must have a unique name (names are compared ignoring case).'
          ),
        };
      }

      seen[key] = name;
      names.push(name);
    }

    return { ok: true, names: names };
  }

  function randomInt(maxExclusive) {
    if (cryptoSource && typeof cryptoSource.getRandomValues === "function") {
      var buffer = new Uint32Array(1);
      var limit = Math.floor(4294967296 / maxExclusive) * maxExclusive;
      var value;

      do {
        cryptoSource.getRandomValues(buffer);
        value = buffer[0];
      } while (value >= limit);

      return value % maxExclusive;
    }

    return Math.floor(Math.random() * maxExclusive);
  }

  function shuffle(items, drawInt) {
    for (var i = items.length - 1; i > 0; i--) {
      var j = drawInt(i + 1);
      var swap = items[i];
      items[i] = items[j];
      items[j] = swap;
    }

    return items;
  }

  function isValidPermutation(permutation) {
    var n = permutation.length;

    if (n < 3) {
      return false;
    }

    var used = new Array(n);

    for (var i = 0; i < n; i++) {
      var recipient = permutation[i];
      if (
        !Number.isInteger(recipient) ||
        recipient < 0 ||
        recipient >= n ||
        recipient === i ||
        used[recipient]
      ) {
        return false;
      }
      used[recipient] = true;
    }

    for (var j = 0; j < n; j++) {
      if (permutation[permutation[j]] === j) {
        return false;
      }
    }

    return true;
  }

  function verify(names, assignment) {
    var reasons = [];

    if (!Array.isArray(names) || !Array.isArray(assignment)) {
      return { ok: false, reasons: ["Assignment data is missing."] };
    }

    if (names.length < 3) {
      reasons.push("At least three participants are required.");
    }

    if (assignment.length !== names.length) {
      reasons.push("The assignment must contain one row per participant.");
    }

    var giverCounts = Object.create(null);
    var recipientCounts = Object.create(null);
    var edges = Object.create(null);

    for (var i = 0; i < assignment.length; i++) {
      var row = assignment[i];

      if (
        !row ||
        typeof row.giver !== "string" ||
        typeof row.recipient !== "string"
      ) {
        reasons.push("Every row must name a giver and a recipient.");
        continue;
      }

      if (giverCounts[row.giver]) {
        reasons.push('"' + row.giver + '" appears more than once as a giver.');
      }
      giverCounts[row.giver] = true;

      if (recipientCounts[row.recipient]) {
        reasons.push(
          '"' + row.recipient + '" appears more than once as a recipient.'
        );
      }
      recipientCounts[row.recipient] = true;

      edges[row.giver] = row.recipient;
    }

    for (var j = 0; j < names.length; j++) {
      var name = names[j];
      var recipient = edges[name];

      if (!giverCounts[name]) {
        reasons.push('"' + name + '" has no assignment.');
      }

      if (!recipientCounts[name]) {
        reasons.push('"' + name + '" receives nothing.');
      }

      if (recipient === name) {
        reasons.push('"' + name + '" is assigned to themselves.');
      } else if (
        recipient &&
        edges[recipient] === name &&
        String(name) < String(recipient)
      ) {
        reasons.push(
          '"' + name + '" and "' + recipient + '" are assigned to each other.'
        );
      }
    }

    var unique = [];
    var reported = Object.create(null);

    for (var k = 0; k < reasons.length; k++) {
      if (!reported[reasons[k]]) {
        reported[reasons[k]] = true;
        unique.push(reasons[k]);
      }
    }

    return { ok: unique.length === 0, reasons: unique };
  }

  function generate(names, options) {
    options = options || {};

    var drawInt =
      typeof options.randomInt === "function" ? options.randomInt : randomInt;
    var attemptLimit =
      typeof options.attemptLimit === "number" && options.attemptLimit > 0
        ? options.attemptLimit
        : ATTEMPT_LIMIT;

    if (!Array.isArray(names)) {
      return {
        ok: false,
        error: makeError("TOO_FEW", "Need at least 3 names, you have 0."),
      };
    }

    var n = names.length;

    if (n < 3) {
      return {
        ok: false,
        error: makeError(
          "TOO_FEW",
          "Need at least 3 names, you have " + n + "."
        ),
      };
    }

    for (var attempt = 0; attempt < attemptLimit; attempt++) {
      var indices = [];

      for (var i = 0; i < n; i++) {
        indices.push(i);
      }

      shuffle(indices, drawInt);

      if (!isValidPermutation(indices)) {
        continue;
      }

      var assignment = [];

      for (var giver = 0; giver < n; giver++) {
        assignment.push({
          giver: names[giver],
          recipient: names[indices[giver]],
        });
      }

      var checked = verify(names, assignment);

      if (!checked.ok) {
        return {
          ok: false,
          error: makeError(
            "VERIFY_FAILED",
            "The generated assignment could not be verified: " +
              checked.reasons.join(" ")
          ),
        };
      }

      var result = { ok: true, assignment: assignment };

      if (n === 3) {
        result.warning =
          "With only 3 people, each person's recipient is easy to guess.";
      }

      return result;
    }

    return {
      ok: false,
      error: makeError(
        "RETRY_LIMIT",
        "Could not generate a valid assignment after " +
          attemptLimit +
          " attempts. Please try again."
      ),
    };
  }

  return {
    prepare: prepare,
    generate: generate,
    verify: verify,
    ATTEMPT_LIMIT: ATTEMPT_LIMIT,
    STORAGE_KEY: STORAGE_KEY,
  };
});

(function () {
  "use strict";

  var GiftExchange = window.GiftExchange;
  var status = document.getElementById("status");

  if (!GiftExchange) {
    if (status) {
      status.textContent = "The assignment engine failed to load.";
      status.className = "status error";
    }
    return;
  }

  var form = document.getElementById("names-form");
  var namesField = document.getElementById("names");
  var result = document.getElementById("result");
  var resultHeading = document.getElementById("result-heading");
  var list = document.getElementById("assignment-list");
  var showAllButton = document.getElementById("show-all");
  var copyButton = document.getElementById("copy");
  var printButton = document.getElementById("print");
  var manualCopy = document.getElementById("manual-copy");

  var state = {
    assignment: [],
    entries: [],
  };

  function setStatus(message, kind) {
    status.textContent = message;
    status.className = kind ? "status " + kind : "status";
  }

  function saveNames(value) {
    try {
      window.localStorage.setItem(GiftExchange.STORAGE_KEY, value);
    } catch (error) {
      // Persistence is optional; the app keeps working without it.
    }
  }

  function restoreNames() {
    try {
      var saved = window.localStorage.getItem(GiftExchange.STORAGE_KEY);
      if (saved) {
        namesField.value = saved;
      }
    } catch (error) {
      // Reading storage is optional; start with an empty field.
    }
  }

  function assignmentText(assignment) {
    return assignment
      .map(function (row) {
        return row.giver + " gives to " + row.recipient;
      })
      .join("\n");
  }

  function setEntryRevealed(entry, revealed) {
    entry.recipient.hidden = !revealed;
    entry.button.setAttribute("aria-expanded", String(revealed));
  }

  function updateShowAll() {
    var allShown =
      state.entries.length > 0 &&
      state.entries.every(function (entry) {
        return !entry.recipient.hidden;
      });

    showAllButton.setAttribute("aria-pressed", String(allShown));
    showAllButton.textContent = allShown
      ? "Hide all recipients"
      : "Show all recipients";
  }

  function renderAssignment(assignment) {
    list.textContent = "";
    state.entries = [];

    assignment.forEach(function (row, index) {
      var item = document.createElement("li");
      item.className = "assignment-row";

      var button = document.createElement("button");
      button.type = "button";
      button.className = "reveal";
      button.setAttribute("aria-expanded", "false");
      var recipientId = "recipient-" + index;
      button.setAttribute("aria-controls", recipientId);
      button.textContent = row.giver;

      var connector = document.createElement("span");
      connector.className = "gives-to";
      connector.textContent = " gives to ";

      var recipient = document.createElement("span");
      recipient.id = recipientId;
      recipient.className = "recipient";
      recipient.hidden = true;
      recipient.textContent = row.recipient;

      var placeholder = document.createElement("span");
      placeholder.className = "placeholder";
      placeholder.setAttribute("aria-hidden", "true");
      placeholder.textContent = "\u2022\u2022\u2022";

      var entry = { button: button, recipient: recipient };

      button.addEventListener("click", function () {
        setEntryRevealed(entry, entry.recipient.hidden);
        updateShowAll();
      });

      item.appendChild(button);
      item.appendChild(connector);
      item.appendChild(recipient);
      item.appendChild(placeholder);
      list.appendChild(item);
      state.entries.push(entry);
    });

    updateShowAll();
  }

  function clearResult() {
    state.assignment = [];
    state.entries = [];
    list.textContent = "";
    result.hidden = true;
    manualCopy.hidden = true;
    manualCopy.value = "";
  }

  function copyFallback(text) {
    var scratch = document.createElement("textarea");
    scratch.value = text;
    scratch.setAttribute("readonly", "");
    scratch.style.position = "fixed";
    scratch.style.top = "-1000px";
    document.body.appendChild(scratch);
    scratch.select();

    var copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (error) {
      copied = false;
    }

    document.body.removeChild(scratch);
    return copied;
  }

  function finishCopy(success, text) {
    if (success) {
      manualCopy.hidden = true;
      setStatus("Assignment copied to the clipboard.", "success");
      return;
    }

    manualCopy.value = text;
    manualCopy.hidden = false;
    setStatus(
      "Copying is not available in this browser. Select the text below and copy it manually.",
      "error"
    );
    manualCopy.focus();
    manualCopy.select();
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var prepared = GiftExchange.prepare(namesField.value);
    if (!prepared.ok) {
      clearResult();
      setStatus(prepared.error.message, "error");
      namesField.focus();
      return;
    }

    var generated = GiftExchange.generate(prepared.names);
    if (!generated.ok) {
      clearResult();
      setStatus(generated.error.message, "error");
      namesField.focus();
      return;
    }

    state.assignment = generated.assignment;
    renderAssignment(generated.assignment);
    result.hidden = false;

    if (generated.warning) {
      setStatus(generated.warning, "warning");
    } else {
      setStatus(
        "Assignment generated for " + prepared.names.length + " people.",
        "success"
      );
    }

    resultHeading.focus();
  });

  showAllButton.addEventListener("click", function () {
    var allShown = state.entries.every(function (entry) {
      return !entry.recipient.hidden;
    });
    var next = !allShown;

    state.entries.forEach(function (entry) {
      setEntryRevealed(entry, next);
    });
    updateShowAll();
  });

  copyButton.addEventListener("click", function () {
    if (!state.assignment.length) {
      return;
    }

    var text = assignmentText(state.assignment);

    if (
      !navigator.clipboard ||
      typeof navigator.clipboard.writeText !== "function"
    ) {
      finishCopy(copyFallback(text), text);
      return;
    }

    try {
      navigator.clipboard.writeText(text).then(
        function () {
          finishCopy(true, text);
        },
        function () {
          finishCopy(copyFallback(text), text);
        }
      );
    } catch (error) {
      finishCopy(copyFallback(text), text);
    }
  });

  printButton.addEventListener("click", function () {
    window.print();
  });

  namesField.addEventListener("input", function () {
    saveNames(namesField.value);
  });

  restoreNames();
})();

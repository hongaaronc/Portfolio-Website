/* Preview only: switches the light theme's background warmth and remembers the choice across pages. */
(function () {
  "use strict";
  var root = document.documentElement;
  var options = [["", "Aluminium"], ["1", "Warm 1"], ["2", "Warm 2"], ["3", "Warm 3"]];
  var bar = document.createElement("div");
  bar.className = "lab";
  bar.innerHTML = "<span>Background</span>";
  var apply = function (value) {
    if (value) root.dataset.paper = value;
    else delete root.dataset.paper;
    bar.querySelectorAll("button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.value === value));
    });
  };
  options.forEach(function (option) {
    var button = document.createElement("button");
    button.type = "button";
    button.value = option[0];
    button.textContent = option[1];
    button.addEventListener("click", function () {
      try {
        localStorage.setItem("lab-paper", option[0]);
      } catch (e) {}
      apply(option[0]);
    });
    bar.appendChild(button);
  });
  var saved = "";
  try {
    saved = localStorage.getItem("lab-paper") || "";
  } catch (e) {}
  document.body.appendChild(bar);
  apply(saved);
})();

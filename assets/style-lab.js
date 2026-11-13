/* Preview only: switches palette and typeface and remembers the choice across pages. */
(function () {
  "use strict";
  var root = document.documentElement;
  var groups = [
    ["font", "Type", [["", "Varela Round"], ["mplus", "M PLUS Rounded"]]],
    ["palette", "Colour", [["", "Aluminium"], ["blueprint", "Blueprint"], ["keycap", "Keycap"]]]
  ];
  var read = function (key) {
    try {
      return localStorage.getItem("lab-" + key) || "";
    } catch (e) {
      return "";
    }
  };
  var bar = document.createElement("div");
  bar.className = "lab";
  groups.forEach(function (group) {
    var key = group[0];
    var row = document.createElement("div");
    row.innerHTML = "<span>" + group[1] + "</span>";
    var apply = function (value) {
      if (value) root.dataset[key] = value;
      else delete root.dataset[key];
      row.querySelectorAll("button").forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.value === value));
      });
      if (key === "font" && document.fonts) {
        document.fonts.ready.then(function () {
          window.dispatchEvent(new Event("resize"));
        });
      }
    };
    group[2].forEach(function (option) {
      var button = document.createElement("button");
      button.type = "button";
      button.value = option[0];
      button.textContent = option[1];
      button.addEventListener("click", function () {
        try {
          localStorage.setItem("lab-" + key, option[0]);
        } catch (e) {}
        apply(option[0]);
      });
      row.appendChild(button);
    });
    bar.appendChild(row);
    apply(read(key));
  });
  document.body.appendChild(bar);
})();

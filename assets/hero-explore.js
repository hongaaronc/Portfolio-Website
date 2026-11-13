/* Home page: the header fades in as the page scrolls, and (options A and C) the big name
   shrinks into the header's name slot, pushed there by the content below it. */
(function () {
  "use strict";

  var root = document.documentElement;
  var title = document.querySelector(".hero h1");
  var slot = document.querySelector(".brand-name");
  var docks = root.dataset.hero === "a" || root.dataset.hero === "c";
  var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var clamp = function (v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  };
  var lerp = function (a, b, t) {
    return a + (b - a) * t;
  };
  var ramp = function (from, to, v) {
    var x = clamp((v - from) / (to - from));
    return x * x * (3 - 2 * x);
  };

  if (!docks || !title || !slot || still) {
    if (docks && title && slot && "IntersectionObserver" in window) {
      root.classList.add("dock-static");
      root.style.setProperty("--tag", "1");
      new IntersectionObserver(function (entries) {
        var gone = !entries[0].isIntersecting;
        root.classList.toggle("docked", gone);
        root.style.setProperty("--tag", gone ? "0" : "1");
      }).observe(title);
    }
    var plain = function () {
      var v = ramp(8, 72, window.scrollY).toFixed(3);
      root.style.setProperty("--hdr", v);
      root.style.setProperty("--seal", v);
    };
    window.addEventListener("scroll", plain, { passive: true });
    plain();
    return;
  }

  var from = title.querySelectorAll("span");
  var to = slot.querySelectorAll("span");
  var dock = document.createElement("div");
  dock.className = "dock";
  dock.setAttribute("aria-hidden", "true");
  var words = [0, 1].map(function (i) {
    var word = document.createElement("span");
    word.textContent = from[i].textContent;
    dock.appendChild(word);
    return word;
  });
  document.body.appendChild(dock);

  var probe = document.createElement("i");
  probe.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline";

  /* Where a word's text starts and where its baseline sits, in viewport pixels. */
  function locate(el) {
    el.insertBefore(probe, el.firstChild);
    var p = probe.getBoundingClientRect();
    var style = getComputedStyle(el);
    var size = parseFloat(style.fontSize);
    var found = {
      x: p.left,
      base: p.top,
      size: size,
      stretch: parseFloat(style.fontStretch) || 100,
      weight: parseFloat(style.fontWeight) || 700,
      spacing: (parseFloat(style.letterSpacing) || 0) / size
    };
    el.removeChild(probe);
    return found;
  }
  function textWidth(el) {
    var range = document.createRange();
    range.selectNodeContents(el);
    return range.getBoundingClientRect().width;
  }

  var start, end, rise, travel, stacked, stepStart, stepEnd, gap, widths, band, navLeft;
  var last = -1;

  function fit() {
    if (root.dataset.hero !== "c") return;
    title.style.fontSize = "";
    var box = title.parentElement;
    var style = getComputedStyle(box);
    var room = box.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    var size = parseFloat(getComputedStyle(title).fontSize);
    title.style.fontSize = (size * room) / textWidth(title) + "px";
  }

  function measure() {
    fit();
    var y = window.scrollY;
    start = [locate(from[0]), locate(from[1])];
    start.forEach(function (s) {
      s.base += y;
    });
    end = [locate(to[0]), locate(to[1])];

    words[0].style.cssText = "font-size:100px;transform:none";
    words[0].insertBefore(probe, words[0].firstChild);
    rise = (probe.getBoundingClientRect().top - words[0].getBoundingClientRect().top) / 100;
    words[0].removeChild(probe);

    stacked = start[1].base - start[0].base > start[0].size * 0.3;
    gap = (start[1].base - start[0].base) / start[0].size;
    /* The second word's step to the right of the first, in ems, at each end. */
    stepEnd = (end[1].x - end[0].x) / end[0].size;
    stepStart = stacked
      ? textWidth(from[0]) / start[0].size + (stepEnd - textWidth(to[0]) / end[0].size)
      : (start[1].x - start[0].x) / start[0].size;
    travel = start[1].base - end[1].base;
    /* Each word's width in ems at the start and at the end. */
    widths = [0, 1].map(function (i) {
      return [textWidth(from[i]) / start[0].size, textWidth(to[i]) / end[0].size];
    });
    band = document.querySelector(".site-header").getBoundingClientRect().bottom;
    navLeft = document.querySelector(".site-nav").getBoundingClientRect().left;
    last = -1;
    update();
  }

  /* A word that reaches up into the header is kept narrow enough to stay clear of the nav. */
  function fitted(size, x, base, reach) {
    var room = (navLeft - 8 - x) / reach;
    if (room >= size) return size;
    return lerp(size, room, ramp(0, 24, band - (base - rise * size)));
  }

  function place(word, x, base, size, t) {
    word.style.fontSize = size.toFixed(2) + "px";
    word.style.fontStretch = lerp(start[0].stretch, end[0].stretch, t).toFixed(1) + "%";
    word.style.fontWeight = Math.round(lerp(start[0].weight, end[0].weight, t));
    word.style.letterSpacing = lerp(start[0].spacing, end[0].spacing, t).toFixed(4) + "em";
    word.style.transform = "translate3d(" + x.toFixed(2) + "px," + (base - rise * size).toFixed(2) + "px,0)";
  }

  function update() {
    var y = window.scrollY;
    var t = clamp(y / travel);
    var hdr = ramp(8, 72, y).toFixed(3);
    if (t === last && y >= 0 && root.style.getPropertyValue("--hdr") === hdr) return;
    last = t;

    var size = lerp(start[0].size, end[0].size, t);
    /* The lower line keeps pace with the page, so the content under it pushes the name up. */
    var lower = start[1].base - Math.min(y, travel);
    var slide = stacked ? ramp(0.56, 0.9, t) : 1;
    var lift = stacked ? ramp(0.8, 1, t) : 1;
    var x = lerp(start[0].x, end[0].x, t);
    var step = stacked
      ? ((start[1].x - start[0].x) / start[0].size) * (1 - slide) + lerp(stepStart, stepEnd, t) * slide
      : lerp(stepStart, stepEnd, t);
    size = Math.min(
      fitted(size, x, lower - gap * size * (1 - lift), lerp(widths[0][0], widths[0][1], t)),
      fitted(size, x, lower, step + lerp(widths[1][0], widths[1][1], t))
    );
    place(words[0], x, lower - gap * size * (1 - lift), size, t);
    place(words[1], x + step * size, lower, size, t);

    root.style.setProperty("--hdr", hdr);
    root.style.setProperty("--seal", ramp(0.88, 1, t).toFixed(3));
    root.style.setProperty("--tag", (1 - ramp(0.5, 0.8, t)).toFixed(3));
  }

  var queued = false;
  window.addEventListener(
    "scroll",
    function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        update();
      });
    },
    { passive: true }
  );
  window.addEventListener("resize", measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

  root.classList.add("docking");
  measure();
})();

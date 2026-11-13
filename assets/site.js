/* Aaron Hong — portfolio. Everything here is progressive enhancement:
   with JavaScript off, images open in a new view, videos link to YouTube
   and clips show native controls. */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- Theme toggle ---------- */
  var toggle = document.querySelector(".theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var dark =
        root.dataset.theme === "dark" ||
        (!root.dataset.theme && window.matchMedia("(prefers-color-scheme: dark)").matches);
      var next = dark ? "light" : "dark";
      root.dataset.theme = next;
      try {
        localStorage.setItem("theme", next);
      } catch (e) {}
    });
  }

  /* ---------- Home: the header fades in on scroll, and the big name docks into it ---------- */
  (function () {
    var title = document.querySelector(".hero h1");
    var slot = document.querySelector(".brand-name");
    if (!root.classList.contains("home") || !title || !slot) return;

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
    var onScroll = function (run) {
      var queued = false;
      window.addEventListener(
        "scroll",
        function () {
          if (queued) return;
          queued = true;
          requestAnimationFrame(function () {
            queued = false;
            run();
          });
        },
        { passive: true }
      );
    };
    root.classList.remove("pre");

    if (reduceMotion.matches) {
      /* No motion: the header name appears once the big one has scrolled away. */
      root.classList.add("dock-static");
      var header = function () {
        var v = ramp(8, 72, window.scrollY).toFixed(3);
        var gone = title.getBoundingClientRect().bottom < 0;
        root.style.setProperty("--hdr", v);
        root.style.setProperty("--seal", v);
        root.style.setProperty("--tag", gone ? "0" : "1");
        root.classList.toggle("docked", gone);
      };
      onScroll(header);
      header();
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

    var start, end, rise, travel, gap, stepStart, stepEnd, widths, band, navLeft;
    var last = "";

    function measure() {
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

      /* Each word's width in ems, at the start and at the end. */
      widths = [0, 1].map(function (i) {
        return [textWidth(from[i]) / start[0].size, textWidth(to[i]) / end[0].size];
      });
      gap = (start[1].base - start[0].base) / start[0].size;
      /* How far right of the first word the second one sits once they share a line, in ems. */
      stepEnd = (end[1].x - end[0].x) / end[0].size;
      stepStart = widths[0][0] + (stepEnd - widths[0][1]);
      travel = start[1].base - end[1].base;
      band = document.querySelector(".site-header").getBoundingClientRect().bottom;
      navLeft = document.querySelector(".site-nav").getBoundingClientRect().left;
      last = "";
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
      word.style.letterSpacing = lerp(start[0].spacing, end[0].spacing, t).toFixed(4) + "em";
      word.style.transform = "translate3d(" + x.toFixed(2) + "px," + (base - rise * size).toFixed(2) + "px,0)";
    }

    function update() {
      var y = window.scrollY;
      var key = Math.min(y, Math.max(travel, 72));
      if (key === last) return;
      last = key;

      var t = clamp(y / travel);
      /* The lower line keeps pace with the page, so the content under it pushes the name up.
         The second word then slides out to the right of the first and lifts onto its line. */
      var lower = start[1].base - Math.min(y, travel);
      var slide = ramp(0.56, 0.9, t);
      var lift = ramp(0.8, 1, t);
      var x = lerp(start[0].x, end[0].x, t);
      var step = ((start[1].x - start[0].x) / start[0].size) * (1 - slide) + lerp(stepStart, stepEnd, t) * slide;
      var size = lerp(start[0].size, end[0].size, t);
      size = Math.min(
        fitted(size, x, lower - gap * size * (1 - lift), lerp(widths[0][0], widths[0][1], t)),
        fitted(size, x, lower, step + lerp(widths[1][0], widths[1][1], t))
      );
      var upper = lower - gap * size * (1 - lift);
      place(words[0], x, upper, size, t);
      place(words[1], x + step * size, lower, size, t);

      root.style.setProperty("--hdr", ramp(8, 72, y).toFixed(3));
      root.style.setProperty("--seal", ramp(0.88, 1, t).toFixed(3));
      /* "Portfolio" is gone before the name's top edge reaches it. */
      root.style.setProperty("--tag", (1 - ramp(0, 18, band - (upper - rise * size))).toFixed(3));
    }

    onScroll(update);
    window.addEventListener("resize", measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    root.classList.add("docking");
    measure();
  })();

  /* ---------- YouTube: swap the thumbnail for the player on click ---------- */
  document.querySelectorAll("a.yt[data-yt]").forEach(function (link) {
    link.addEventListener("click", function (event) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button) return;
      event.preventDefault();
      var frame = document.createElement("iframe");
      frame.src =
        "https://www.youtube-nocookie.com/embed/" +
        encodeURIComponent(link.dataset.yt) +
        "?autoplay=1&rel=0";
      frame.title = link.dataset.title || "YouTube video";
      frame.allow = "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen";
      frame.allowFullscreen = true;
      var box = document.createElement("div");
      box.className = "yt";
      box.appendChild(frame);
      link.replaceWith(box);
    });
  });

  /* ---------- Looping clips: play only while on screen; click to pause ---------- */
  var clips = document.querySelectorAll("video[data-clip]");
  if (clips.length && "IntersectionObserver" in window && !reduceMotion.matches) {
    var start = function (video) {
      var playing = video.play();
      if (playing && playing.catch) {
        playing.catch(function () {
          video.controls = true;
        });
      }
    };
    var watcher = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var video = entry.target;
          video.dataset.inView = entry.isIntersecting ? "1" : "";
          if (entry.isIntersecting && !video.dataset.held) start(video);
          else video.pause();
        });
      },
      { rootMargin: "200px 0px" }
    );
    clips.forEach(function (video) {
      video.controls = false;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.title = "Click to pause";
      video.addEventListener("click", function () {
        if (video.controls) return;
        if (video.paused) {
          video.dataset.held = "";
          video.title = "Click to pause";
          start(video);
        } else {
          video.dataset.held = "1";
          video.title = "Click to play";
          video.pause();
        }
      });
      watcher.observe(video);
    });
  }

  /* ---------- Lightbox ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll("a[data-lb]"));
  if (!links.length || typeof HTMLDialogElement === "undefined") return;

  var icon = function (path) {
    return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="' + path + '"/></svg>';
  };
  var dialog = document.createElement("dialog");
  dialog.className = "lb";
  dialog.setAttribute("aria-label", "Image viewer");
  dialog.innerHTML =
    '<div class="lb-stage"><img alt=""></div>' +
    '<div class="lb-bar"><p class="lb-caption"></p>' +
    '<p class="lb-meta"><span class="lb-count"></span><a class="lb-orig" target="_blank" rel="noopener">Original file</a></p></div>' +
    '<button type="button" class="lb-close" aria-label="Close">' + icon("M6 6l12 12M18 6L6 18") + "</button>" +
    '<button type="button" class="lb-prev" aria-label="Previous image">' + icon("M15 5l-7 7 7 7") + "</button>" +
    '<button type="button" class="lb-next" aria-label="Next image">' + icon("M9 5l7 7-7 7") + "</button>";
  document.body.appendChild(dialog);

  var stage = dialog.querySelector(".lb-stage");
  var image = dialog.querySelector("img");
  var caption = dialog.querySelector(".lb-caption");
  var count = dialog.querySelector(".lb-count");
  var original = dialog.querySelector(".lb-orig");
  var index = 0;
  var opener = null;

  function show(i) {
    index = (i + links.length) % links.length;
    var link = links[index];
    var thumb = link.querySelector("img");
    image.className = link.dataset.bg || "";
    image.alt = thumb ? thumb.alt : "";
    image.width = link.dataset.w || "";
    image.height = link.dataset.h || "";
    image.src = link.href;
    caption.textContent = link.dataset.caption || (thumb ? thumb.alt : "");
    count.textContent = index + 1 + " / " + links.length;
    if (link.dataset.orig) {
      original.href = link.dataset.orig;
      original.hidden = false;
    } else {
      original.hidden = true;
    }
    var next = links[(index + 1) % links.length];
    if (next && next !== link) new Image().src = next.href;
  }

  function open(i, from) {
    opener = from;
    dialog.classList.toggle("single", links.length < 2);
    show(i);
    dialog.showModal();
    root.style.overflow = "hidden";
  }

  links.forEach(function (link, i) {
    link.addEventListener("click", function (event) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button) return;
      event.preventDefault();
      open(i, link);
    });
  });

  dialog.querySelector(".lb-close").addEventListener("click", function () {
    dialog.close();
  });
  dialog.querySelector(".lb-prev").addEventListener("click", function () {
    show(index - 1);
  });
  dialog.querySelector(".lb-next").addEventListener("click", function () {
    show(index + 1);
  });
  stage.addEventListener("click", function (event) {
    if (event.target === stage) dialog.close();
  });
  dialog.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft") show(index - 1);
    else if (event.key === "ArrowRight") show(index + 1);
  });
  dialog.addEventListener("close", function () {
    root.style.overflow = "";
    image.removeAttribute("src");
    if (opener) opener.focus({ preventScroll: true });
  });

  var startX = null;
  stage.addEventListener(
    "touchstart",
    function (event) {
      startX = event.touches.length === 1 ? event.touches[0].clientX : null;
    },
    { passive: true }
  );
  stage.addEventListener(
    "touchend",
    function (event) {
      if (startX === null) return;
      var dx = event.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
      startX = null;
    },
    { passive: true }
  );
})();

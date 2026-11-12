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

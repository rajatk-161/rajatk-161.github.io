/* Live hero model and small page helpers. */
(function () {
  "use strict";

  /* ---------------------------------------------------------------
     Two-state lattice model (2D Ising, non-conserved Metropolis dynamics).
     +1 = low-density (tetrahedral) local structure, -1 = high-density.
     Near Tc, domains of all sizes form and dissolve: critical fluctuations.
  ---------------------------------------------------------------- */
  var canvas = document.getElementById("field");
  if (canvas && canvas.getContext) {
    var N = 112;
    var TC = 2 / Math.log(1 + Math.SQRT2);           // 2.269...
    var TEMPS = { below: 0.86 * TC, near: 1.0 * TC, above: 1.4 * TC };
    var FLIPS_PER_FRAME = Math.round(N * N * 0.34);

    var spins = new Int8Array(N * N);
    for (var i = 0; i < spins.length; i++) spins[i] = Math.random() < 0.5 ? 1 : -1;

    var w4 = 0, w8 = 0;
    function setTemp(T) { w4 = Math.exp(-4 / T); w8 = Math.exp(-8 / T); }

    function step(n) {
      for (var k = 0; k < n; k++) {
        var x = (Math.random() * N) | 0, y = (Math.random() * N) | 0;
        var idx = y * N + x;
        var s = spins[idx];
        var sum = spins[y * N + ((x + 1) % N)] + spins[y * N + ((x - 1 + N) % N)] +
                  spins[((y + 1) % N) * N + x] + spins[((y - 1 + N) % N) * N + x];
        var dE = 2 * s * sum;
        if (dE <= 0 || (dE === 4 && Math.random() < w4) || (dE === 8 && Math.random() < w8)) {
          spins[idx] = -s;
        }
      }
    }

    // Colours come from the page palette (--glacier and --mist in style.css).
    function hexToRgb(hex) {
      hex = hex.trim().replace("#", "");
      if (hex.length === 3) hex = hex.split("").map(function (c) { return c + c; }).join("");
      var v = parseInt(hex, 16);
      return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
    }
    var cLow, cHigh;
    function readColors() {
      var cs = getComputedStyle(document.documentElement);
      cLow = hexToRgb(cs.getPropertyValue("--glacier") || "#1C6E8C");
      cHigh = hexToRgb(cs.getPropertyValue("--mist") || "#D3E3E8");
    }
    readColors();

    var off = document.createElement("canvas");
    off.width = N; off.height = N;
    var octx = off.getContext("2d");
    var img = octx.createImageData(N, N);
    var ctx = canvas.getContext("2d");

    function sizeCanvas() {
      var r = canvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
    }

    // Draw a locally averaged density (3x3 window) so domains read as a smooth field.
    function render() {
      var d = img.data;
      for (var y = 0; y < N; y++) {
        var ym = ((y - 1 + N) % N) * N, y0 = y * N, yp = ((y + 1) % N) * N;
        for (var x = 0; x < N; x++) {
          var xm = (x - 1 + N) % N, xp = (x + 1) % N;
          var m = spins[ym + xm] + spins[ym + x] + spins[ym + xp] +
                  spins[y0 + xm] + 2 * spins[y0 + x] + spins[y0 + xp] +
                  spins[yp + xm] + spins[yp + x] + spins[yp + xp];
          var t = (m / 10 + 1) / 2;                 // 0 = high density, 1 = low density
          t = t * t * (3 - 2 * t);                  // smoothstep keeps edges crisp but soft
          var o = (y0 + x) * 4;
          d[o]     = cHigh[0] + (cLow[0] - cHigh[0]) * t;
          d[o + 1] = cHigh[1] + (cLow[1] - cHigh[1]) * t;
          d[o + 2] = cHigh[2] + (cLow[2] - cHigh[2]) * t;
          d[o + 3] = 255;
        }
      }
      octx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
    }

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var visible = true, running = false;

    function loop() {
      if (!visible || document.hidden || reduceMotion) { running = false; return; }
      step(FLIPS_PER_FRAME);
      render();
      requestAnimationFrame(loop);
    }
    function start() { if (!running && !reduceMotion) { running = true; requestAnimationFrame(loop); } }

    setTemp(TEMPS.near);
    step(N * N * 220);          // let critical-size structure develop before first paint
    sizeCanvas();
    render();
    start();

    var buttons = document.querySelectorAll(".field-controls button");
    Array.prototype.forEach.call(buttons, function (btn) {
      btn.addEventListener("click", function () {
        Array.prototype.forEach.call(buttons, function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
        setTemp(TEMPS[btn.getAttribute("data-temp")]);
        if (reduceMotion) { step(N * N * 160); render(); }
      });
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start();
      }).observe(canvas);
    }
    document.addEventListener("visibilitychange", function () { if (!document.hidden) start(); });
    window.addEventListener("resize", function () { sizeCanvas(); render(); });
  }

  /* ---------------------------------------------------------------
     Hide the CV links until Rajat_Kumar_CV.pdf is uploaded.
  ---------------------------------------------------------------- */
  var cvLinks = document.querySelectorAll("[data-cv]");
  if (cvLinks.length && window.fetch && location.protocol !== "file:") {
    fetch("Rajat_Kumar_CV.pdf", { method: "HEAD" })
      .then(function (r) { if (!r.ok) throw new Error("missing"); })
      .catch(function () { Array.prototype.forEach.call(cvLinks, function (el) { el.hidden = true; }); });
  }
})();

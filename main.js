/* Small page helper: hide the CV links until Rajat_Kumar_CV.pdf is uploaded. */
(function () {
  "use strict";
  var cvLinks = document.querySelectorAll("[data-cv]");
  if (cvLinks.length && window.fetch && location.protocol !== "file:") {
    fetch("Rajat_Kumar_CV.pdf", { method: "HEAD" })
      .then(function (r) { if (!r.ok) throw new Error("missing"); })
      .catch(function () { Array.prototype.forEach.call(cvLinks, function (el) { el.hidden = true; }); });
  }
})();

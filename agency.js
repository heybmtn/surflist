/* /agency/ form submit — POSTs JSON to /api/agency. */
(function () {
  var form = document.getElementById("agency-form");
  if (!form) return;

  function showError(msg) {
    var errorBox = document.getElementById("agency-error");
    if (!errorBox) return;
    errorBox.hidden = false;
    errorBox.textContent = msg;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    var errorBox = document.getElementById("agency-error");
    if (errorBox) {
      errorBox.hidden = true;
      errorBox.textContent = "";
    }

    var honeypot = form.elements.namedItem("company");
    if (honeypot && String(honeypot.value || "").trim()) {
      form.hidden = true;
      var bait = form.parentElement.querySelector(".form-success");
      if (bait) {
        bait.hidden = false;
        bait.textContent = "Thanks. We'll be in touch.";
      }
      return;
    }

    var payload = {
      business_name: form.elements.namedItem("business_name").value,
      website: form.elements.namedItem("website").value,
      contact_email: form.elements.namedItem("contact_email").value,
      message: form.elements.namedItem("message").value,
    };

    fetch("/api/agency", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        return res.text().then(function (text) {
          var body = {};
          try { body = text ? JSON.parse(text) : {}; } catch (err) { body = {}; }
          return { res: res, body: body };
        });
      })
      .then(function (result) {
        if (!result.res.ok || !result.body.ok) {
          var err = result.body.error || {};
          var msg = err.message || "Could not submit your details.";
          if (err.fields) {
            var first = Object.keys(err.fields)[0];
            if (first && err.fields[first]) msg = err.fields[first];
          }
          throw new Error(msg);
        }
        form.hidden = true;
        var success = form.parentElement.querySelector(".form-success");
        if (success) {
          success.hidden = false;
          success.textContent = "Thanks. We'll be in touch.";
        }
      })
      .catch(function (err) {
        showError(err.message || "Could not submit your details.");
      })
      .finally(function () {
        if (submitBtn) submitBtn.disabled = false;
      });
  });
})();

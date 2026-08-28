/* /list-your-business/ form submit — POSTs JSON to /api/list-your-business. */
(function () {
  var form = document.getElementById("list-your-business-form");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    var payload = {
      business_name: form.elements.namedItem("business_name").value,
      website: form.elements.namedItem("website").value,
      socials: form.elements.namedItem("socials").value,
      contact_email: form.elements.namedItem("contact_email").value,
    };

    fetch("/api/list-your-business", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        return res.json().then(function (body) {
          return { res: res, body: body };
        });
      })
      .then(function (result) {
        if (!result.res.ok || !result.body.ok) {
          throw new Error((result.body.error && result.body.error.message) || "Could not submit your details.");
        }
        form.hidden = true;
        var success = form.parentElement.querySelector(".form-success");
        if (success) {
          success.hidden = false;
          success.textContent = "Thanks. We'll be in touch.";
        }
      })
      .catch(function (err) {
        var errorBox = document.getElementById("list-your-business-error");
        if (errorBox) {
          errorBox.hidden = false;
          errorBox.textContent = err.message;
        }
      })
      .finally(function () {
        if (submitBtn) submitBtn.disabled = false;
      });
  });
})();

/* marketplace-widget.js — one vanilla JS file, no build step, same pattern
   as shared.js. Feature-detects its context at DOMContentLoaded and runs
   only the relevant piece:
     - directory cross-promotion widget (#marketplace-widget)
     - /marketplace index filters + grid (#marketplace-index-root)
     - /marketplace/sell submit (#marketplace-sell-form)
     - /marketplace/[slug] gallery + inquiry form (#marketplace-detail-root)
*/
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function money(pence) {
    return "£" + (Number(pence) / 100).toFixed(2);
  }

  function fetchJSON(url, opts) {
    return fetch(url, opts).then(function (res) {
      return res.json().then(function (body) {
        if (!res.ok || !body || body.ok === false) {
          var err = new Error((body && body.error && body.error.message) || "Request failed");
          err.body = body;
          throw err;
        }
        return body;
      });
    });
  }

  function renderListingCard(listing) {
    var featured = listing.tier === "promoted";
    var href = "/marketplace/" + encodeURIComponent(listing.slug) + "/";
    var img = listing.images && listing.images[0];
    var pickupTag = listing.local_pickup_only
      ? '<div class="tags card__tags"><span class="lvl">Local pickup only</span></div>'
      : "";
    return (
      '<li class="card' + (featured ? " is-featured" : "") + '">' +
      '<div class="card__media"><a href="' + href + '" aria-label="' + esc(listing.title) + '">' +
      (img
        ? '<img src="' + esc(img) + '" alt="' + esc(listing.title) + '" loading="lazy">'
        : '<div class="card__media-placeholder"></div>') +
      "</a>" +
      (featured ? '<span class="badge-featured">Featured</span>' : "") +
      "</div>" +
      '<div class="card__body">' +
      '<span class="card__place">' + esc(listing.location) + "</span>" +
      '<h3 class="card__name"><a class="card__name-link" href="' + href + '">' + esc(listing.title) + "</a></h3>" +
      '<p class="card__price">' + money(listing.price) + "</p>" +
      pickupTag +
      '<div class="card__foot"><a class="visit" href="' + href + '">View &rarr;</a></div>' +
      "</div></li>"
    );
  }

  function renderCtaCard(regionSlug, label) {
    var href = "/marketplace/sell/" + (regionSlug ? "?region=" + encodeURIComponent(regionSlug) : "");
    return (
      '<li class="widget-cta-card">' +
      "<p>Got gear to sell? List it free" + (label ? " in " + esc(label) : "") + ".</p>" +
      '<a class="btn" href="' + href + '">Sell on Surflist &rarr;</a>' +
      "</li>"
    );
  }

  /* ---------- directory cross-promotion widget ---------- */
  function initCrossPromoWidget() {
    var el = document.getElementById("marketplace-widget");
    if (!el) return;
    var regionSlug = el.getAttribute("data-region-slug") || "";
    var title = el.getAttribute("data-title") || "Local Gear for Sale";
    var sellRegion = el.getAttribute("data-sell-region") || regionSlug;

    var url = "/api/marketplace/listings?limit=4" + (regionSlug ? "&region_slug=" + encodeURIComponent(regionSlug) : "");
    fetchJSON(url)
      .then(function (body) {
        var listings = body.listings || [];
        var head = '<div class="hub-cat__head"><h2>' + esc(title) + "</h2></div>";
        if (listings.length >= 2) {
          el.innerHTML = head + '<ul class="grid">' + listings.map(renderListingCard).join("") + "</ul>";
        } else {
          el.innerHTML = head + '<ul class="grid">' + renderCtaCard(sellRegion, title.replace(/^Local Gear for Sale in /, "")) + "</ul>";
        }
      })
      .catch(function () {
        el.innerHTML = "";
        el.hidden = true;
      });
  }

  /* ---------- /marketplace index ---------- */
  function initMarketplaceIndex() {
    var root = document.getElementById("marketplace-index-root");
    if (!root) return;

    var grid = document.getElementById("marketplace-grid");
    var empty = document.getElementById("marketplace-empty");
    var tabs = document.getElementById("marketplace-category-tabs");
    var regionSelect = document.getElementById("marketplace-region-select");
    var searchInput = document.getElementById("marketplace-search-input");

    var params = new URLSearchParams(location.search);
    var state = {
      category: params.get("category") || "",
      region_slug: params.get("region_slug") || "",
      q: params.get("q") || "",
    };

    if (tabs) {
      Array.prototype.forEach.call(tabs.querySelectorAll("[data-value]"), function (a) {
        a.classList.toggle("is-active", a.getAttribute("data-value") === state.category);
      });
    }
    if (regionSelect) regionSelect.value = state.region_slug;
    if (searchInput) searchInput.value = state.q;

    function render() {
      var qs = new URLSearchParams();
      if (state.category) qs.set("category", state.category);
      if (state.region_slug) qs.set("region_slug", state.region_slug);
      if (state.q) qs.set("q", state.q);
      history.replaceState(null, "", location.pathname + (qs.toString() ? "?" + qs.toString() : ""));

      fetchJSON("/api/marketplace/listings?" + qs.toString())
        .then(function (body) {
          var listings = body.listings || [];
          if (grid) grid.innerHTML = listings.map(renderListingCard).join("");
          if (empty) empty.hidden = listings.length > 0;
        })
        .catch(function () {
          if (grid) grid.innerHTML = "";
          if (empty) empty.hidden = false;
        });
    }

    if (tabs) {
      tabs.addEventListener("click", function (e) {
        var a = e.target.closest("[data-value]");
        if (!a) return;
        e.preventDefault();
        state.category = a.getAttribute("data-value") || "";
        Array.prototype.forEach.call(tabs.querySelectorAll("[data-value]"), function (el) {
          el.classList.toggle("is-active", el === a);
        });
        render();
      });
    }

    if (regionSelect) {
      regionSelect.addEventListener("change", function () {
        state.region_slug = regionSelect.value;
        render();
      });
    }

    if (searchInput) {
      var debounceTimer;
      searchInput.addEventListener("input", function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () {
          state.q = searchInput.value.trim();
          render();
        }, 300);
      });
    }

    render();
  }

  /* ---------- /marketplace/sell form ---------- */
  function initSellForm() {
    var form = document.getElementById("marketplace-sell-form");
    if (!form) return;

    var params = new URLSearchParams(location.search);
    var presetRegion = params.get("region");
    if (presetRegion) {
      var regionField = form.elements.namedItem("region_slug");
      if (regionField) regionField.value = presetRegion;
    }

    var categorySelect = form.elements.namedItem("category");
    var surfboardFields = document.getElementById("mp-surfboard-fields");
    var boardTypeInput = form.elements.namedItem("board_type");
    var conditionSelect = form.elements.namedItem("condition");
    var dimensionFieldNames = ["dimension_length", "dimension_width", "dimension_thickness", "dimension_volume"];

    function toggleSurfboardFields() {
      var isSurfboard = categorySelect.value === "surfboards";
      if (surfboardFields) surfboardFields.hidden = !isSurfboard;
      if (boardTypeInput) boardTypeInput.required = isSurfboard;
      if (conditionSelect) conditionSelect.required = isSurfboard;
      if (!isSurfboard) {
        if (boardTypeInput) boardTypeInput.value = "";
        if (conditionSelect) conditionSelect.value = "";
        dimensionFieldNames.forEach(function (name) {
          var el = form.elements.namedItem(name);
          if (el) el.value = "";
        });
      }
    }

    if (categorySelect) {
      categorySelect.addEventListener("change", toggleSurfboardFields);
      toggleSurfboardFields();
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      var formData = new FormData(form);
      fetch("/api/marketplace/create", { method: "POST", body: formData })
        .then(function (res) {
          return res.json().then(function (body) {
            return { res: res, body: body };
          });
        })
        .then(function (result) {
          if (!result.res.ok || !result.body.ok) {
            throw new Error((result.body.error && result.body.error.message) || "Could not submit listing.");
          }
          if (result.body.checkoutUrl) {
            window.location = result.body.checkoutUrl;
            return;
          }
          form.hidden = true;
          var success = document.querySelector("#marketplace-sell-form + .form-success");
          if (success) {
            success.hidden = false;
            success.innerHTML =
              'Your listing is live. <a href="/marketplace/' + encodeURIComponent(result.body.listing.slug) + '/">View it &rarr;</a>';
          }
        })
        .catch(function (err) {
          var errorBox = document.getElementById("marketplace-sell-error");
          if (errorBox) {
            errorBox.hidden = false;
            errorBox.textContent = err.message;
          }
        })
        .finally(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }

  /* ---------- /marketplace/[slug] detail page ---------- */
  function initLightbox(root) {
    var dialog = document.getElementById("marketplace-lightbox");
    var img = document.getElementById("marketplace-lightbox-img");
    if (!dialog || !img) return;

    Array.prototype.forEach.call(root.querySelectorAll(".gallery__thumb[data-full]"), function (thumb) {
      thumb.addEventListener("click", function () {
        img.src = thumb.getAttribute("data-full");
        img.alt = thumb.getAttribute("aria-label") || "";
        dialog.showModal();
      });
    });

    var closeBtn = dialog.querySelector(".lightbox__close");
    if (closeBtn) closeBtn.addEventListener("click", function () { dialog.close(); });
    dialog.addEventListener("click", function (e) {
      if (e.target === dialog) dialog.close();
    });
  }

  function initDetailPage() {
    var root = document.getElementById("marketplace-detail-root");
    if (!root) return;

    initLightbox(root);

    var form = document.getElementById("marketplace-inquiry-form");
    if (!form) return;

    var slug = root.getAttribute("data-slug");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      var payload = {
        slug: slug,
        buyer_name: form.elements.namedItem("buyer_name").value,
        buyer_email: form.elements.namedItem("buyer_email").value,
        message: form.elements.namedItem("message").value,
      };

      fetchJSON("/api/marketplace/inquire", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function () {
          form.hidden = true;
          var success = form.parentElement.querySelector(".form-success");
          if (success) success.hidden = false;
        })
        .catch(function (err) {
          var errorBox = document.getElementById("marketplace-inquiry-error");
          if (errorBox) {
            errorBox.hidden = false;
            errorBox.textContent = err.message;
          }
        })
        .finally(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initCrossPromoWidget();
    initMarketplaceIndex();
    initSellForm();
    initDetailPage();
  });
})();

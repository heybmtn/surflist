/* Site search — lazy-loads /search.json, ranks destinations and listings. */
(function (global) {
  var LIMIT_DROPDOWN = 8;
  var LIMIT_PAGE = 60;
  var STOP = { a: 1, an: 1, the: 1, in: 1, at: 1, of: 1, and: 1, for: 1, to: 1 };
  var CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.55 17.6 4.4 12.45l1.4-1.4 3.75 3.75 8-8 1.4 1.4z"/></svg>';

  function fold(s) {
    return String(s == null ? "" : s)
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, " ");
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function escapeRe(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  function tokens(q) {
    return fold(q).split(" ").filter(function (t) { return t && !STOP[t]; });
  }
  function haystack(d) {
    return d._hay || (d._hay = fold([d.n, d.p, d.c, d.k].filter(Boolean).join(" ")));
  }
  function words(s) { return s ? s.split(" ") : []; }
  function hasTok(hay, tok) {
    if (!tok) return true;
    if (tok.length <= 2) return new RegExp("(^| )" + escapeRe(tok) + "( |$)").test(hay);
    return hay.indexOf(tok) > -1;
  }
  function wordPrefix(wordList, tok) {
    for (var i = 0; i < wordList.length; i++) {
      if (wordList[i].indexOf(tok) === 0) return true;
    }
    return false;
  }
  function lev1(a, b) {
    if (a === b) return true;
    var la = a.length, lb = b.length;
    if (Math.abs(la - lb) > 1) return false;
    if (la === lb) {
      var diffs = [];
      for (var i = 0; i < la; i++) if (a.charAt(i) !== b.charAt(i)) diffs.push(i);
      if (diffs.length === 1) return true;
      return diffs.length === 2 && diffs[0] + 1 === diffs[1] &&
        a.charAt(diffs[0]) === b.charAt(diffs[1]) &&
        a.charAt(diffs[1]) === b.charAt(diffs[0]);
    }
    if (la > lb) return lev1(b, a);
    var i = 0, j = 0, skips = 0;
    while (j < lb) {
      if (i < la && a.charAt(i) === b.charAt(j)) { i++; j++; continue; }
      if (++skips > 1) return false;
      j++;
    }
    return true;
  }
  function fuzzyHas(hay, tok) {
    if (hasTok(hay, tok)) return true;
    if (tok.length < 4) return false;
    var w = words(hay);
    for (var i = 0; i < w.length; i++) {
      if (lev1(w[i], tok)) return true;
    }
    return false;
  }

  function scoreItem(d, toks, foldedQ) {
    var hay = haystack(d);
    var strict = true;
    for (var i = 0; i < toks.length; i++) {
      if (!hasTok(hay, toks[i])) { strict = false; break; }
    }
    if (!strict) {
      for (var f = 0; f < toks.length; f++) {
        if (!fuzzyHas(hay, toks[f])) return -1;
      }
    }
    var name = fold(d.n);
    var place = fold(d.p || "");
    var nameWords = words(name);
    var placeWords = words(place);
    var s = strict ? 0 : -40;
    if (name === foldedQ) s += 1000;
    else if (name.indexOf(foldedQ) === 0) s += 420;
    if (toks.every(function (t) { return wordPrefix(nameWords, t); })) s += 260;
    if (wordPrefix(nameWords, toks[0])) s += 90;
    else if (name.indexOf(toks[0]) > -1) s += 45;
    if (toks.every(function (t) { return wordPrefix(placeWords, t); })) s += 70;
    else if (toks.some(function (t) { return wordPrefix(placeWords, t); })) s += 35;
    var nameHit = toks.some(function (t) { return name.indexOf(t) > -1; });
    var kindBoost = { country: 52, region: 58, town: nameHit ? 64 : 18, "town-cat": nameHit ? 50 : 16, category: 22 };
    if (kindBoost[d.t]) s += kindBoost[d.t];
    if (d.v) s += 16;
    s -= Math.min(name.length, 48) * 0.12;
    return s;
  }

  function query(items, q, limit) {
    var toks = tokens(q);
    if (!toks.length) return { total: 0, hits: [], toks: [] };
    var foldedQ = fold(q);
    var ranked = [];
    for (var i = 0; i < items.length; i++) {
      var sc = scoreItem(items[i], toks, foldedQ);
      if (sc < 0) continue;
      ranked.push({ d: items[i], s: sc });
    }
    ranked.sort(function (a, b) {
      return b.s - a.s || a.d.n.localeCompare(b.d.n);
    });
    var total = ranked.length;
    if (limit) ranked = ranked.slice(0, limit);
    return {
      total: total,
      toks: toks,
      hits: ranked.map(function (r) { return r.d; }),
    };
  }

  function highlight(text, toks) {
    var out = esc(text);
    (toks || []).forEach(function (t) {
      if (!t || t.length < 2) return;
      out = out.replace(new RegExp("(" + escapeRe(t) + ")", "ig"), "<mark>$1</mark>");
    });
    return out;
  }
  function kindLabel(d) {
    if (d.t === "country") return "Country";
    if (d.t === "region") return "Region";
    if (d.t === "town") return "Town";
    if (d.t === "town-cat") return d.c || "Directory";
    if (d.t === "category") return "Category";
    return d.c || "Listing";
  }
  function isDest(d) { return d.t && d.t !== "listing"; }

  function resultHtml(d, toks, extraClass) {
    var cls = "search__result" + (extraClass ? " " + extraClass : "");
    var ext = d.u.charAt(0) !== "/";
    var attrs = ext ? ' target="_blank" rel="noopener"' : "";
    var verified = d.v
      ? '<span class="search__verified">' + CHECK + "Verified</span>"
      : "";
    var meta = kindLabel(d) + (d.p ? " · " + d.p : "");
    return '<a class="' + cls + '" href="' + esc(d.u) + '"' + attrs + ">" +
      '<span class="search__name">' + highlight(d.n, toks) + "</span>" +
      '<span class="search__meta">' + highlight(meta, toks) + verified + "</span></a>";
  }

  var items = null;
  var loading = null;
  function loadIndex(url) {
    if (items) return Promise.resolve(items);
    if (loading) return loading;
    loading = fetch(url, { credentials: "same-origin" })
      .then(function (res) {
        if (!res.ok) throw new Error("search index " + res.status);
        return res.json();
      })
      .then(function (data) {
        items = Array.isArray(data) ? data : [];
        return items;
      })
      .catch(function (err) {
        loading = null;
        throw err;
      });
    return loading;
  }

  function bindWidget(root) {
    var input = root.querySelector(".search__input");
    var box = root.querySelector(".search__results");
    var clearBtn = root.querySelector(".search__clear");
    if (!input || !box) return;
    var url = root.getAttribute("data-index") || "/search.json";
    var pageMode = !!document.getElementById("search-page-status");
    var active = -1;
    var currentHits = [];
    var currentToks = [];
    var currentTotal = 0;

    function setExpanded(open) {
      input.setAttribute("aria-expanded", open ? "true" : "false");
      box.hidden = !open;
    }
    function markActive(opts) {
      opts.forEach(function (o, i) { o.classList.toggle("is-active", i === active); });
      var sel = active > -1 && opts[active] ? opts[active].parentElement.id : "";
      input.setAttribute("aria-activedescendant", sel);
      if (opts[active]) opts[active].scrollIntoView({ block: "nearest" });
    }
    function syncClear() {
      if (!clearBtn) return;
      clearBtn.hidden = !String(input.value || "").trim();
    }
    function close() {
      active = -1;
      setExpanded(false);
      input.setAttribute("aria-activedescendant", "");
    }
    function renderDropdown(result, emptyQuery) {
      box.innerHTML = "";
      active = -1;
      if (emptyQuery) { close(); return; }
      if (!result.hits.length) {
        box.innerHTML = '<li class="search__empty" role="presentation">No matches for “' +
          esc(String(input.value).trim()) + '”</li>';
        setExpanded(true);
        return;
      }
      result.hits.forEach(function (d, i) {
        var li = document.createElement("li");
        li.setAttribute("role", "option");
        li.id = (input.id || "search") + "-opt-" + i;
        li.innerHTML = resultHtml(d, result.toks);
        box.appendChild(li);
      });
      if (result.total > result.hits.length) {
        var more = document.createElement("li");
        more.className = "search__more";
        var q = encodeURIComponent(String(input.value).trim());
        more.innerHTML = '<a class="search__more-link" href="/search/?q=' + q + '">View all ' +
          result.total + " results</a>";
        box.appendChild(more);
      }
      setExpanded(true);
    }
    function paintPage(result, q) {
      var destEl = document.getElementById("search-page-dest");
      var listEl = document.getElementById("search-page-list");
      var status = document.getElementById("search-page-status");
      var destWrap = document.getElementById("search-page-dest-wrap");
      var listWrap = document.getElementById("search-page-list-wrap");
      if (!destEl || !listEl || !status) return;
      var dest = [];
      var list = [];
      result.hits.forEach(function (d) { (isDest(d) ? dest : list).push(d); });
      if (!q) {
        status.textContent = "Type a destination, town or surf business.";
        destEl.innerHTML = "";
        listEl.innerHTML = "";
        if (destWrap) destWrap.hidden = true;
        if (listWrap) listWrap.hidden = true;
        return;
      }
      if (!result.hits.length) {
        status.textContent = "No matches for “" + q + "”.";
        destEl.innerHTML = "";
        listEl.innerHTML = "";
        if (destWrap) destWrap.hidden = true;
        if (listWrap) listWrap.hidden = true;
        return;
      }
      var shown = result.hits.length;
      status.textContent = result.total === shown
        ? (shown + " " + (shown === 1 ? "match" : "matches"))
        : ("Showing " + shown + " of " + result.total + " matches");
      destEl.innerHTML = dest.map(function (d) {
        return "<li>" + resultHtml(d, result.toks, "search__result--page") + "</li>";
      }).join("");
      listEl.innerHTML = list.map(function (d) {
        return "<li>" + resultHtml(d, result.toks, "search__result--page") + "</li>";
      }).join("");
      if (destWrap) destWrap.hidden = !dest.length;
      if (listWrap) listWrap.hidden = !list.length;
    }
    function run(q) {
      var trimmed = String(q || "").trim();
      syncClear();
      if (pageMode) {
        var titleQ = trimmed ? "Search “" + trimmed + "” — surflist" : "Search — surflist";
        if (document.title !== titleQ) document.title = titleQ;
      }
      if (!trimmed) {
        currentHits = [];
        currentToks = [];
        currentTotal = 0;
        renderDropdown({ hits: [], total: 0, toks: [] }, true);
        if (pageMode) paintPage({ hits: [], total: 0, toks: [] }, "");
        return;
      }
      loadIndex(url).then(function (data) {
        if (String(input.value || "").trim() !== trimmed) return;
        if (pageMode) {
          paintPage(query(data, trimmed, LIMIT_PAGE), trimmed);
          close();
          return;
        }
        var drop = query(data, trimmed, LIMIT_DROPDOWN);
        currentHits = drop.hits;
        currentToks = drop.toks;
        currentTotal = drop.total;
        renderDropdown(drop, false);
      }).catch(function () {
        box.innerHTML = '<li class="search__empty" role="presentation">Search isn’t available right now.</li>';
        setExpanded(true);
      });
    }
    function goActiveOrFirst(e) {
      var opts = box.querySelectorAll(".search__result");
      if (!opts.length) return false;
      var target = active > -1 ? opts[active] : opts[0];
      if (!target) return false;
      if (e) e.preventDefault();
      target.click();
      return true;
    }

    input.addEventListener("input", function () { run(input.value); });
    input.addEventListener("focus", function () {
      loadIndex(url).catch(function () {});
      if (String(input.value || "").trim() && (currentHits.length || box.innerHTML)) {
        setExpanded(true);
      }
    });
    input.addEventListener("keydown", function (e) {
      var opts = box.querySelectorAll(".search__result");
      if (e.key === "ArrowDown" && opts.length) {
        e.preventDefault();
        active = Math.min(active + 1, opts.length - 1);
        markActive(opts);
      } else if (e.key === "ArrowUp" && opts.length) {
        e.preventDefault();
        active = Math.max(active - 1, -1);
        markActive(opts);
      } else if (e.key === "Home" && opts.length) {
        e.preventDefault();
        active = 0;
        markActive(opts);
      } else if (e.key === "End" && opts.length) {
        e.preventDefault();
        active = opts.length - 1;
        markActive(opts);
      } else if (e.key === "Escape") {
        close();
      } else if (e.key === "Enter") {
        if (pageMode) {
          if (active > -1 && opts[active]) {
            e.preventDefault();
            opts[active].click();
          }
          return;
        }
        if (goActiveOrFirst(e)) return;
      }
    });
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        input.value = "";
        input.focus();
        run("");
        if (pageMode) {
          history.replaceState(null, "", "/search/");
        }
      });
    }
    var form = root.closest("form") || root.querySelector("form");
    if (form) {
      form.addEventListener("submit", function (e) {
        var q = String(input.value || "").trim();
        if (pageMode) {
          e.preventDefault();
          var next = q ? "/search/?q=" + encodeURIComponent(q) : "/search/";
          if (location.pathname + location.search !== next) history.replaceState(null, "", next);
          run(q);
          close();
          return;
        }
        if (currentHits.length) {
          goActiveOrFirst(e);
          return;
        }
        if (!q) e.preventDefault();
      });
    }
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".search")) close();
    });

    if (pageMode) {
      var params = new URLSearchParams(location.search);
      var initial = params.get("q") || "";
      if (initial && !input.value) input.value = initial;
      run(input.value);
      if (initial) input.focus();
    } else {
      syncClear();
    }
  }

  function boot() {
    var roots = document.querySelectorAll(".search");
    for (var i = 0; i < roots.length; i++) bindWidget(roots[i]);
  }
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
  }

  global.SurflistSearch = { fold: fold, tokens: tokens, query: query };
  if (typeof module !== "undefined" && module.exports) module.exports = global.SurflistSearch;
})(typeof window !== "undefined" ? window : global);

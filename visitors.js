/* Header live/total visitor counter — POSTs a heartbeat to /api/visitors. */
(function () {
  var el = document.querySelector(".header__visitors");
  if (!el) return;
  var liveEl = el.querySelector("[data-visitors-live]");
  var totalEl = el.querySelector("[data-visitors-total]");
  var STORAGE_KEY = "sl_sid";
  var INTERVAL_MS = 25000;

  function randomId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID().replace(/-/g, "");
    return Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2) + Date.now().toString(16);
  }

  var sessionId = "";
  try {
    sessionId = localStorage.getItem(STORAGE_KEY) || "";
    if (!/^[a-f0-9]{16,64}$/i.test(sessionId)) {
      sessionId = randomId();
      localStorage.setItem(STORAGE_KEY, sessionId);
    }
  } catch (err) {
    sessionId = randomId();
  }

  function format(n) {
    var num = Number(n) || 0;
    try { return num.toLocaleString(); } catch (err) { return String(num); }
  }

  function paint(live, total) {
    if (liveEl) liveEl.textContent = format(live);
    if (totalEl) totalEl.textContent = format(total);
  }

  function beat() {
    fetch("/api/visitors", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      keepalive: true,
      body: JSON.stringify({ sessionId: sessionId }),
    })
      .then(function (res) { return res.json().then(function (body) { return { res: res, body: body }; }); })
      .then(function (result) {
        if (result.res.ok && result.body && result.body.ok) {
          paint(result.body.live, result.body.total);
        }
      })
      .catch(function () {
        if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) paint(1, 1);
      });
  }

  var timer = null;
  function start() {
    beat();
    if (timer) clearInterval(timer);
    timer = setInterval(beat, INTERVAL_MS);
  }
  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") stop();
    else start();
  });
  if (document.visibilityState !== "hidden") start();
})();

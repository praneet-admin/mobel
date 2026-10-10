/* ============================================================
   MOBEL — Global Trade
   Progressive enhancement only. Every one of these behaviours is a
   nicety on top of a page that already works: the menu falls back to
   a normal list, the reveals never hide anything without JS (the CSS
   is gated behind .js on <html>), and the FAQ is native <details>.
   No dependencies, no build step.
   ============================================================ */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----------------------------------------------------------
     HEADER — thicken the glass once you've left the top
     ---------------------------------------------------------- */
  var header = document.getElementById("header");

  /* ----------------------------------------------------------
     MOBILE MENU
     The open state lives on <body> so the burger, the panel and
     the page can all react to it from CSS.
     ---------------------------------------------------------- */
  var burger = document.getElementById("burger");
  var nav = document.getElementById("nav");

  function setMenu(open) {
    document.body.classList.toggle("nav-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  if (burger && nav) {
    burger.addEventListener("click", function () {
      setMenu(!document.body.classList.contains("nav-open"));
    });

    /* tapping a link should take you there AND shut the panel behind you */
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("nav-open")) {
        setMenu(false);
        burger.focus();
      }
    });

    /* a click anywhere outside the panel closes it, the way a menu should */
    document.addEventListener("click", function (e) {
      if (!document.body.classList.contains("nav-open")) return;
      if (nav.contains(e.target) || burger.contains(e.target)) return;
      setMenu(false);
    });

    /* rotating a phone can cross the breakpoint with the panel still open,
       which would leave it stuck over a desktop layout */
    window.addEventListener("resize", function () {
      if (window.innerWidth > 980) setMenu(false);
    });
  }

  /* ----------------------------------------------------------
     SCROLL REVEAL
     One observer for the whole page. Each element is unobserved
     the moment it lands, so nothing re-animates on the way back up
     and the observer empties itself out as you read.
     ---------------------------------------------------------- */
  var revealables = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window) || reduced) {
    revealables.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        obs.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });

    revealables.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ----------------------------------------------------------
     STAT COUNTERS
     Eased rather than linear, so the number decelerates into its
     final value instead of stopping dead. Runs once.
     ---------------------------------------------------------- */
  var counters = document.querySelectorAll("[data-count]");

  function runCounter(el) {
    var target = parseFloat(el.getAttribute("data-count")) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    var duration = 1600;
    var start = null;

    function frame(now) {
      if (start === null) start = now;
      var p = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);          /* ease-out cubic */
      el.textContent = Math.round(target * eased).toLocaleString() + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  if (!("IntersectionObserver" in window) || reduced) {
    counters.forEach(function (el) {
      el.textContent =
        (parseFloat(el.getAttribute("data-count")) || 0).toLocaleString() +
        (el.getAttribute("data-suffix") || "");
    });
  } else {
    var countObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        runCounter(entry.target);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.6 });

    counters.forEach(function (el) { countObserver.observe(el); });
  }

  /* ----------------------------------------------------------
     ACTIVE NAV LINK
     Which section you are actually looking at, rather than which
     link you last clicked. A negative top margin the height of the
     header stops a section counting as "current" while it is still
     hidden behind the bar.
     ---------------------------------------------------------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav__link"));
  var watched = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  /* Measured on scroll rather than with an IntersectionObserver: an
     observer only reports sections whose visibility *changed*, so a
     long jump (a nav click, "Quote this lane") could leave the wrong
     link lit. The current section is simply the last one whose top
     has passed under the header. */
  function updateActiveLink() {
    if (!watched.length) return;
    var line = (header ? header.offsetHeight : 78) + 24;
    /* the nav order (Lanes before About) is not the page order, so
       pick by position, not by list index */
    var current = null, best = -Infinity, lowest = null;
    watched.forEach(function (sec) {
      var top = sec.getBoundingClientRect().top - line;
      if (top <= 0 && top > best) { best = top; current = sec; }
      if (!lowest || sec.offsetTop > lowest.offsetTop) lowest = sec;
    });
    if (!current) current = watched[0];
    /* at the very bottom the last section may never reach the line */
    if (window.innerHeight + (window.scrollY || window.pageYOffset) >= document.documentElement.scrollHeight - 4) {
      current = lowest;
    }
    var id = "#" + current.id;
    navLinks.forEach(function (a) {
      a.classList.toggle("is-active", a.getAttribute("href") === id);
    });
  }

  /* ----------------------------------------------------------
     FAQ
     name="faq" already makes these mutually exclusive in current
     browsers. This is the fallback for the ones that don't support
     it yet — harmless where it isn't needed.
     ---------------------------------------------------------- */
  var faqs = Array.prototype.slice.call(document.querySelectorAll('.qa[name="faq"], details.qa'));
  faqs.forEach(function (d) {
    d.addEventListener("toggle", function () {
      if (!d.open) return;
      faqs.forEach(function (other) { if (other !== d) other.open = false; });
    });
  });

  /* ----------------------------------------------------------
     BACK TO TOP + read progress
     The ring's circumference is 2πr with r = 20, i.e. ~126, which
     is the stroke-dasharray set in the CSS.
     ---------------------------------------------------------- */
  var toTop = document.getElementById("totop");
  var ring = document.getElementById("totop-fill");
  var CIRCUMFERENCE = 126;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;

    if (header) header.classList.toggle("is-scrolled", y > 40);

    updateActiveLink();

    if (toTop) toTop.classList.toggle("is-on", y > 600);

    if (ring) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var progress = max > 0 ? Math.min(y / max, 1) : 0;
      ring.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - progress));
    }
  }

  /* scroll fires far faster than the screen refreshes, so the work is
     folded into the next frame instead of running on every event */
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { onScroll(); ticking = false; });
  }, { passive: true });
  onScroll();

  /* ----------------------------------------------------------
     PREFILL — one helper for every "quote this" shortcut
     The hero quick-quote, the lane cards, the service cards and the
     wholesale button all funnel into the same contact form, so
     nobody types the same answers twice.
     ---------------------------------------------------------- */
  function setService(select, wanted) {
    if (!select || !wanted) return;
    /* the hero and the form word modes differently on purpose —
       "Ocean — FCL" vs "Ocean freight — FCL" — so match on the tail */
    var tail = wanted.replace(/^Ocean(\s+freight)?\s+—\s+/, "").trim();
    Array.prototype.forEach.call(select.options, function (opt) {
      if (opt.text === wanted || opt.text.indexOf(tail) !== -1) select.value = opt.value || opt.text;
    });
  }

  function setSelect(select, wanted) {
    if (!select || !wanted) return;
    Array.prototype.forEach.call(select.options, function (opt) {
      if (opt.text === wanted) select.value = opt.value || opt.text;
    });
  }

  function prefill(values) {
    var origin = document.getElementById("origin");
    var dest = document.getElementById("destination");
    var qty = document.getElementById("quantity");
    if (origin && values.origin) origin.value = values.origin;
    if (dest && values.destination) dest.value = values.destination;
    if (qty && values.quantity) qty.value = values.quantity;
    setSelect(document.getElementById("category"), values.category);
    setService(document.getElementById("service"), values.service);

    var contact = document.getElementById("contact");
    if (contact) contact.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });

    /* the scroll is animated, so wait for it before pulling focus —
       focusing mid-flight would snap the page to the field instead */
    window.setTimeout(function () {
      var first = document.getElementById("name");
      if (first && !first.value) first.focus({ preventScroll: true });
      else {
        var msg = document.getElementById("message");
        if (msg) msg.focus({ preventScroll: true });
      }
    }, reduced ? 0 : 700);
  }

  var quick = document.getElementById("quick-quote");
  if (quick) {
    quick.addEventListener("submit", function (e) {
      e.preventDefault();
      prefill({
        category: quick.elements.category.value,
        quantity: quick.elements.quantity.value.trim(),
        destination: quick.elements.to.value.trim(),
        service: "Full import: source, ship & clear"
      });
    });
  }

  document.addEventListener("click", function (e) {
    var link = e.target.closest("[data-prefill]");
    if (!link) return;
    e.preventDefault();
    prefill({
      origin: link.getAttribute("data-origin"),
      destination: link.getAttribute("data-destination"),
      service: link.getAttribute("data-service"),
      category: link.getAttribute("data-category")
    });
  });

  /* ----------------------------------------------------------
     LEAD SOURCE TRACKING
     Remember how the visitor arrived (campaign tags, referrer, the
     page they landed on) for the whole visit, so the Lead in Zoho
     says where it came from even if they browse around first.
     ---------------------------------------------------------- */
  var SOURCE_KEY = "mobel-source-v1";

  function readSource() {
    try {
      var saved = JSON.parse(sessionStorage.getItem(SOURCE_KEY) || "null");
      if (saved) return saved;
    } catch (err) { /* private mode or blocked storage: fall through */ }

    var params = new URLSearchParams(window.location.search);
    var src = { landing: window.location.href.split("#")[0], referrer: document.referrer || "direct", first: new Date().toISOString() };
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"].forEach(function (k) {
      if (params.get(k)) src[k] = params.get(k).slice(0, 120);
    });
    try { sessionStorage.setItem(SOURCE_KEY, JSON.stringify(src)); } catch (err) { /* ignore */ }
    return src;
  }
  var visitSource = readSource();

  function sourceLines() {
    var lines = ["Landing page: " + visitSource.landing, "Referrer: " + visitSource.referrer];
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"].forEach(function (k) {
      if (visitSource[k]) lines.push(k + ": " + visitSource[k]);
    });
    lines.push("Submitted: " + new Date().toString());
    return lines;
  }

  /* ----------------------------------------------------------
     ZOHO CRM SUBMISSION
     Both forms post to the same Web-to-Lead form. The post goes into
     a hidden iframe, so the page stays put; Zoho answers with a
     redirect to thank-you.html, and the iframe's load event is the
     signal that the Lead has been taken.
     ---------------------------------------------------------- */
  var sink = document.getElementById("zoho-sink");

  function hidden(form, name, value) {
    var input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    input.setAttribute("data-temp", "");
    form.appendChild(input);
  }

  function postToZoho(form, onDone) {
    if (!sink) { form.submit(); return; }

    var settled = false;
    function finish(ok) {
      if (settled) return;
      settled = true;
      sink.removeEventListener("load", onLoad);
      onDone(ok);
    }
    function onLoad() { finish(true); }

    sink.addEventListener("load", onLoad);
    /* a slow connection still gets an answer instead of a spinner forever */
    window.setTimeout(function () { finish(false); }, 15000);
    form.submit();
  }

  /* ----------------------------------------------------------
     CONTACT FORM → Zoho Lead
     ---------------------------------------------------------- */
  var contactForm = document.getElementById("contact-form");
  var status = document.getElementById("form-status");

  if (contactForm && status) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!contactForm.checkValidity()) {
        status.textContent = "Please fill in your name, email and message.";
        status.className = "form__status is-bad";
        var firstBad = contactForm.querySelector(":invalid");
        if (firstBad) firstBad.focus();
        return;
      }

      var f = contactForm.elements;
      var fullName = f["Last Name"].value.trim().replace(/\s+/g, " ");
      var company = f["Company"].value.trim();
      var message = f["Description"].value.trim();
      var origin = f["origin"].value.trim();
      var destination = f["destination"].value.trim();
      var service = f["service"].value;
      var category = f["Industry"].value;
      var quantity = f["No of Employees"].value.trim();
      var budget = f["Annual Revenue"].value.trim();

      /* Priority for the sales desk: big orders are Hot, mid-size Warm.
         Lands in the Lead's Priority field so reps sort by it. */
      var qn = Number(quantity) || 0, bn = Number(budget) || 0;
      var rating = (bn >= 100000 || qn >= 1000) ? "Hot" : (bn >= 20000 || qn >= 200) ? "Warm" : "Cold";
      if (f["Rating"]) f["Rating"].value = rating;

      /* Visitors who clicked through from a Zoho Campaigns email arrive with
         utm_medium=email (or utm_source=zoho_campaigns); tag their Lead so the
         CRM can report which campaigns bring in enquiries */
      var fromCampaign = visitSource.utm_medium === "email" || /campaign/i.test(visitSource.utm_source || "");
      f["Lead Source"].value = fromCampaign ? "Email Campaign" : "Web Research";

      /* Zoho wants first and last name apart; one-word names stay whole
         in Last Name, which is the field Zoho insists on */
      var parts = fullName.split(" ");
      var last = parts.length > 1 ? parts.pop() : parts[0];
      var first = parts.length ? parts.join(" ") : "";
      if (fullName.split(" ").length === 1) first = "";

      var fmt = function (n) { return Number(n).toLocaleString("en-US"); };
      var description = [
        "WEBSITE ENQUIRY — " + category,
        "Service: " + service,
        "Quantity: " + (quantity ? fmt(quantity) + " units" : "not given"),
        "Target budget: " + (budget ? "USD " + fmt(budget) : "not given"),
        "Priority: " + rating,
        "Lane: " + (origin || "advise me") + " → " + (destination || "?"),
        "",
        "Requirements:",
        message,
        "",
        "— Tracking —"
      ].concat(sourceLines()).join("\n");

      /* swap the visible values for the CRM-ready ones just for the post,
         then put back what the visitor typed if anything goes wrong */
      var typed = { name: f["Last Name"].value, company: f["Company"].value, message: f["Description"].value };
      f["Last Name"].value = last;
      f["Company"].value = company || (fullName + " (individual)");
      f["Description"].value = description;
      hidden(contactForm, "First Name", first);

      var btn = contactForm.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      status.textContent = "Sending…";
      status.className = "form__status";

      postToZoho(contactForm, function (ok) {
        Array.prototype.forEach.call(contactForm.querySelectorAll("[data-temp]"), function (el) { el.remove(); });
        if (btn) btn.disabled = false;

        if (ok) {
          var greet = fullName.split(" ")[0].replace(/[^\p{L}\p{M}'-]/gu, "") || "there";
          status.textContent = "Thanks, " + greet + " — that's with our electronics sales desk. You'll have suppliers, a lead time and a landed price inside 24 hours.";
          status.className = "form__status is-ok";
          contactForm.reset();
        } else {
          f["Last Name"].value = typed.name;
          f["Company"].value = typed.company;
          f["Description"].value = typed.message;
          status.textContent = "That didn't go through. Please try again, or email trade@mobel.com.";
          status.className = "form__status is-bad";
        }
      });
    });
  }

  /* ----------------------------------------------------------
     RATE-ALERT SIGN-UP → Zoho Lead
     A subscriber is a lead too, just an earlier one. It goes in
     with its own source so sales can filter them apart.
     ---------------------------------------------------------- */
  var sub = document.getElementById("subscribe");
  var subStatus = document.getElementById("sub-status");

  if (sub && subStatus && contactForm) {
    sub.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = document.getElementById("sub-email");

      if (!email.checkValidity() || !email.value) {
        subStatus.textContent = "That email doesn't look right.";
        email.focus();
        return;
      }

      /* reuse the contact form's keys, but post a clean, separate form */
      var post = document.createElement("form");
      post.action = contactForm.action;
      post.method = "post";
      post.acceptCharset = "UTF-8";
      post.target = "zoho-sink";
      post.hidden = true;
      ["xnQsjsdp", "zc_gad", "xmIwtLD", "actionType", "returnURL"].forEach(function (k) {
        hidden(post, k, contactForm.elements[k].value);
      });
      var addr = email.value.trim();
      hidden(post, "Last Name", addr.split("@")[0].slice(0, 80));
      hidden(post, "Company", "Price & stock alert subscriber");
      hidden(post, "Email", addr);
      hidden(post, "Lead Source", "Web Download");
      hidden(post, "Lead Status", "Not Contacted");
      hidden(post, "Description", ["PRICE & STOCK ALERT SUBSCRIBER — monthly electronics price, stock and compliance note", "", "— Tracking —"].concat(sourceLines()).join("\n"));
      hidden(post, "aG9uZXlwb3Q", "");
      document.body.appendChild(post);

      subStatus.textContent = "Signing you up…";
      postToZoho(post, function (ok) {
        post.remove();
        subStatus.textContent = ok
          ? "You're on the list. First note goes out next month."
          : "That didn't go through. Please try again.";
        if (ok) sub.reset();
      });
    });
  }

})();

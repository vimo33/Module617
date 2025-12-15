// Module 617 static site – app.js
(function () {
  const PASSWORD = "module617"; // TODO: change before publishing
  const KEY_AUTH = "m617_auth_ok";
  const KEY_PROGRESS = "m617_progress_v1";

  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(KEY_PROGRESS) || "{}"); }
    catch (e) { return {}; }
  }
  function saveProgress(p) { localStorage.setItem(KEY_PROGRESS, JSON.stringify(p)); }

  function requireGate() {
    const ok = localStorage.getItem(KEY_AUTH) === "1";
    const gate = document.getElementById("passwordGate");
    if (!gate) return;
    if (ok) { gate.classList.add("hidden"); gate.setAttribute("aria-hidden", "true"); return; }
    gate.classList.remove("hidden"); gate.setAttribute("aria-hidden", "false");
    const input = document.getElementById("gateInput");
    const btn = document.getElementById("gateBtn");
    const err = document.getElementById("gateError");
    const tryAuth = () => {
      if ((input.value || "").trim() === PASSWORD) {
        localStorage.setItem(KEY_AUTH, "1");
        gate.classList.add("hidden"); gate.setAttribute("aria-hidden", "true");
      } else {
        err.classList.remove("hidden");
      }
    };
    btn?.addEventListener("click", tryAuth);
    input?.addEventListener("keydown", (e) => { if (e.key === "Enter") tryAuth(); });
    input?.focus();
  }

  function wireChecks() {
    const progress = loadProgress();
    document.querySelectorAll("[data-progress-key]").forEach(el => {
      const key = el.getAttribute("data-progress-key");
      if (!key) return;
      el.checked = !!progress[key];
      el.addEventListener("change", () => {
        const p = loadProgress();
        p[key] = !!el.checked;
        saveProgress(p);
      });
    });
  }

  async function fetchJson(path) {
    const res = await fetch(path);
    return await res.json();
  }

  function phaseKeyFromPage() {
    const m = (location.pathname || "").match(/phase-(\d)\.html/);
    return m ? Number(m[1]) : null;
  }

  function normalize(s) { return (s || "").toLowerCase().trim(); }

  async function renderPhaseDynamic() {
    const phase = phaseKeyFromPage();
    if (!phase) return;

    // meta line
    const meta = document.getElementById("pageMeta");
    if (meta) {
      meta.textContent = "Phase " + phase + " · Fortschritt wird in diesem Browser gespeichert";
    }

    // templates
    const tplMount = document.getElementById("phaseTemplates");
    if (tplMount) {
      const templates = await fetchJson("assets/templates.json");
      const list = templates.filter(t => t.phase === phase);
      tplMount.innerHTML = list.map(t => `
        <a href="template-${t.id}.html" class="item searchable link-item">
          <div>
            <div class="row" style="margin-bottom:6px">
              <span class="badge">Template</span>
              <span class="muted small">${t.phaseLabel}</span>
            </div>
            <h4>${t.title}</h4>
            <p class="muted">Vorschau, Hinweise & Download</p>
          </div>
          <div class="item-right">
            <span class="btn-link">Öffnen →</span>
            <object class="dl-link"><a class="muted small" href="${t.download}" download>DOCX</a></object>
          </div>
        </a>
      `).join("");
    }

    await renderReadings("phaseReadings", "Phase " + phase);
  }

  async function renderReadings(containerId, phasePrefix) {
    const mount = document.getElementById(containerId);
    if (!mount) return;
    const resources = await fetchJson("assets/resources.json");
    const list = resources.filter(r => (r.phase || "").startsWith(phasePrefix));

    if (list.length === 0) {
      mount.innerHTML = `<div class="muted">Keine Readings für diese Phase hinterlegt.</div>`;
    } else {
      mount.innerHTML = list.map(r => `
        <a href="${r.url}" target="_blank" rel="noopener noreferrer" class="item searchable link-item">
          <div>
            <div class="row" style="margin-bottom:6px">
              <span class="badge ${r.tag === "CORE" ? "core" : "opt"}">${r.tag === "CORE" ? "⭐" : "📖"} ${r.tag}</span>
              <span class="muted small">${r.phase}</span>
            </div>
            <h4>${r.title}</h4>
            <p>${r.description || ""}</p>
            ${r.use ? `<p class="muted small" style="margin-top:8px"><strong>Use:</strong> ${r.use}</p>` : ""}
          </div>
          <div class="item-right">
            <span class="btn-link">Öffnen ↗</span>
          </div>
        </a>
      `).join("");
    }
  }
  window.renderReadings = renderReadings;

  async function renderTemplatesIndex() {
    const mount = document.getElementById("templatesIndex");
    if (!mount) return;
    const templates = await fetchJson("assets/templates.json");
    mount.innerHTML = templates.map(t => `
      <a href="template-${t.id}.html" class="item searchable link-item">
        <div>
          <div class="row" style="margin-bottom:6px">
            <span class="badge">Phase ${t.phase}</span>
          </div>
          <h4>${t.title}</h4>
          <p class="muted">Offizielle Vorlage (DOCX) + annotierte Vorschau</p>
        </div>
        <div class="item-right">
          <span class="btn-link">Öffnen →</span>
          <object class="dl-link"><a class="muted small" href="${t.download}" download>DOCX</a></object>
        </div>
      </a>
    `).join("");
  }

  async function renderResourcesPage() {
    const mount = document.getElementById("resourcesIndex");
    if (!mount) return;
    const resources = await fetchJson("assets/resources.json");

    // group by phase
    const groups = {};
    resources.forEach(r => {
      const k = r.phase || "Unsorted";
      groups[k] = groups[k] || [];
      groups[k].push(r);
    });
    const order = Object.keys(groups).sort((a, b) => {
      const na = parseInt((a.match(/Phase\s+(\d)/) || [])[1] || "99", 10);
      const nb = parseInt((b.match(/Phase\s+(\d)/) || [])[1] || "99", 10);
      return na - nb;
    });

    mount.innerHTML = order.map(k => `
      <div class="card">
        <h2>${k}</h2>
        <div class="reading-list">
          ${groups[k].map(r => `
            <a href="${r.url}" target="_blank" rel="noopener noreferrer" class="item searchable link-item">
              <div>
                <div class="row" style="margin-bottom:6px">
                  <span class="badge ${r.tag === "CORE" ? "core" : "opt"}">${r.tag}</span>
                </div>
                <h4>${r.title}</h4>
                <p>${r.description || ""}</p>
                ${r.use ? `<p class="muted small" style="margin-top:8px"><strong>Use:</strong> ${r.use}</p>` : ""}
              </div>
              <div class="item-right">
                <span class="btn-link">Öffnen ↗</span>
              </div>
            </a>
          `).join("")}
        </div>
      </div>
    `).join("");
  }


  function injectMobileNav() {
    if (document.getElementById("mobileNav")) return;

    // Inject Phases Sheet
    const sheet = document.createElement("div");
    sheet.className = "phases-sheet";
    sheet.id = "phasesSheet";
    sheet.innerHTML = `
      <h3>Phasen</h3>
      <div class="phases-grid">
        <a href="phase-1.html" class="phase-btn"><strong>Phase 1</strong><span>Festlegen</span></a>
        <a href="phase-2.html" class="phase-btn"><strong>Phase 2</strong><span>Bewerten</span></a>
        <a href="phase-3.html" class="phase-btn"><strong>Phase 3</strong><span>Konzipieren</span></a>
        <a href="phase-4.html" class="phase-btn"><strong>Phase 4</strong><span>Validieren</span></a>
        <a href="phase-5.html" class="phase-btn"><strong>Phase 5</strong><span>Entscheiden</span></a>
        <a href="index.html" class="phase-btn"><strong>Phase 0</strong><span>Start</span></a>
      </div>
    `;
    document.body.appendChild(sheet);

    const overlay = document.createElement("div");
    overlay.className = "phase-overlay";
    overlay.id = "phaseOverlay";
    overlay.onclick = () => togglePhases(false);
    document.body.appendChild(overlay);

    // Inject Nav
    const nav = document.createElement("nav");
    nav.id = "mobileNav";
    nav.className = "mobile-nav";
    const path = (location.pathname.split("/").pop() || "index.html");

    const items = [
      { href: "index.html", label: "Start", icon: "🏠" },
      { id: "btnPhases", label: "Phasen", icon: "🔢" },
      { href: "templates.html", label: "Templates", icon: "📄" },
      { href: "resources.html", label: "Ressourcen", icon: "📚" },
      { href: "help.html", label: "Hilfe", icon: "❓" },
    ];

    nav.innerHTML = items.map(it => {
      if (it.id === "btnPhases") {
        return `<a href="javascript:void(0)" id="${it.id}"><span class="i">${it.icon}</span><span>${it.label}</span></a>`;
      }
      const active = path === it.href ? "active" : "";
      return `<a class="${active}" href="${it.href}"><span class="i">${it.icon}</span><span>${it.label}</span></a>`;
    }).join("");
    document.body.appendChild(nav);

    document.getElementById("btnPhases").addEventListener("click", () => togglePhases(true));
  }

  function togglePhases(show) {
    const sheet = document.getElementById("phasesSheet");
    const overlay = document.getElementById("phaseOverlay");
    if (show) {
      sheet.classList.add("open");
      overlay.classList.add("open");
    } else {
      sheet.classList.remove("open");
      overlay.classList.remove("open");
    }
  }
  function wireSearch() {
    const input = document.getElementById("searchInput");
    if (!input) return;
    input.addEventListener("input", () => {
      const q = normalize(input.value);
      document.querySelectorAll(".searchable").forEach(el => {
        const txt = normalize(el.textContent);
        el.style.display = (!q || txt.includes(q)) ? "" : "none";
      });
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    requireGate();
    wireChecks();
    wireSearch();
    injectMobileNav();
    await renderPhaseDynamic();
    await renderTemplatesIndex();
    await renderResourcesPage();

    // Scroll listener for topbar
    window.addEventListener("scroll", () => {
      const topbar = document.querySelector(".topbar");
      if (topbar) {
        if (window.scrollY > 10) topbar.classList.add("scrolled");
        else topbar.classList.remove("scrolled");
      }
    });
  });
})();

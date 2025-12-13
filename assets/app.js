// Module 617 static site – app.js
(function(){
  const PASSWORD = "module617"; // TODO: change before publishing
  const KEY_AUTH = "m617_auth_ok";
  const KEY_PROGRESS = "m617_progress_v1";

  function loadProgress(){
    try{ return JSON.parse(localStorage.getItem(KEY_PROGRESS) || "{}"); }
    catch(e){ return {}; }
  }
  function saveProgress(p){ localStorage.setItem(KEY_PROGRESS, JSON.stringify(p)); }

  function requireGate(){
    const ok = localStorage.getItem(KEY_AUTH)==="1";
    const gate = document.getElementById("passwordGate");
    if(!gate) return;
    if(ok){ gate.classList.add("hidden"); gate.setAttribute("aria-hidden","true"); return; }
    gate.classList.remove("hidden"); gate.setAttribute("aria-hidden","false");
    const input = document.getElementById("gateInput");
    const btn = document.getElementById("gateBtn");
    const err = document.getElementById("gateError");
    const tryAuth=()=>{
      if((input.value||"").trim()===PASSWORD){
        localStorage.setItem(KEY_AUTH,"1");
        gate.classList.add("hidden"); gate.setAttribute("aria-hidden","true");
      }else{
        err.classList.remove("hidden");
      }
    };
    btn?.addEventListener("click", tryAuth);
    input?.addEventListener("keydown", (e)=>{ if(e.key==="Enter") tryAuth(); });
    input?.focus();
  }

  function wireChecks(){
    const progress = loadProgress();
    document.querySelectorAll("[data-progress-key]").forEach(el=>{
      const key = el.getAttribute("data-progress-key");
      if(!key) return;
      el.checked = !!progress[key];
      el.addEventListener("change", ()=>{
        const p = loadProgress();
        p[key] = !!el.checked;
        saveProgress(p);
      });
    });
  }

  async function fetchJson(path){
    const res = await fetch(path);
    return await res.json();
  }

  function phaseKeyFromPage(){
    const m = (location.pathname||"").match(/phase-(\d)\.html/);
    return m ? Number(m[1]) : null;
  }

  function normalize(s){ return (s||"").toLowerCase().trim(); }

  async async function renderPhaseDynamic(){
    const phase = phaseKeyFromPage();
    if(!phase) return;

    // meta line
    const meta = document.getElementById("pageMeta");
    if(meta){
      meta.textContent = "Phase " + phase + " · Fortschritt wird in diesem Browser gespeichert";
    }

    // templates
    const tplMount = document.getElementById("phaseTemplates");
    if(tplMount){
      const templates = await fetchJson("assets/templates.json");
      const list = templates.filter(t=>t.phase===phase);
      tplMount.innerHTML = list.map(t=>`
        <div class="item searchable">
          <div>
            <div class="row" style="margin-bottom:6px">
              <span class="badge">Template</span>
              <span class="muted small">${t.phaseLabel}</span>
            </div>
            <h4>${t.title}</h4>
            <p class="muted">Vorschau, Hinweise & Download</p>
          </div>
          <div class="item-right">
            <a href="template-${t.id}.html">Öffnen →</a>
            <a class="muted small" href="${t.download}" download>DOCX herunterladen</a>
          </div>
        </div>
      `).join("");
    }

    // readings
    const rMount = document.getElementById("phaseReadings");
    if(rMount){
      const resources = await fetchJson("assets/resources.json");
      const phaseLabel = "Phase " + phase;
      const list = resources.filter(r => (r.phase||"").startsWith(phaseLabel));
      if(list.length===0){
        rMount.innerHTML = `<div class="muted">Keine Readings für diese Phase hinterlegt.</div>`;
      }else{
        rMount.innerHTML = list.map(r=>`
          <div class="item searchable">
            <div>
              <div class="row" style="margin-bottom:6px">
                <span class="badge ${r.tag==="CORE"?"core":"opt"}">${r.tag}</span>
                <span class="muted small">${r.phase}</span>
              </div>
              <h4>${r.title}</h4>
              <p>${r.description || ""}</p>
              ${r.use ? `<p class="muted small" style="margin-top:8px"><strong>Use:</strong> ${r.use}</p>` : ""}
            </div>
            <div class="item-right">
              <a href="${r.url}" target="_blank" rel="noopener noreferrer">Öffnen ↗</a>
            </div>
          </div>
        `).join("");
      }
    }
  }

  async async function renderTemplatesIndex(){
    const mount = document.getElementById("templatesIndex");
    if(!mount) return;
    const templates = await fetchJson("assets/templates.json");
    mount.innerHTML = templates.map(t=>`
      <div class="item searchable">
        <div>
          <div class="row" style="margin-bottom:6px">
            <span class="badge">Phase ${t.phase}</span>
          </div>
          <h4>${t.title}</h4>
          <p class="muted">Offizielle Vorlage (DOCX) + annotierte Vorschau</p>
        </div>
        <div class="item-right">
          <a href="template-${t.id}.html">Öffnen →</a>
          <a class="muted small" href="${t.download}" download>DOCX</a>
        </div>
      </div>
    `).join("");
  }

  async async function renderResourcesPage(){
    const mount = document.getElementById("resourcesIndex");
    if(!mount) return;
    const resources = await fetchJson("assets/resources.json");

    // group by phase
    const groups = {};
    resources.forEach(r=>{
      const k = r.phase || "Unsorted";
      groups[k] = groups[k] || [];
      groups[k].push(r);
    });
    const order = Object.keys(groups).sort((a,b)=>{
      const na = parseInt((a.match(/Phase\s+(\d)/)||[])[1]||"99",10);
      const nb = parseInt((b.match(/Phase\s+(\d)/)||[])[1]||"99",10);
      return na-nb;
    });

    mount.innerHTML = order.map(k=>`
      <div class="card">
        <h2>${k}</h2>
        <div class="reading-list">
          ${groups[k].map(r=>`
            <div class="item searchable">
              <div>
                <div class="row" style="margin-bottom:6px">
                  <span class="badge ${r.tag==="CORE"?"core":"opt"}">${r.tag}</span>
                </div>
                <h4>${r.title}</h4>
                <p>${r.description || ""}</p>
                ${r.use ? `<p class="muted small" style="margin-top:8px"><strong>Use:</strong> ${r.use}</p>` : ""}
              </div>
              <div class="item-right">
                <a href="${r.url}" target="_blank" rel="noopener noreferrer">Öffnen ↗</a>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `).join("");
  }

  
  function injectMobileNav(){
    if(document.getElementById("mobileNav")) return;
    const nav=document.createElement("nav");
    nav.id="mobileNav";
    nav.className="mobile-nav";
    const path=(location.pathname.split("/").pop()||"index.html");
    const items=[
      {href:"index.html", label:"Start", icon:"🏠"},
      {href:"templates.html", label:"Templates", icon:"📄"},
      {href:"resources.html", label:"Ressourcen", icon:"📚"},
      {href:"help.html", label:"Hilfe", icon:"❓"},
    ];
    nav.innerHTML=items.map(it=>{
      const active = path===it.href ? "active" : "";
      return `<a class="${active}" href="${it.href}"><span class="i">${it.icon}</span><span>${it.label}</span></a>`;
    }).join("");
    document.body.appendChild(nav);
  }
function wireSearch(){
    const input = document.getElementById("searchInput");
    if(!input) return;
    input.addEventListener("input", ()=>{
      const q = normalize(input.value);
      document.querySelectorAll(".searchable").forEach(el=>{
        const txt = normalize(el.textContent);
        el.style.display = (!q || txt.includes(q)) ? "" : "none";
      });
    });
  }

  document.addEventListener("DOMContentLoaded", async ()=>{
    requireGate();
    wireChecks();
    wireSearch();
    injectMobileNav();
    await renderPhaseDynamic();
    await renderTemplatesIndex();
    await renderResourcesPage();
  });
})();

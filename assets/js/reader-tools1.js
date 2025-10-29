/* =========================================================================
   Reader Tools – Cinematic Frosted Glass (White/Gray/Black)
   - Docked right panel (slim ~18%)
   - Engraved header "أدوات القارئ | Reader Tools"
   - Cinematic open animation (slide + light sweep)
   - Tabs: Dictionary, Translate, Notes, Summaries
   - No external libs. Pure JS + CSS-in-JS + inline SVG icons.
   - Public API: window.ReaderTools.open()/close()/toggle()
   ======================================================================== */
(function () {
  // ========= CSS (injected once) =========
  const STYLE_ID = "reader-tools-cinematic-style";
  if (!document.getElementById(STYLE_ID)) {
    const css = `
:root{
  /* Easily tweak placement if needed later */
  --rt-right: 0px;
  --rt-width: clamp(280px, 18vw, 360px);
  --rt-top: 0px;          /* If you need offset under a header, change here */
  --rt-bottom: 0px;
  --rt-z: 10040;
  --rt-glass: #0f1317cc;  /* frosted */
  --rt-ink: #eef2f7;      /* text light */
  --rt-ink-dim:#b9c1cc;
  --rt-border:#ffffff14;
  --rt-line:#ffffff0f;
  --rt-accent:#bfc7d2;    /* silver-ish */
  --rt-bg-deep:#0b0f14;
  --rt-gray-1:#12161c;
  --rt-gray-2:#1a2027;
  --rt-gray-3:#242b33;
  --rt-focus:#e8ecf2;
  --rt-shadow: 0 20px 60px rgba(0,0,0,.45);
}

#rtPanel{
  position:fixed; right:var(--rt-right); top:var(--rt-top); bottom:var(--rt-bottom);
  width:var(--rt-width); z-index:var(--rt-z);
  display:flex; flex-direction:column; pointer-events:auto;
  transform: translateX(8%) scale(.985); opacity:0; visibility:hidden;
  transition: transform .45s cubic-bezier(.22,.95,.25,1), opacity .35s ease, visibility 0s .35s;
}
#rtPanel.rt-open{
  transform: translateX(0) scale(1); opacity:1; visibility:visible; transition: transform .45s cubic-bezier(.22,.95,.25,1), opacity .35s ease;
}

/* Glass shell */
#rtShell{
  position:relative; inset:0;
  height:100%;
  background: linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,0)) ,
             var(--rt-glass);
  backdrop-filter: blur(10px) saturate(1.05);
  -webkit-backdrop-filter: blur(10px) saturate(1.05);
  border-inline-start: 1px solid var(--rt-border);
  box-shadow: var(--rt-shadow);
  display:flex; flex-direction:column;
}

/* Cinematic light sweep on open */
#rtShell::after{
  content:"";
  position:absolute; inset:-20% -120% -20% auto;
  width: 60%; transform: skewX(-20deg) translateX(120%);
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.18), transparent);
  filter: blur(6px);
  opacity:.0; pointer-events:none;
}
#rtPanel.rt-open #rtShell::after{
  animation: rtSweep 800ms cubic-bezier(.22,.95,.25,1) 80ms 1 both;
}
@keyframes rtSweep{
  0%  { transform:skewX(-20deg) translateX(120%); opacity:0 }
  30% { opacity: .6 }
  100%{ transform:skewX(-20deg) translateX(-20%); opacity:0 }
}

/* Header with engraved title */
#rtHead{
  position:relative; display:flex; align-items:center; justify-content:space-between; gap:8px;
  padding:14px 14px 12px; border-bottom:1px solid var(--rt-line);
  background: linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,0));
}
#rtTitle{
  display:flex; flex-direction:column; gap:2px;
}
#rtTitle .ar{
  font-family:"Tajawal", system-ui, Arial; font-weight:900; letter-spacing:.2px;
  font-size:16px; line-height:1; color:transparent;
  background: linear-gradient(180deg, #dfe5ee, #c9d1db);
  -webkit-background-clip:text; background-clip:text;
  /* Engraved illusion with multi shadows */
  text-shadow:
    0px 1px 0px rgba(255,255,255,.65),      /* top highlight */
    0px -1px 0px rgba(0,0,0,.45),          /* top inner */
    0.5px 0.5px 0 rgba(0,0,0,.55),         /* outer */
    -0.5px -0.5px 0 rgba(255,255,255,.18); /* subtle bevel */
  filter: drop-shadow(0 1px 0 rgba(255,255,255,.08));
}
#rtTitle .en{
  font-family:"Tajawal", system-ui, Arial; font-weight:700;
  font-size:11px; letter-spacing:.6px; text-transform:uppercase;
  color:#c8d0da; opacity:.9;
}

#rtHeadBtns{ display:flex; align-items:center; gap:6px }
.rtBtn{
  display:inline-flex; align-items:center; gap:8px; cursor:pointer;
  background: linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02));
  border:1px solid var(--rt-border); color:var(--rt-ink); padding:8px 10px; border-radius:10px;
  font-weight:800; font-size:12px;
}
.rtBtn:hover{ border-color:#ffffff2a; background:rgba(255,255,255,.06) }
.rtIcon{ width:18px; height:18px; stroke: currentColor; fill:none; stroke-width: 2; }

/* Tabs */
#rtTabs{ display:grid; grid-template-columns: repeat(4, 1fr); gap:6px; padding:10px 12px; border-bottom:1px solid var(--rt-line) }
.rtTab{
  display:flex; align-items:center; justify-content:center; gap:7px;
  background: linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.015));
  border:1px solid var(--rt-border); border-radius:10px; color:var(--rt-ink-dim);
  height:38px; cursor:pointer; font-weight:800; font-size:12px;
  transition: transform .15s ease;
}
.rtTab:hover{ color:var(--rt-ink); border-color:#ffffff2a; transform:translateY(-1px) }
.rtTab.active{ color:#eef3f9; border-color:#ffffff3a; box-shadow: inset 0 0 0 1px #ffffff22, 0 6px 16px rgba(0,0,0,.25) }
.rtTab .rtIcon{ width:17px; height:17px; }

/* Body */
#rtBody{ flex:1; min-height:0; padding:10px 12px 12px; display:flex; flex-direction:column; gap:10px }
.rtCard{
  background: linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,.01));
  border:1px solid var(--rt-border); border-radius:12px; padding:12px;
  color:var(--rt-ink);
}
.rtLabel{ font-size:12px; color:var(--rt-ink-dim); margin-bottom:6px; font-weight:700; letter-spacing:.2px }
.rtField, .rtArea, .rtOutput{
  width:100%; border:1px solid var(--rt-border); border-radius:10px;
  background:#0b0f14; color:#eaf0f6; padding:10px; font-family:inherit; font-size:14px;
}
.rtField:focus, .rtArea:focus{ outline:none; border-color:#ffffff33; box-shadow: 0 0 0 2px #ffffff12 inset }
.rtRow{ display:flex; gap:8px; align-items:center }
.rtRow .rtBtn{ height:38px }
.rtArea{ resize:vertical; min-height:110px }
.rtOutput{ min-height:110px; background:#0d1116; }

.rtHint{ font-size:11px; color:#9aa4b2; margin-top:6px }

/* Light flash on open (subtle) */
#rtFlash{
  position:absolute; inset:0; pointer-events:none; opacity:0;
  background: radial-gradient(420px 220px at 85% 8%, rgba(255,255,255,.22), transparent 60%);
  mix-blend-mode:screen; filter: blur(8px);
}
#rtPanel.rt-open #rtFlash{ animation: rtFlashIn .65s ease-out 60ms 1 both; }
@keyframes rtFlashIn{
  0%{ opacity:0 }
  25%{ opacity:.45 }
  100%{ opacity:0 }
}

/* Responsive small screens */
@media (max-width: 900px){
  :root{ --rt-width: clamp(260px, 42vw, 340px) }
}
`;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ========= HTML structure =========
  const panel = document.createElement("aside");
  panel.id = "rtPanel";
  panel.setAttribute("dir", "rtl");
  panel.innerHTML = `
    <div id="rtShell" role="dialog" aria-label="Reader Tools">
      <div id="rtFlash"></div>
      <header id="rtHead">
        <div id="rtTitle">
          <div class="ar">أدوات القارئ</div>
          <div class="en">Reader Tools</div>
        </div>
        <div id="rtHeadBtns">
          <button class="rtBtn" id="rtCloseBtn" title="إغلاق">
            ${icon("x")}
            <span>إغلاق</span>
          </button>
        </div>
      </header>

      <nav id="rtTabs" role="tablist">
        <button class="rtTab active" data-tab="dict" role="tab" aria-selected="true" title="القاموس">
          ${icon("book-open")}
          <span>القاموس</span>
        </button>
        <button class="rtTab" data-tab="trans" role="tab" aria-selected="false" title="الترجمة">
          ${icon("languages")}
          <span>الترجمة</span>
        </button>
        <button class="rtTab" data-tab="notes" role="tab" aria-selected="false" title="الملاحظات">
          ${icon("edit-3")}
          <span>الملاحظات</span>
        </button>
        <button class="rtTab" data-tab="sum" role="tab" aria-selected="false" title="الملخصات">
          ${icon("sparkles")}
          <span>الملخصات</span>
        </button>
      </nav>

      <section id="rtBody">
        <!-- Dictionary -->
        <div class="rtCard" data-pane="dict">
          <div class="rtLabel">اكتب كلمة أو عبارة للبحث</div>
          <div class="rtRow">
            <input class="rtField" id="rtDictInput" placeholder="مثال: توثيق الأدلة / Evidence documentation" />
            <button class="rtBtn" id="rtDictBtn">${icon("search")}<span>بحث</span></button>
          </div>
          <div class="rtHint">* البحث محلي شكلي. اربطه لاحقًا بأي API تفضله.</div>
          <div class="rtOutput" id="rtDictOut" style="margin-top:8px"></div>
        </div>

        <!-- Translate -->
        <div class="rtCard" data-pane="trans" hidden>
          <div class="rtLabel">نص الترجمة</div>
          <textarea class="rtArea" id="rtTransSrc" placeholder="ألصق النص هنا…"></textarea>
          <div class="rtRow" style="margin-top:8px">
            <button class="rtBtn" id="rtTransToAr">${icon("arrow-left-right")}<span>إلى العربية</span></button>
            <button class="rtBtn" id="rtTransToEn">${icon("arrow-left-right")}<span>To English</span></button>
          </div>
          <div class="rtOutput" id="rtTransOut" style="margin-top:8px"></div>
        </div>

        <!-- Notes -->
        <div class="rtCard" data-pane="notes" hidden>
          <div class="rtLabel">ملاحظاتك</div>
          <textarea class="rtArea" id="rtNotes" placeholder="دوّن ملاحظات سريعة…"></textarea>
          <div class="rtRow" style="margin-top:8px">
            <button class="rtBtn" id="rtSaveNotes">${icon("save")}<span>حفظ</span></button>
            <button class="rtBtn" id="rtClearNotes">${icon("trash")}<span>تفريغ</span></button>
          </div>
          <div class="rtHint">* يتم الحفظ محليًا داخل المتصفح (localStorage).</div>
        </div>

        <!-- Summaries -->
        <div class="rtCard" data-pane="sum" hidden>
          <div class="rtLabel">الملخصات</div>
          <div class="rtOutput" id="rtSumContent">لا توجد ملخصات بعد. أضفها برمجيًا لاحقًا أو اربط بمصدر خارجي.</div>
        </div>
      </section>
    </div>
  `;
  document.body.appendChild(panel);

  // ========= Helpers & Icons =========
  function icon(name) {
    const stroke = 'currentColor';
    const base = (d) => `<svg class="rtIcon" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" stroke="${stroke}" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    switch (name) {
      case "x": return base("M18 6 6 18M6 6l12 12");
      case "book-open": return `<svg class="rtIcon" viewBox="0 0 24 24"><path d="M12 4c-2 .5-4 1-6 1v13c2 0 4 .5 6 1m0-15c2 .5 4 1 6 1v13c-2 0-4 .5-6 1" stroke="${stroke}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      case "languages": return `<svg class="rtIcon" viewBox="0 0 24 24"><path d="M5 8h14M12 4v2m0 0a8 8 0 1 1-8 8" stroke="${stroke}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      case "edit-3": return base("M12 20h9M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z");
      case "sparkles": return `<svg class="rtIcon" viewBox="0 0 24 24"><path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3zM19 16l.9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9L19 16z" stroke="${stroke}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      case "search": return base("M21 21l-4.35-4.35M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z");
      case "arrow-left-right": return base("M8 3l-5 5 5 5M16 21l5-5-5-5M3 8h18M3 16h18");
      case "save": return base("M19 21H5a2 2 0 0 1-2-2V7l4-4h9l5 5v11a2 2 0 0 1-2 2zM7 3v5h8");
      case "trash": return base("M3 6h18M8 6V4h8v2m-1 0v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6h10z");
      default: return "";
    }
  }

  // ========= Behavior =========
  const rtCloseBtn = panel.querySelector("#rtCloseBtn");
  const rtTabs = Array.from(panel.querySelectorAll(".rtTab"));
  const panes = Array.from(panel.querySelectorAll("[data-pane]"));

  function setActive(tabName) {
    rtTabs.forEach((t) => {
      const active = t.getAttribute("data-tab") === tabName;
      t.classList.toggle("active", active);
      t.setAttribute("aria-selected", active ? "true" : "false");
    });
    panes.forEach((p) => {
      const show = p.getAttribute("data-pane") === tabName;
      p.hidden = !show;
    });
  }

  rtTabs.forEach((t) => {
    t.addEventListener("click", () => {
      setActive(t.getAttribute("data-tab"));
    });
  });

  // Simple demo behaviors (local only)
  const dictBtn = panel.querySelector("#rtDictBtn");
  const dictInput = panel.querySelector("#rtDictInput");
  const dictOut = panel.querySelector("#rtDictOut");
  if (dictBtn) {
    dictBtn.addEventListener("click", () => {
      const q = (dictInput.value || "").trim();
      if (!q) { dictOut.textContent = "اكتب كلمة أولاً…"; return; }
      // Demo only:
      dictOut.innerHTML = `<strong style="color:#eaf0f6">نتيجة شكلية:</strong> <br> «${escapeHTML(q)}» = <em style="color:#cfd6df">[مصطلح تدريبي / Example]</em>`;
    });
  }

  const tAr = panel.querySelector("#rtTransToAr");
  const tEn = panel.querySelector("#rtTransToEn");
  const tSrc = panel.querySelector("#rtTransSrc");
  const tOut = panel.querySelector("#rtTransOut");
  if (tAr) tAr.addEventListener("click", () => {
    const txt = (tSrc.value || "").trim();
    tOut.textContent = txt ? `ترجمة شكلية للعربية: ${txt}` : "ألصق نصًا أولاً…";
  });
  if (tEn) tEn.addEventListener("click", () => {
    const txt = (tSrc.value || "").trim();
    tOut.textContent = txt ? `Pseudo translation to English: ${txt}` : "Paste text first…";
  });

  const notes = panel.querySelector("#rtNotes");
  const saveNotes = panel.querySelector("#rtSaveNotes");
  const clearNotes = panel.querySelector("#rtClearNotes");
  const LS_KEY = "rt_notes_v1";
  // Load notes
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) notes.value = saved;
  } catch (e) {}
  if (saveNotes) saveNotes.addEventListener("click", () => {
    try {
      localStorage.setItem(LS_KEY, notes.value || "");
      toast("تم حفظ الملاحظات ✅");
    } catch (e) { toast("تعذر الحفظ"); }
  });
  if (clearNotes) clearNotes.addEventListener("click", () => {
    notes.value = "";
    try { localStorage.removeItem(LS_KEY); } catch (e) {}
    toast("تم التفريغ");
  });

  // ========= Public API (open/close/toggle) =========
  function open() { panel.classList.add("rt-open"); }
  function close() { panel.classList.remove("rt-open"); }
  function toggle() { panel.classList.toggle("rt-open"); }

  rtCloseBtn.addEventListener("click", close);

  // Attach to window for your existing HUD button
  window.ReaderTools = { open, close, toggle, setActive };

  // Optional: auto-open once (comment if not desired)
  // open();

  // ========= Utilities =========
  function escapeHTML(s) {
    return (s || "").toString().replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }
  function toast(msg){
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = "position:fixed;bottom:22px;right:calc(var(--rt-width) + 20px);background:#0d1116;color:#eaf0f6;padding:10px 14px;border:1px solid #ffffff22;border-radius:10px;z-index:10060;box-shadow:0 8px 22px rgba(0,0,0,.5);font-family:Tajawal,system-ui,Arial";
    document.body.appendChild(t);
    setTimeout(()=>t.remove(),1800);
  }

})();

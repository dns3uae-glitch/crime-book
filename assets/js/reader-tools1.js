/* =====================================================================
   Reader Tools – CINEMATIC GOLD (Bottom Sheet, Right Trigger)
   - Button fixed (bottom-right), panel slides up from bottom
   - Matches previous cinematic (golden / frosted / halo / stars)
   - Provides ALL legacy IDs expected by your original reader-tools.js:
     * بحث:      #rt-q, #rt-google, #rt-wiki
     * ترجمة:    #rt-translate-text, #rt-translate-google
     * قاموس:    #rt-define-word, #rt-define-search, #rt-define-result
     * ملاحظات:  #rt-note-text, #rt-note-add, #rt-notes-list
     * تظليل:    #rt-hl-add, #rt-hl-list, #rt-hl-clear
     * صوت:      #rt-voice, #rt-rate, #rt-speak-text, #rt-speak, #rt-stop
     * ذكاء/س&ج: #rt-ai-ask, #rt-ai-go, #rt-ai-response
     * اختبارات: #rt-quiz-source, #rt-quiz-gen, #rt-quiz-out
     * نافذة طائرة للويكي/…: #rt-fly, #rt-flyTitle, #rt-fly-frame, #rt-fly-close
   - Public API: window.ReaderTools.open()/close()/toggle()/setTab(name)
   ===================================================================== */
(function () {
  const MOUNT = document.getElementById('reader-tools-root') || document.body;

  // ===================== Styles =====================
  const SID = 'rt-cine-style';
  if (!document.getElementById(SID)) {
    const css = `
:root{
  --gold:#d4af37; --gold-2:#ffe38b; --gold-3:#b9922e;
  --ink:#e8eefb; --bg:#0a0f14; --glass:#0f1317cc;
  --line:#ffffff16; --border:#ffffff22; --ink-dim:#b9c1cc;
  --shadow: 0 40px 120px rgba(0,0,0,.65);
}

#rtCineBtn{
  position:fixed; right:18px; bottom:18px; z-index:2147483601;
  background:linear-gradient(180deg, var(--gold), #cfa73a);
  color:#0a0c0f; border:0; border-radius:14px; padding:12px 16px;
  font-weight:900; cursor:pointer; box-shadow:0 0 18px rgba(212,175,55,.45);
}
#rtBackdrop{
  position:fixed; inset:0; display:none; z-index:2147483600;
  background:radial-gradient(1200px 700px at 50% 45%, rgba(212,175,55,.08), rgba(0,0,0,0)) , rgba(0,0,0,.55);
  backdrop-filter: blur(8px) saturate(1.06);
  overflow:hidden;
}
#rtBackdrop.show{ display:block; }

#rtStars::before,#rtStars::after{
  content:""; position:absolute; inset:-30%;
  background:
    radial-gradient(1px 1px at 10% 20%, #ffffffaa, transparent 2px),
    radial-gradient(1px 1px at 80% 30%, #ffffff99, transparent 2px),
    radial-gradient(1px 1px at 30% 70%, #ffffff66, transparent 2px),
    radial-gradient(1px 1px at 60% 80%, #ffffff88, transparent 2px),
    radial-gradient(1px 1px at 50% 40%, #ffffff77, transparent 2px);
  animation: drift 24s linear infinite; opacity:.25;
}
#rtStars::after{ animation-duration: 36s; opacity:.18; filter:blur(.6px) }
@keyframes drift{ from{ transform:translateY(0)} to{ transform:translateY(-6%)} }

#rtCineWin{
  position:absolute; left:50%; bottom:18px; transform:translateX(-50%) translateY(110%) scale(.98);
  width:min(1200px, 96vw); height:min(72vh, 760px);
  border-radius:18px; overflow:hidden; background:#0d1116;
  box-shadow:
    var(--shadow),
    0 0 0 1px rgba(255,255,255,.06),
    0 0 0 2px rgba(212,175,55,.10) inset,
    0 0 120px 20px rgba(212,175,55,.10) inset;
  opacity:0; filter:saturate(1.05) contrast(1.02);
  transition: transform .55s cubic-bezier(.18,.88,.26,1.04), opacity .35s ease;
}
#rtBackdrop.show #rtCineWin{
  opacity:1; transform:translateX(-50%) translateY(0) scale(1);
}

#rtHalo{
  position:absolute; inset:-20%;
  background: radial-gradient(600px 380px at 50% 6%, rgba(255,230,160,.15), transparent 70%),
              radial-gradient(1200px 800px at 50% -30%, rgba(255,255,255,.06), transparent 55%);
  pointer-events:none; mix-blend-mode:screen; filter: blur(8px) saturate(1.08);
}
#rtAber{
  position:absolute; inset:-1px; pointer-events:none; mix-blend-mode:screen; opacity:.22; filter:blur(.4px);
  background: conic-gradient(from 0deg, rgba(255,0,0,.08), rgba(0,255,255,.08), rgba(255,0,255,.08), rgba(255,0,0,.08));
  mask: radial-gradient(100% 100% at 50% 50%, black 60%, transparent 100%);
}
.spark{ position:absolute;width:4px;height:4px;border-radius:50%;background:#ffe9a8;box-shadow:0 0 12px 4px #ffe9a899; animation: twinkle 2.2s ease-in-out infinite alternate;}
.s1{left:14px;top:12px}.s2{right:18px;bottom:14px}
@keyframes twinkle{ from{ transform:scale(.9)} to{ transform:scale(1.25)} }

#rtHead{
  display:flex;justify-content:space-between;align-items:center;gap:12px;
  padding:14px 16px; border-bottom:1px solid rgba(255,255,255,.06);
  background:linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,0));
  color:#fff; font-family:"Tajawal",system-ui,Arial;
}
#rtBrand{display:flex;align-items:center;gap:12px}
#rtLogo{
  width:40px;height:40px;border-radius:10px;
  background:conic-gradient(from 0deg, var(--gold-2), var(--gold), var(--gold-3), var(--gold-2));
  box-shadow:0 6px 18px rgba(212,175,55,.22);
  display:grid;place-items:center;color:#0b0f13;font-weight:900;
}
#rtTitle{margin:0;color:var(--gold);font-weight:900;font-size:18px}
#rtSub{margin:0;color:#aeb6c3;font-size:12px}

.rtb{background:#121821;border:1px solid rgba(255,255,255,.08);color:#fff;padding:8px 12px;border-radius:10px;cursor:pointer;font-weight:800}
.rtb.gold{background:var(--gold);border:0;color:#0a0c0f}
.rtb.ghost{background:transparent;border-color:rgba(212,175,55,.22);color:var(--gold)}

#rtBody{display:flex;height:calc(100% - 58px);font-family:"Tajawal",system-ui,Arial}
#rtLeft{width:320px;min-width:260px;padding:12px;background:linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,.01));
  border-inline-end:1px solid rgba(255,255,255,.06); color:#e7eefc; overflow:auto}
.rti{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);padding:10px;border-radius:10px;cursor:pointer;margin-bottom:10px}
.rti h4{margin:0;color:#ffd977;font-size:14px;font-weight:900}
.rti p{margin:6px 0 0;color:#aeb6c3;font-size:12px}
.rti.active{outline:2px solid rgba(212,175,55,.35)}

#rtRight{flex:1;display:flex;flex-direction:column;gap:10px;padding:12px;background:linear-gradient(180deg,#070b10,#05080c)}
#rtTabs{ display:grid; grid-template-columns: repeat(6, 1fr); gap:8px; padding:6px 8px; }
.tab{display:flex;align-items:center;justify-content:center;gap:7px;height:38px;cursor:pointer;
  background: linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.015));
  border:1px solid #ffffff1c; border-radius:10px; color:#e9edf6; font-weight:800; font-size:12px}
.tab.active{border-color:#ffffff3a; box-shadow: inset 0 0 0 1px #ffffff22, 0 6px 16px rgba(0,0,0,.25)}
.tab .ico{width:17px;height:17px;stroke:currentColor;fill:none;stroke-width:2}

#rtMain{position:relative;flex:1;border-radius:12px;overflow:hidden;background:#0a1016;display:grid;grid-template-columns: 1fr; grid-auto-rows: 1fr; padding:12px; gap:12px}
.card{background: linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,.01));
  border:1px solid #ffffff16; border-radius:12px; padding:12px; color:#eaf0f6}
.lab{font-size:12px;color:#b9c1cc;margin-bottom:6px;font-weight:700;letter-spacing:.2px}
.row{display:flex;gap:8px;align-items:center}
.inp, .area, .out{
  width:100%; border:1px solid #ffffff1c; border-radius:10px;
  background:#0b0f14; color:#eaf0f6; padding:10px; font-family:inherit; font-size:14px
}
.area{min-height:110px; resize:vertical}
.out{min-height:110px; background:#0d1116}

#rtFlash{position:absolute;inset:0;pointer-events:none;opacity:0;
  background:radial-gradient(600px 280px at 50% 50%, rgba(255,255,255,.28), transparent 55%);mix-blend-mode:screen;transition:opacity .25s}
.flashOn{opacity:1}

#rtFly{position:absolute; right:12px; bottom:12px; width:min(520px, 96%); height:min(58vh,420px);
  background:#0d1116; border:1px solid #ffffff26; border-radius:12px; overflow:hidden; display:none; z-index:3}
#rtFlyHead{display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-bottom:1px solid #ffffff16;color:#eaf0f6}
#rt-flyTitle{font-weight:900}
#rt-fly-close{cursor:pointer;border-radius:8px;border:1px solid #ffffff1c;padding:4px 8px}
#rt-fly-frame{width:100%;height:calc(100% - 40px);border:0;display:block;filter:saturate(1.02) contrast(1.02)}

@media(max-width:920px){
  #rtLeft{display:none}
  #rtTabs{grid-template-columns: repeat(3, 1fr)}
}
`;
    const st = document.createElement('style');
    st.id = SID;
    st.textContent = css;
    document.head.appendChild(st);
  }

  // ===================== Markup =====================
  const btn = document.createElement('button');
  btn.id = 'rtCineBtn';
  btn.textContent = '🧰 أدوات القارئ';
  MOUNT.appendChild(btn);

  const backdrop = document.createElement('div');
  backdrop.id = 'rtBackdrop';
  backdrop.innerHTML = `
    <div id="rtStars"></div>
    <div id="rtCineWin" role="dialog" aria-label="Reader Tools (Cinematic)">
      <div id="rtHalo"></div>
      <div id="rtAber"></div>
      <div class="spark s1"></div><div class="spark s2"></div>

      <header id="rtHead">
        <div id="rtBrand">
          <div id="rtLogo">RT</div>
          <div>
            <h3 id="rtTitle">أدوات القارئ</h3>
            <p id="rtSub">لوحة ذهبية زجاجية — متوافقة مع سكربتك الأصلي</p>
          </div>
        </div>
        <div>
          <button class="rtb ghost" id="rtHow">؟ تعليمات</button>
          <button class="rtb gold" id="rtClose">إغلاق</button>
        </div>
      </header>

      <section id="rtBody">
        <aside id="rtLeft">
          <div class="rti active"><h4>📘 مجموعة القارئ</h4><p>بحث/ترجمة/قاموس/ملاحظات/تظليل/صوت/ذكاء/اختبارات</p></div>
          <div class="rti"><h4>🔗 روابط سريعة</h4><p>ويكي/بحث جوجل داخل إطار طائر</p></div>
        </aside>

        <main id="rtRight">
          <nav id="rtTabs" role="tablist">
            <button class="tab active" data-tab="search">${ico('search')}بحث</button>
            <button class="tab" data-tab="translate">${ico('arrows')}ترجمة</button>
            <button class="tab" data-tab="define">${ico('book')}قاموس</button>
            <button class="tab" data-tab="notes">${ico('edit')}ملاحظات</button>
            <button class="tab" data-tab="highlight">${ico('marker')}تظليل</button>
            <button class="tab" data-tab="voice">${ico('voice')}صوت</button>
            <button class="tab" data-tab="ai">${ico('spark')}ذكاء</button>
            <button class="tab" data-tab="quiz">${ico('quiz')}اختبارات</button>
          </nav>

          <div id="rtMain">
            <!-- Search -->
            <section class="card" data-pane="search">
              <div class="lab">ابحث في جوجل أو ويكي</div>
              <div class="row">
                <input class="inp" id="rt-q" placeholder="اكتب سؤالك أو ظلّل نصًا في الصفحة…" />
                <button class="rtb" id="rt-google">${ico('search')} Google</button>
                <button class="rtb" id="rt-wiki">Wikipedia</button>
              </div>
              <div id="rtFly" aria-hidden="true">
                <div id="rtFlyHead">
                  <div id="rt-flyTitle">Viewer</div>
                  <button id="rt-fly-close">إغلاق</button>
                </div>
                <iframe id="rt-fly-frame" title="Flyout"></iframe>
              </div>
            </section>

            <!-- Translate -->
            <section class="card" data-pane="translate" hidden>
              <div class="lab">ترجمة سريعة</div>
              <textarea class="area" id="rt-translate-text" placeholder="ألصق نصّك هنا أو استخدم النص المظلل…"></textarea>
              <div class="row" style="margin-top:8px">
                <button class="rtb gold" id="rt-translate-google">${ico('arrows')} فتح Google Translate</button>
              </div>
            </section>

            <!-- Define -->
            <section class="card" data-pane="define" hidden>
              <div class="lab">شرح مصطلح (English only)</div>
              <div class="row">
                <input class="inp" id="rt-define-word" placeholder="اكتب كلمة إنجليزية…" />
                <button class="rtb" id="rt-define-search">${ico('search')} بحث</button>
              </div>
              <div class="out" id="rt-define-result" style="margin-top:8px"></div>
            </section>

            <!-- Notes -->
            <section class="card" data-pane="notes" hidden>
              <div class="lab">ملاحظات الصفحة</div>
              <div class="row">
                <input class="inp" id="rt-note-text" placeholder="ملاحظة جديدة…" />
                <button class="rtb" id="rt-note-add">${ico('save')} إضافة</button>
              </div>
              <div id="rt-notes-list" style="margin-top:10px"></div>
            </section>

            <!-- Highlight -->
            <section class="card" data-pane="highlight" hidden>
              <div class="lab">تظليل النصوص</div>
              <div class="row">
                <button class="rtb" id="rt-hl-add">${ico('marker')} تظليل المحدد</button>
                <button class="rtb" id="rt-hl-clear">${ico('trash')} مسح التظليلات</button>
              </div>
              <div id="rt-hl-list" class="out" style="margin-top:10px;min-height:60px"></div>
            </section>

            <!-- Voice -->
            <section class="card" data-pane="voice" hidden>
              <div class="lab">القراءة الصوتية</div>
              <div class="row">
                <select class="inp" id="rt-voice"></select>
                <input type="range" id="rt-rate" min="0.5" max="1.5" step="0.05" value="1" />
              </div>
              <textarea class="area" id="rt-speak-text" placeholder="ألصق النص أو استخدم النص المظلل…"></textarea>
              <div class="row" style="margin-top:8px">
                <button class="rtb gold" id="rt-speak">تشغيل</button>
                <button class="rtb" id="rt-stop">إيقاف</button>
              </div>
            </section>

            <!-- AI Q&A -->
            <section class="card" data-pane="ai" hidden>
              <div class="lab">سؤال للذكاء</div>
              <div class="row">
                <input class="inp" id="rt-ai-ask" placeholder="اكتب سؤالك…" />
                <button class="rtb" id="rt-ai-go">${ico('spark')} اسأل</button>
              </div>
              <div id="rt-ai-response" style="margin-top:10px"></div>
            </section>

            <!-- Quiz -->
            <section class="card" data-pane="quiz" hidden>
              <div class="lab">توليد اختبار تدريبي من نص</div>
              <textarea class="area" id="rt-quiz-source" placeholder="ألصق فقرة؛ السكربت الأصلي سيتولى النداء على الخادم/المولد…"></textarea>
              <div class="row" style="margin-top:8px">
                <button class="rtb gold" id="rt-quiz-gen">${ico('quiz')} توليد الاختبار</button>
              </div>
              <div class="out" id="rt-quiz-out" style="margin-top:10px"></div>
            </section>

            <div id="rtFlash"></div>
          </div>
        </main>
      </section>
    </div>
  `;
  MOUNT.appendChild(backdrop);

  // ===================== Behavior =====================
  const tabs = Array.from(backdrop.querySelectorAll('.tab'));
  const panes = Array.from(backdrop.querySelectorAll('[data-pane]'));
  const closeBtn = backdrop.querySelector('#rtClose');
  const howBtn = backdrop.querySelector('#rtHow');
  const fly = backdrop.querySelector('#rtFly');
  const flyClose = backdrop.querySelector('#rt-fly-close');
  const flash = backdrop.querySelector('#rtFlash');

  function setTab(name){
    tabs.forEach(t=>{
      const on = t.getAttribute('data-tab')===name;
      t.classList.toggle('active', on);
    });
    panes.forEach(p=>{
      p.hidden = (p.getAttribute('data-pane')!==name);
    });
  }

  tabs.forEach(t=> t.addEventListener('click', ()=> setTab(t.getAttribute('data-tab')) ));
  flyClose.addEventListener('click', ()=> fly.style.display='none');

  function sfx(type='open'){
    try{
      const ctx = new (window.AudioContext||window.webkitAudioContext)();
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type='sine'; o.frequency.value=(type==='open')? 280 : 180;
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime+0.38);
    }catch(e){}
  }
  function open(){
    backdrop.classList.add('show');
    requestAnimationFrame(()=> flash.classList.add('flashOn'));
    setTimeout(()=> flash.classList.remove('flashOn'), 260);
    sfx('open');
  }
  function close(){
    backdrop.classList.remove('show'); sfx('close');
    fly.style.display='none';
  }
  function toggle(){ (backdrop.classList.contains('show')? close:open)(); }

  btn.addEventListener('click', toggle);
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', (e)=>{ if(e.target===backdrop) close(); });
  window.addEventListener('keydown', (e)=>{ if(e.key==='Escape') close(); });

  howBtn.addEventListener('click', ()=>{
    alert('لوحة أدوات القارئ السينمائية:\n- زر ثابت أسفل اليمين\n- تسحب من الأسفل مع لمعان ذهبي\n- جميع المعرفات IDs متوافقة مع سكربتك القديم\n\nملاحظة: بعض الخدمات الخارجية قد تفتح نافذة إذا منع المتصفح التضمين.');
  });

  // expose API
  window.ReaderTools = { open, close, toggle, setTab };

  // Helper: icons
  function ico(name){
    const S = 'currentColor';
    const wrap = d => `<svg class="ico" viewBox="0 0 24 24"><path d="${d}" stroke="${S}" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    switch(name){
      case 'search': return wrap('M21 21l-4.35-4.35M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z');
      case 'arrows': return wrap('M8 3l-5 5 5 5M16 21l5-5-5-5M3 8h18M3 16h18');
      case 'book': return `<svg class="ico" viewBox="0 0 24 24"><path d="M12 4c-2 .5-4 1-6 1v13c2 0 4 .5 6 1m0-15c2 .5 4 1 6 1v13c-2 0-4 .5-6 1" stroke="${S}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      case 'edit': return wrap('M12 20h9M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z');
      case 'marker': return wrap('M3 17l6 4 12-12-6-4-12 12z');
      case 'voice': return wrap('M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zm-7 8a7 7 0 0 0 14 0M12 19v3');
      case 'spark': return `<svg class="ico" viewBox="0 0 24 24"><path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3zM19 16l.9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9L19 16z" stroke="${S}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      case 'quiz': return wrap('M9 7h6M8 11h8M10 15h4M4 5h16v14H4z');
      case 'trash': return wrap('M3 6h18M8 6V4h8v2m-1 0v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6h10z');
      case 'save': return wrap('M19 21H5a2 2 0 0 1-2-2V7l4-4h9l5 5v11a2 2 0 0 1-2 2zM7 3v5h8');
      default: return '';
    }
  }

  // =============== Minimal built-ins so your old JS finds targets ===============
  // فتح إطار ويكي/نتائج داخل fly box عندما يستدعيه سكربتك
  const wikiBtn = backdrop.querySelector('#rt-wiki');
  const googleBtn = backdrop.querySelector('#rt-google');
  const qInp = backdrop.querySelector('#rt-q');
  const flyFrame = backdrop.querySelector('#rt-fly-frame');
  if (wikiBtn) {
    wikiBtn.addEventListener('click', ()=>{
      const q = (qInp.value || '').trim();
      backdrop.querySelector('#rt-flyTitle').textContent='Wikipedia';
      flyFrame.src = q ? `https://wikipedia.org/w/index.php?search=${encodeURIComponent(q)}` : 'https://wikipedia.org';
      fly.style.display='block';
    });
  }
  if (googleBtn) {
    googleBtn.addEventListener('click', ()=>{
      const q = (qInp.value || '').trim();
      if (q) {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, 'googlePopup','width=900,height=600,top=100,left=200');
      } else {
        window.open(`https://www.google.com`, 'googlePopup','width=900,height=600,top=100,left=200');
      }
    });
  }

  // افتح تلقائيًا عند أول تحميل إن رغبت
  // open();

})();

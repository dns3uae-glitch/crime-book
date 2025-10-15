/* ============================================================
   📘 reader-tools.js — الأكاديمية التفاعلية (نسخة متكاملة)
   - فتح تلقائي عند تحديد النص + Popover ألوان
   - تظليل + ملاحظات مع تأكيد داخلي (بدون confirm/alert)
   - بحث: Google (Popup) / Wikipedia (داخل الصفحة)
   - قراءة صوتية: اختيار القارئ + السرعة + تشغيل/إيقاف
   - تصميم أسود × أزرق شرطي × ذهبي — خط Cairo — دخول ناعم
   ============================================================ */
(function(){
  "use strict";

  /* -------------------- مفاتيح التخزين -------------------- */
  const PAGE_KEY = location.pathname || "page";
  const KEYS = { HL:'rt_v6_highlights', NOTES:'rt_v6_notes', VOICE:'rt_v6_voice' };

  /* -------------------- الحالة العامة -------------------- */
  const STATE = {
    selectionRange: null,
    selectedText: '',
    voices: [],
    voicePrefs: load(KEYS.VOICE, { rate: 1, voiceURI: '' })
  };

  /* -------------------- ألوان التظليل -------------------- */
  const COLORS = [
    '#FFD54A','#8fd3ff','#b2f2bb','#0B1099','#ffc78e','#4F1611','#C2B0BF','#FAD4FF','#4B5B5C','#FFFFFF',
    '#F7FCBB','#FAAE23','#c6c6c6','#ff9aa2','#7ee0e6','#4A990B','#FAD4FF','#7286BA','#4E5C4B','#B487FF',
    '#D9D9CC','#DCE665','#B37C1D','#fecaca','#fde68a','#FF2800'
  ];

  /* -------------------- قاعدة البيانات (localStorage) -------------------- */
  const DB = {
    hl: load(KEYS.HL, {}),      // { [page]: [ {id,text,color,note,ts} ] }
    notes: load(KEYS.NOTES, {}),// { [page]: [ {text,ts} ] }
  };
  DB.hl[PAGE_KEY] ??= [];
  DB.notes[PAGE_KEY] ??= [];

  function load(k, fallback){ try{ return JSON.parse(localStorage.getItem(k)||'') || fallback; }catch{ return fallback; } }
  function save(k, v){ localStorage.setItem(k, JSON.stringify(v)); }

  /* -------------------- CSS -------------------- */
  const style = document.createElement('style');
  style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600&display=swap');
  .rt-root, .rt-panel, .rt-pop, .rt-fab, .rt-fly { font-family:"Cairo",system-ui,sans-serif; direction:${document.dir||'rtl'}; }

#rt-sec-define b {
  color: #FFD54A;
}
#rt-sec-define .rt-box {
  line-height: 1.6;
}

  /* زر عائم */
  .rt-fab{
    position:fixed; bottom:28px; ${document.dir==='ltr'?'left:22px;':'right:22px;'}
    background:linear-gradient(145deg,rgba(10,20,40,.9),rgba(0,0,0,.95));
    color:#FFD54A; border:1px solid rgba(0,120,255,.45); border-radius:14px;
    padding:10px 16px; box-shadow:0 0 20px rgba(0,120,255,.3), inset 0 0 10px rgba(0,80,255,.2);
    cursor:pointer; z-index:99991; transition:.3s
  }
  .rt-fab:hover{ transform:translateY(-2px); color:#fff }

  /* اللوحة الرئيسية */
  .rt-panel{
    position:fixed; bottom:90px; ${document.dir==='ltr'?'left:22px;':'right:22px;'}
    width:min(420px,95vw); max-height:82vh; overflow:auto; z-index:99990;
    background:rgba(10,15,25,.86); border:1px solid rgba(0,120,255,.4); border-radius:18px;
    box-shadow:0 0 25px rgba(0,80,255,.3), inset 0 0 15px rgba(255,215,0,.15);
    color:#eaf2ff; padding:14px; opacity:0; transform:translateY(40px);
    pointer-events:none; transition:all .45s ease
  }
  .rt-panel.active{ opacity:1; transform:translateY(0); pointer-events:auto }

.rt-head{
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  align-items:center;
  margin-bottom:10px;
  justify-content:center;
}
.rt-head span{
  flex-basis:100%;
  text-align:center;
  margin-top:4px;
  font-size:1rem;
  color:#FFD54A;
  white-space:nowrap;
}
  .rt-tab{
    padding:8px 10px; border-radius:10px;
    border:1px solid rgba(0,120,255,.35); cursor:pointer; background:transparent; color:#bfe0ff
  }
  .rt-tab.active{ color:#fff; box-shadow:0 0 16px rgba(0,120,255,.35), inset 0 0 12px rgba(0,80,255,.2) }
  .rt-sec{ display:none } .rt-sec.active{ display:block }

  .rt-row{ display:flex; gap:8px; flex-wrap:wrap; margin:8px 0 }
  .rt-btn{
    border:1px solid rgba(255,215,0,.28); color:#FFD54A; background:transparent;
    border-radius:10px; padding:6px 10px; cursor:pointer; font-size:.95rem;
    transition:.2s; box-shadow:inset 0 0 10px rgba(0,80,255,.18)
  }
  .rt-btn:hover{ color:#fff; transform:translateY(-1px) }
  .rt-mini{ padding:4px 8px; font-size:.82rem }
  .rt-chip{ padding:6px 10px; border-radius:12px; border:1px solid rgba(255,255,255,.2); background:rgba(255,255,255,.06) }

  .rt-input, .rt-textarea, .rt-select{
    flex:1; background:rgba(255,255,255,.06); border:1px solid rgba(255,215,0,.28);
    color:#fff; border-radius:10px; padding:8px; font-family:inherit
  }
  .rt-textarea{ width:100%; min-height:70px; }
/* ✅ تنسيق الأزرار العلوية (Tabs) ليكون شكلها أفقي متناسق */
.rt-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  justify-content: center;
  align-items: center;
  padding: 6px;
}

.rt-tab {
  flex: 1 1 80px;
  text-align: center;
  padding: 6px 10px;
  border-radius: 8px;
  background: #222;
  color: #FFD54A;
  border: 1px solid #444;
  transition: all 0.3s ease;
}

.rt-tab:hover {
  background: #333;
  transform: scale(1.05);
}

.rt-tab.active {
  background: #FFD54A;
  color: #000;
  font-weight: bold;
}

  /* التظليلات */
  mark.rt-hl{ padding:0 .15em; border-radius:.2em; box-shadow:inset 0 -2px 0 rgba(0,0,0,.15); cursor:pointer }
  mark.rt-hl.rt-active{ outline:2px solid rgba(10,107,255,.45) }
  .rt-color{ width:22px; height:22px; border-radius:7px; border:1px solid rgba(255,255,255,.35); cursor:pointer }

  .rt-list{ display:flex; flex-direction:column; gap:10px }
  .rt-item{ border:1px solid rgba(255,215,0,.22); border-radius:12px; padding:10px; background:rgba(255,255,255,.05) }
  .rt-title{ color:#FFD54A; font-weight:700 }

  /* نافذة Wikipedia داخل الصفحة */
  .rt-fly{
    position:fixed; inset:auto 10px 10px auto; ${document.dir==='ltr'?'left:10px; right:auto;':''}
    width:min(520px,92vw); height:min(60vh,520px); z-index:99995; background:#000;
    border:1px solid rgba(0,120,255,.45); border-radius:14px; overflow:hidden; display:none;
    box-shadow:0 0 24px rgba(0,120,255,.35)
  }
  .rt-flyHead{ display:flex; align-items:center; gap:8px; padding:8px 10px;
    background:linear-gradient(145deg,rgba(10,20,40,.92),rgba(0,0,0,.98)); border-bottom:1px solid rgba(0,120,255,.35); color:#bfe0ff }
  .rt-flyHead b{ color:#fff } .rt-fly iframe{ width:100%; height:100%; border:0 }
  .rt-close{ margin-inline-start:auto }

  /* Popover فوق التحديد */
  .rt-pop{
    position:fixed; z-index:99999; display:none; gap:10px; align-items:center;
    background:linear-gradient(145deg,rgba(10,20,40,.86),rgba(0,0,0,.96));
    border:1px solid rgba(0,120,255,.45); padding:10px 12px; border-radius:12px;
    box-shadow:0 0 20px rgba(0,120,255,.28), inset 0 0 12px rgba(0,80,255,.16);
    backdrop-filter: blur(8px); color:#eaf2ff
  }

  /* تأكيد داخلي + رسائل */
  .rt-confirm { margin-top:6px;padding:6px;border-radius:8px;background:rgba(255,255,255,.05);display:flex;justify-content:space-between;align-items:center;animation:fadein .25s ease }
  .rt-msg { background:rgba(0,80,255,.15);border:1px solid rgba(0,120,255,.4);color:#8fd3ff;border-radius:8px;padding:4px 8px;font-size:.85rem;margin-top:6px;text-align:center;animation:fadein .25s ease }
  @keyframes fadein { from{opacity:0} to{opacity:1} }

  /* قائمة الأصوات داكنة وواضحة */
/* تنسيق المساعد الذكي */
#rt-sec-ai {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

#rt-ai-response {
  display: flex;
  flex-direction: column-reverse; /* يجعل آخر رد بالأعلى */
  gap: 6px;
  overflow-y: auto;
  max-height: 250px;
  background: #0f1520;
  border: 1px solid rgba(0,120,255,.3);
  border-radius: 10px;
  padding: 10px;
}

.chat-message {
  word-wrap: break-word;
}

  #rt-voice { background:rgba(20,30,45,.9); color:#fff; border:1px solid rgba(0,120,255,.4); border-radius:8px; padding:8px }
  #rt-voice option { background:#0f1520; color:#fff; }
#rt-voice option:hover { background:rgba(0,120,255,.35); }

/* ✅ إخفاء كل محتوى المساعد الذكي عند عدم تفعيل التبويب */
#rt-sec-ai:not(.active) {
  display: none !important;
}
`;
document.head.appendChild(style);


  /* -------------------- إنشاء عناصر الواجهة -------------------- */
  const fab = el('button','rt-fab','🎓 أدوات القارئ');
  document.body.appendChild(fab);

  const panel = el('div','rt-panel',`
    <div class="rt-head">
      <button class="rt-tab active" data-tab="hl">⭐ التظليلات</button>
      <button class="rt-tab" data-tab="notes">📒 الملاحظات</button>
      <button class="rt-tab" data-tab="voice">🔊 الصوت</button>
      <button class="rt-tab" data-tab="search">🔎 البحث</button>
      <button class="rt-tab" data-tab="translate">🌍 الترجمة</button>
      <button class="rt-tab" data-tab="define">📘 شرح المصطلحات</button>
          <button class="rt-tab" data-tab="summary">🧠 التلخيص</button>
         <button class="rt-tab" data-tab="quiz">🧩 اختبر نفسك</button>
     <button class="rt-tab" data-tab="ai">🤖 Ask AI</button>
    </div>

    <!-- التظليلات -->
    <section class="rt-sec active" id="rt-sec-hl">
      <div class="rt-title">ألوان التظليل</div>
      <div class="rt-row" id="rt-colors"></div>
      <div class="rt-title" style="margin-top:8px">قائمة التظليلات</div>
      <div class="rt-list" id="rt-hl-list"></div>
    </section>

    <!-- الملاحظات -->
    <section class="rt-sec" id="rt-sec-notes">
      <div class="rt-row"><textarea id="rt-note-input" class="rt-textarea" placeholder="ملخص/أفكار عامة للصفحة…"></textarea></div>
      <div class="rt-row">
        <button class="rt-btn rt-mini" id="rt-note-add">إضافة</button>
        <button class="rt-btn rt-mini" id="rt-note-export">تصدير JSON</button>
        <button class="rt-btn rt-mini" id="rt-note-clear">حذف الكل</button>
        <span class="rt-chip" style="margin-inline-start:auto">يحفظ تلقائيًا</span>
      </div>
      <div class="rt-list" id="rt-notes-list"></div>
    </section>

<!-- الصوت -->
<section class="rt-sec" id="rt-sec-voice">
  <div class="rt-row">
    <select id="rt-voice" class="rt-select" style="min-width:200px"></select>
    <label class="rt-chip">السرعة: 
      <input id="rt-rate" type="range" min="0.6" max="1.4" step="0.1" 
        value="${STATE.voicePrefs.rate||1}" style="vertical-align:middle">
    </label>
  </div>

  <!-- خانة النص المحدد -->
  <div class="rt-row">
    <input id="rt-speak-text" class="rt-input" placeholder="النص المراد قراءته (يُضاف تلقائيًا عند التظليل)">
  </div>

  <div class="rt-row">
    <button class="rt-btn" id="rt-speak">تشغيل القراءة</button>
    <button class="rt-btn" id="rt-stop">إيقاف</button>
    <span class="rt-chip">ظلّل نصًا ليتم إدراجه تلقائيًا هنا</span>
  </div>
</section>


<!-- البحث -->
<section class="rt-sec" id="rt-sec-search">
  <div class="rt-row">
    <input id="rt-q" class="rt-input" placeholder="اكتب/أدخل عبارة البحث…">
  </div>
  <div class="rt-row">
    <button class="rt-btn" id="rt-google">Google (Popup)</button>
    <button class="rt-btn" id="rt-wiki">Wikipedia (داخل الصفحة)</button>
  </div>
</section>

<!-- الترجمة -->
<section class="rt-sec" id="rt-sec-translate">
  <div class="rt-title">ترجمة النصوص</div>
  <div class="rt-row">
    <input id="rt-translate-text" class="rt-input" placeholder="أدخل النص للترجمة أو ظلّل كلمة">
  </div>
  <div class="rt-row">
    <button class="rt-btn" id="rt-translate-google">Google Translate (Popup)</button>
  </div>
</section>
<!-- شرح المصطلحات -->
<section class="rt-sec" id="rt-sec-define">
  <div class="rt-title">📘 شرح المصطلحات (Oxford / Cambridge)</div>
  <div class="rt-row">
    <input id="rt-define-word" class="rt-input" placeholder="اكتب كلمة أو ظلّلها في النص">
    <button class="rt-btn" id="rt-define-search">بحث</button>
  </div>
  <div class="rt-row">
    <div id="rt-define-result" class="rt-box" style="
      background:#1e1e1e;
      color:#FFD54A;
      padding:10px;
      border-radius:8px;
      min-height:70px;">
      ✨ ستظهر نتيجة الشرح هنا...
    </div>
  </div>
</section>
<!-- 🧠 التلخيص الذكي -->
<section class="rt-sec" id="rt-sec-summary">
  <div class="rt-title">🧠 التلخيص الذكي - Smart Summary</div>
  <div class="rt-row">
    <textarea id="rt-summary-input" class="rt-input" rows="3"
      placeholder="أدخل فقرة أو ظلّل نصًا ليتم تلخيصه..."></textarea>
  </div>
  <div class="rt-row">
<button class="rt-btn" id="rt-summary-btn">تلخيص النص</button>
<button class="rt-btn" id="rt-summary-copy">📋 نسخ الملخص</button>
  </div>
  <div class="rt-row">
    <div id="rt-summary-output" class="rt-box"
      style="min-height:60px; background:#1e1e1e; color:#FFD54A; padding:10px; border-radius:8px;">
      ✨ سيظهر الملخص هنا...
    </div>
  </div>
</section>
<!-- 🧩 اختبر نفسك - Smart Quiz -->
<section class="rt-sec" id="rt-sec-quiz">
  <div class="rt-title">🧩 اختبر نفسك - Smart Quiz</div>
  <div class="rt-row">
    <textarea id="rt-quiz-input" class="rt-input" rows="3"
      placeholder="ظلّل فقرة أو أدخل نصًا ليتم إنشاء اختبار منها..."></textarea>
  </div>
  <div class="rt-row">
    <button class="rt-btn" id="rt-quiz-btn">إنشاء الأسئلة</button>
  </div>
  <div class="rt-row">
    <div id="rt-quiz-output" class="rt-box"
      style="min-height:80px; background:#1e1e1e; color:#FFD54A; padding:12px; border-radius:10px;">
      ✨ ستظهر الأسئلة هنا...
    </div>
  </div>
</section>

<!-- ✅ المساعد الذكي (داخل نفس div وليس خارجها) -->
<section class="rt-sec" id="rt-sec-ai">
  <div class="rt-title">🤖 المساعد الذكي - Ask AI</div>
  <div class="rt-row">
    <textarea id="rt-ai-input" class="rt-input" rows="3"
      placeholder="اكتب سؤالك أو ظلّل فقرة ليشرحها المساعد..."></textarea>
  </div>
  <div class="rt-row">
    <button class="rt-btn" id="rt-ai-ask">اسأل الذكاء</button>
  </div>
  <div class="rt-row">
    <div id="rt-ai-response" class="rt-box"
      style="min-height:60px; background:#1e1e1e; color:#FFD54A; padding:10px; border-radius:8px;">
      ✨ ستظهر إجابة المساعد هنا...
    </div>
  </div>
</section>

</div> <!-- ✅ هنا يُغلق div الخاصة بكل الأقسام -->

`);
document.body.appendChild(panel);



  const fly = el('div','rt-fly',`
    <div class="rt-flyHead"><b id="rt-flyTitle">Wikipedia</b><button class="rt-btn rt-mini rt-close" id="rt-fly-close">إغلاق</button></div>
    <iframe id="rt-fly-frame"></iframe>
  `);
  document.body.appendChild(fly);

  /* -------------------- تبويبات اللوحة -------------------- */
// ✅ إعادة تفعيل نظام التبويبات بعد تحميل كل الأقسام (بما فيها Ask AI)
const tabs = panel.querySelectorAll('.rt-tab');
const secs = panel.querySelectorAll('.rt-sec');

function activateTab(tabName){
  tabs.forEach(x=>x.classList.remove('active'));
  secs.forEach(s=>s.classList.remove('active'));
  const tabBtn = panel.querySelector(`[data-tab="${tabName}"]`);
  const tabSec = panel.querySelector(`#rt-sec-${tabName}`);
  if(tabBtn) tabBtn.classList.add('active');
  if(tabSec) tabSec.classList.add('active');
}

tabs.forEach(b=>{
  b.addEventListener('click',()=> activateTab(b.dataset.tab));
});


  fab.addEventListener('click', ()=> panel.classList.toggle('active'));
  document.getElementById('rt-fly-close').onclick = ()=> fly.style.display='none';

  /* -------------------- ألوان التظليل (لوحتين: رئيسية وPopover) -------------------- */
  renderColors('#rt-colors', 22);

  function renderColors(selector, size){
    const wrap = document.querySelector(selector); wrap.innerHTML='';
    COLORS.forEach(c=>{
      const d=el('div','rt-color'); d.style.background=c; d.style.width=d.style.height=size+'px';
      d.title=c; d.onclick=()=> applyHighlight(c); wrap.appendChild(d);
    });
  }

  /* -------------------- التقاط التحديد + فتح الأدوات تلقائيًا -------------------- */
document.addEventListener('mouseup', ()=> setTimeout(handleSelection, 100), {passive:true});
  document.addEventListener('touchend', ()=> setTimeout(handleSelection, 0), {passive:true});
  document.addEventListener('keydown', e=>{ if(e.key==='Escape'){ window.getSelection()?.removeAllRanges();  } });

function handleSelection(){
  const sel = window.getSelection();
  const txt = (sel && sel.toString().trim()) || '';
  if(!txt) return;

  // 🚫 تجاهل التحديد داخل أدوات القارئ (حتى لا يخرج من الأداة)
  if (sel && sel.anchorNode && panel.contains(sel.anchorNode)) {
    return;
  }

  // حفظ النص المحدد في الذاكرة
  STATE.selectionRange = sel.getRangeAt(0).cloneRange();
  STATE.selectedText = txt;

  // ✅ إزالة التحديد من الصفحة فقط حتى لا يمنع النقر
  sel.removeAllRanges();

  // تعبئة الحقول تلقائيًا في جميع الأدوات
  const q = document.getElementById('rt-q'); 
  if(q) q.value = txt;

  const speakInput = document.getElementById('rt-speak-text');
  if(speakInput) speakInput.value = txt;

  const translateInput = document.getElementById('rt-translate-text');
  if(translateInput) translateInput.value = txt;

  const summaryInput = document.getElementById('rt-summary-input');
  if(summaryInput) summaryInput.value = txt;

  const quizInput = document.getElementById('rt-quiz-input');
  if(quizInput) quizInput.value = txt;

  // فتح اللوحة إن لم تكن مفتوحة
  if (!panel.classList.contains('active')) panel.classList.add('active');

  // تفعيل تبويب التظليلات افتراضيًا
  tabs.forEach(x => x.classList.remove('active'));
  secs.forEach(s => s.classList.remove('active'));
  panel.querySelector('[data-tab="hl"]').classList.add('active');
  document.getElementById('rt-sec-hl').classList.add('active');
}








  function openPanelTab(name){
    if(!panel.classList.contains('active')) panel.classList.add('active');
    tabs.forEach(x=>x.classList.remove('active'));
    secs.forEach(s=>s.classList.remove('active'));
    panel.querySelector(`[data-tab="${name}"]`).classList.add('active');
    document.getElementById('rt-sec-'+name).classList.add('active');
  }


  /* -------------------- التظليل + القائمة + الاستعادة -------------------- */
  function applyHighlight(color){
    const sel = window.getSelection(); if(!sel||!sel.rangeCount) return;
    const range = STATE.selectionRange || sel.getRangeAt(0);
    if(range.collapsed) return;
    const id = 'rt_'+Date.now()+'_'+Math.random().toString(36).slice(2,6);
    const mark = document.createElement('mark');
    mark.className='rt-hl'; mark.style.background=color; mark.dataset.rtId=id; mark.title='انقر للتحديد';
    const frag=range.extractContents(); mark.appendChild(frag); range.insertNode(mark);
    sel.removeAllRanges(); 

    DB.hl[PAGE_KEY].push({ id, text: mark.textContent, color, note:'', ts: Date.now() });
    save(KEYS.HL, DB.hl);
    mark.addEventListener('click', ()=> jumpToHighlight(id));
    renderHL();
  }

  function jumpToHighlight(id){
    document.querySelectorAll('mark.rt-hl').forEach(m => m.classList.toggle('rt-active', m.dataset.rtId===id));
    const mk = document.querySelector(`mark.rt-hl[data-rt-id="${id}"]`);
    if(mk){ mk.scrollIntoView({behavior:'smooth',block:'center'}); }
  }

  function renderHL(){
    const L = document.getElementById('rt-hl-list'); L.innerHTML='';
    const list = DB.hl[PAGE_KEY];
    if(!list.length){ L.innerHTML='<div class="rt-chip">لا توجد تظليلات بعد.</div>'; return; }

    list.forEach(h=>{
      const card = el('div','rt-item',`
        <div><b class="rt-title">نص:</b> ${escape(h.text)}</div>
        <div class="rt-row" style="margin-top:6px">
          <span><b style="color:#8fd3ff">لون:</b> <span style="display:inline-block;width:18px;height:18px;border-radius:6px;border:1px solid #fff;background:${h.color}"></span></span>
          <span style="flex:1"></span>
        </div>
        <div class="rt-row">
          <textarea class="rt-textarea" data-id="${h.id}" placeholder="ملاحظة لهذا التظليل…">${escape(h.note||'')}</textarea>
        </div>
        <div class="rt-row">
          <button class="rt-btn rt-mini" data-act="goto" data-id="${h.id}">اذهب للتظليل</button>
          <button class="rt-btn rt-mini" data-act="save" data-id="${h.id}">حفظ</button>
          <button class="rt-btn rt-mini" data-act="del"  data-id="${h.id}">حذف</button>
        </div>
      `);
      L.appendChild(card);
    });
  }

  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-act]');
    if(!btn) return;
    const act = btn.dataset.act;
    const id  = btn.dataset.id;
    const card= btn.closest('.rt-item');
    if(!card) return;

    if(act==='goto'){ jumpToHighlight(id); return; }

    if(act==='save'){
      confirmInline(card, 'الحفظ', ()=>{
        const it = DB.hl[PAGE_KEY].find(x=>x.id===id);
        const ta = card.querySelector(`textarea[data-id="${id}"]`);
        if(it && ta){ it.note = ta.value.trim(); save(KEYS.HL, DB.hl); }
        msgInline(card, 'تم الحفظ ✅');
      });
      return;
    }

    if(act==='del'){
      confirmInline(card, 'الحذف', ()=>{
        const mk = document.querySelector(`mark.rt-hl[data-rt-id="${id}"]`);
        if(mk){ mk.replaceWith(document.createTextNode(mk.textContent)); }
        DB.hl[PAGE_KEY] = DB.hl[PAGE_KEY].filter(x=>x.id!==id);
        save(KEYS.HL, DB.hl);
        card.remove();
      });
      return;
    }
  });

  function restoreHL(){
    DB.hl[PAGE_KEY].forEach(h=> applyByText(h.text, h.color, h.id));
    renderHL();
  }
  function applyByText(text, color, id){
    if(!text) return;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: n => n.parentElement && n.parentElement.tagName!=='MARK'
        ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    while (walker.nextNode()){
      const node = walker.currentNode;
      const i = node.data.indexOf(text);
      if(i!==-1){
        const before=node.data.slice(0,i), match=node.data.slice(i,i+text.length), after=node.data.slice(i+text.length);
        const parent=node.parentNode;
        const mark=document.createElement('mark');
        mark.className='rt-hl'; mark.style.background=color; mark.dataset.rtId=id; mark.textContent=match;
        parent.insertBefore(document.createTextNode(before), node);
        parent.insertBefore(mark, node);
        parent.insertBefore(document.createTextNode(after), node);
        parent.removeChild(node);
        mark.addEventListener('click', ()=> jumpToHighlight(id));
        return;
      }
    }
  }

  /* -------------------- الملاحظات العامة -------------------- */
  const notesList = document.getElementById('rt-notes-list');
  document.getElementById('rt-note-add').onclick = ()=>{
    const v = (document.getElementById('rt-note-input').value||'').trim(); if(!v) return;
    DB.notes[PAGE_KEY].push({ text:v, ts:Date.now() });
    save(KEYS.NOTES, DB.notes);
    document.getElementById('rt-note-input').value='';
    renderNotes();
  };
  document.getElementById('rt-note-export').onclick = ()=>{
    const blob = new Blob([JSON.stringify({highlights:DB.hl[PAGE_KEY],notes:DB.notes[PAGE_KEY]},null,2)], {type:'application/json'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`page-notes-${Date.now()}.json`; a.click();
  };
  document.getElementById('rt-note-clear').onclick = ()=>{
    confirmInline(notesList.closest('.rt-sec')||panel, 'حذف الكل', ()=>{
      document.querySelectorAll('mark.rt-hl').forEach(m=> m.replaceWith(document.createTextNode(m.textContent)));
      DB.hl[PAGE_KEY]=[]; DB.notes[PAGE_KEY]=[];
      save(KEYS.HL, DB.hl); save(KEYS.NOTES, DB.notes);
      renderHL(); renderNotes();
      msgInline(notesList.closest('.rt-sec')||panel, 'تم الحذف ✅');
    });
  };

  function renderNotes(){
    notesList.innerHTML='';
    const list = DB.notes[PAGE_KEY];
    if(!list.length){ notesList.innerHTML='<div class="rt-chip">لا توجد ملاحظات عامة.</div>'; return; }
    list.slice().reverse().forEach(n=>{
      const card=el('div','rt-item',`
        <div class="rt-note-text" contenteditable="false">${escape(n.text)}</div>
        <div class="rt-row">
          <span class="rt-chip" style="opacity:.7">${new Date(n.ts).toLocaleString()}</span>
          <span style="flex:1"></span>
          <button class="rt-btn rt-mini" data-act="n-edit" data-ts="${n.ts}">تعديل</button>
          <button class="rt-btn rt-mini" data-act="n-save" data-ts="${n.ts}" style="display:none">حفظ</button>
          <button class="rt-btn rt-mini" data-act="n-del"  data-ts="${n.ts}">حذف</button>
        </div>
      `);
      notesList.appendChild(card);
    });
  }

  document.addEventListener('click',(e)=>{
    const b=e.target.closest('button[data-act]');
    if(!b) return;
    const act=b.dataset.act, ts=+b.dataset.ts;
    if(!/^(n-edit|n-save|n-del)$/.test(act)) return;
    const card=b.closest('.rt-item');
    const textDiv=card.querySelector('.rt-note-text');
    const btnSave=card.querySelector('[data-act="n-save"]');
    const btnEdit=card.querySelector('[data-act="n-edit"]');

    if(act==='n-edit'){
      textDiv.contentEditable='true'; textDiv.focus();
      btnEdit.style.display='none'; btnSave.style.display='inline-block';
      return;
    }
    if(act==='n-save'){
      confirmInline(card,'الحفظ',()=>{
        const obj=DB.notes[PAGE_KEY].find(x=>x.ts===ts);
        if(obj){ obj.text=textDiv.textContent.trim(); save(KEYS.NOTES,DB.notes); }
        textDiv.contentEditable='false';
        btnSave.style.display='none'; card.querySelector('[data-act="n-edit"]').style.display='inline-block';
        msgInline(card,'تم الحفظ ✅');
      });
      return;
    }
    if(act==='n-del'){
      confirmInline(card,'الحذف',()=>{
        DB.notes[PAGE_KEY]=DB.notes[PAGE_KEY].filter(x=>x.ts!==ts);
        save(KEYS.NOTES,DB.notes);
        card.remove();
      });
      return;
    }
  });

  /* -------------------- البحث -------------------- */
/* -------------------- الترجمة -------------------- */
document.getElementById('rt-translate-google').onclick = ()=>{
  const q = (document.getElementById('rt-translate-text').value || STATE.selectedText || '').trim();
  if(!q){
    // بدلاً من منع التشغيل، نفتح صفحة الترجمة فاضية لكتابة المستخدم
    window.open(`https://translate.google.com/?sl=auto&tl=ar`, 'googleTranslate','width=900,height=600,top=100,left=200');
    return;
  }
  window.open(`https://translate.google.com/?sl=auto&tl=ar&text=${encodeURIComponent(q)}&op=translate`,
    'googleTranslate','width=900,height=600,top=100,left=200');
};


document.getElementById('rt-google').onclick = ()=>{
  const q = (document.getElementById('rt-q').value || STATE.selectedText || '').trim();
  const url = q ? `https://www.google.com/search?q=${encodeURIComponent(q)}` : `https://www.google.com`;
  window.open(url, 'googlePopup','width=800,height=600,top=100,left=200');
};

document.getElementById('rt-wiki').onclick = ()=>{
  const q = (document.getElementById('rt-q').value || STATE.selectedText || '').trim();
  document.getElementById('rt-flyTitle').textContent='Wikipedia';
  document.getElementById('rt-fly-frame').src = q
    ? `https://wikipedia.org/w/index.php?search=${encodeURIComponent(q)}`
    : `https://wikipedia.org`;
  fly.style.display='block';
};
/* -------------------- شرح المصطلحات (English only) -------------------- */
document.getElementById('rt-define-search').onclick = async ()=>{
  const input = document.getElementById('rt-define-word');
  const resultBox = document.getElementById('rt-define-result');
  const word = (input.value || STATE.selectedText || '').trim();

  if(!word){
    toast('ظلّل كلمة أو اكتبها لشرحها');
    return;
  }

  // 🔹 تحقق إن الكلمة إنجليزية
  const isArabic = /[\u0600-\u06FF]/.test(word);
  if(isArabic){
    resultBox.innerHTML = '⚠️ القاموس الحالي يدعم الكلمات الإنجليزية فقط.';
    return;
  }

  resultBox.innerHTML = '⏳ جاري البحث...';

  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    const data = await res.json();

    if(!Array.isArray(data) || !data[0]){
      resultBox.innerHTML = '❌ لم يتم العثور على الكلمة.';
      return;
    }

    const entry = data[0];
    const meaning = entry.meanings?.[0]?.definitions?.[0]?.definition || 'لا يوجد تعريف متاح.';
    const example = entry.meanings?.[0]?.definitions?.[0]?.example || '';
    const phonetic = entry.phonetic || (entry.phonetics?.[0]?.text || '');
    const partOfSpeech = entry.meanings?.[0]?.partOfSpeech || '';

    resultBox.innerHTML = `
      <b>🔹 الكلمة:</b> ${word}<br>
      <b>🔸 النطق:</b> ${phonetic || '-'}<br>
      <b>🔸 نوع الكلمة:</b> ${partOfSpeech || '-'}<br><br>
      <b>💡 التعريف:</b> ${meaning}<br>
      ${example ? `<br><b>📝 مثال:</b> ${example}` : ''}
    `;
  } catch (err) {
    console.error(err);
    resultBox.innerHTML = '⚠️ حدث خطأ أثناء الاتصال بالقاموس.';
  }
};
/* -------------------- 🧠 التلخيص الذكي (محسّن فعليًا) -------------------- */
document.getElementById('rt-summary-btn').onclick = async ()=>{
  const input = document.getElementById('rt-summary-input');
  const output = document.getElementById('rt-summary-output');
  const text = (input.value || STATE.selectedText || '').trim();

  if(!text){
    toast('أدخل نصًا أو ظلّل فقرة ليتم تلخيصها');
    return;
  }

  output.innerHTML = '⏳ جاري التلخيص...';

  try {
    // 👇 طلب دقيق لتلخيص فعلي وليس إعادة صياغة
    const res = await fetch("https://gpt-proxy-server-xs5u.onrender.com/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: `
أنت خبير أكاديمي مختص في التلخيص. 
أعطني ملخصًا احترافيًا من ثلاث جمل فقط للنص التالي، يوضح أهم الأفكار الجوهرية بدون إعادة صياغة الجمل أو التفاصيل الجانبية. 
استخدم أسلوبًا أكاديميًا مختصرًا وواضحًا.

النص:
${text}
`
      })
    });

    const data = await res.json();
    output.innerHTML = data.reply || '⚠️ لم يتم استلام رد.';
  } catch (err) {
    console.error(err);
    output.innerHTML = '⚠️ حدث خطأ أثناء الاتصال بالمخدم.';
  }
};


// 📋 زر نسخ الملخص
document.getElementById('rt-summary-copy').onclick = ()=>{
  const output = document.getElementById('rt-summary-output');
  const text = output.innerText.trim();

  if(!text || text.includes('سيظهر الملخص هنا') || text.includes('جاري التلخيص')){
    toast('لا يوجد نص لنسخه حالياً');
    return;
  }

  navigator.clipboard.writeText(text)
    .then(()=> {
      toast('✅ تم نسخ الملخص إلى الحافظة');
      const btn = document.getElementById('rt-summary-copy');
      btn.style.background = 'gold';
      setTimeout(()=> btn.style.background = 'transparent', 700);
    })
    .catch(()=> toast('⚠️ حدث خطأ أثناء النسخ'));
};

/* -------------------- 🧩 اختبر نفسك - Smart Quiz (HTML ثابت بدون سحب وإفلات) -------------------- */
document.getElementById('rt-quiz-btn').onclick = async ()=>{
  const input = document.getElementById('rt-quiz-input');
  const output = document.getElementById('rt-quiz-output');
  const text = (input.value || STATE.selectedText || '').trim();

  if(!text){
    toast('أدخل نصًا أو ظلّل فقرة لإنشاء اختبار منها');
    return;
  }

  output.innerHTML = `<div style="text-align:center; padding:10px;">⏳ جاري إنشاء الأسئلة...</div>`;

  try {
    const res = await fetch("https://gpt-proxy-server-xs5u.onrender.com/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: `
أنشئ 9 أسئلة تعليمية من النص التالي، مقسمة كما يلي:
- 3 أسئلة اختيار من متعدد (بالضبط 3 خيارات مختلفة، واحد صحيح).
- 3 أسئلة صح أم خطأ (بالضبط خياران: "صحيح" و"خاطئ"، واحد صحيح).
- 3 أسئلة إكمال الفراغ (ضع فراغًا في نص السؤال باستخدام "____"، و3 خيارات مختلفة، واحد صحيح).

أعد النتيجة HTML فقط، بدون أي نص خارجي. كل سؤال يكون بهذا الشكل حرفيًا:

<div class='quiz-question' data-type='mcq|tf|cloze'>
  <p>نص السؤال هنا (لـ cloze يحتوي جملة بها ____).</p>
  <div class='quiz-options'>
    <button>خيار 1</button>
    <button data-correct="true">الخيار الصحيح</button>
    <button>خيار 3</button>
  </div>
</div>

شروط صارمة:
- لا تكرر الخيارات نصيًا.
- في tf يجب أن تكون الخيارات فقط: "صحيح" و"خاطئ"، وأحدهما فقط يحمل data-correct="true".
- في mcq يجب أن تكون 3 أزرار بالضبط، أحدها فقط يحمل data-correct="true".
- في cloze: السؤال يحتوي "____" داخل النص، وتحتها 3 أزرار (إجابة واحدة صحيحة بعلامة data-correct="true").
- لا تستخدم أي تعليقات أو Markdown أو نص خارج هيكل HTML المطلوب.

النص:
${text}
`
      })
    });

    // قد يرجع الخادم JSON فيه حقل reply أو HTML مباشرة
    let raw = await res.text();
    let html = '';
    try {
      const parsed = JSON.parse(raw);
      html = parsed.reply || parsed.text || parsed.answer || '';
    } catch {
      html = raw;
    }

    // نبني DOM مؤقت لاستخراج الأسئلة
    const temp = document.createElement('div');
    temp.innerHTML = html;

    const questions = temp.querySelectorAll('.quiz-question');
    if(!questions.length){
      output.innerHTML = `<div style="text-align:center; color:#FFD54A; padding:14px;">⚠️ لم يتم توليد أسئلة صالحة. جرّب نصًا أوضح أو أطول قليلًا.</div>`;
      return;
    }

    let current = 0;
    let score = 0;

    function showQuestion(index){
      if(index >= questions.length){
        output.innerHTML = `
          <div style="text-align:center; color:#FFD54A; font-size:1.2rem; padding:20px;">
            🎯 انتهى الاختبار<br><br>
            نتيجتك: <b>${score}</b> من <b>${questions.length}</b><br>
            ${score === questions.length ? "💪 أداء ممتاز جدًا!" 
              : score >= Math.ceil(questions.length*0.66) ? "👍 جيد جدًا!" 
              : "📘 تحتاج مراجعة بسيطة"}
          </div>`;
        return;
      }

      const qClone = questions[index].cloneNode(true);
      qClone.style.cssText = `
        background:rgba(255,255,255,0.05);
        border:1px solid rgba(255,215,0,.25);
        border-radius:10px; padding:12px; margin:10px 0;
      `;

      // رأس يوضح نوع السؤال
      const type = (qClone.getAttribute('data-type') || '').toLowerCase();
      const typeMap = { mcq:'اختيار من متعدد', tf:'صح / خطأ', cloze:'إكمال الفراغ' };
      const header = document.createElement('div');
      header.textContent = `🧠 نوع السؤال: ${typeMap[type] || 'سؤال'}`;
      header.style.cssText = `color:#FFD54A;font-weight:bold;margin-bottom:6px;text-align:center;`;

      // زر التالي
      const nextBtn = document.createElement('button');
      nextBtn.className = 'rt-btn';
      nextBtn.textContent = (index < questions.length - 1) ? 'السؤال التالي ➜' : 'عرض النتيجة ✅';
      nextBtn.style.display = 'none';
      nextBtn.onclick = ()=> showQuestion(index + 1);

      // تحسين بصري خاص لـ cloze: لو السؤال فيه ____ ونختار إجابة صحيحة، نحقنها في النص
      const p = qClone.querySelector('p');

      // تفعيل خيارات هذا السؤال فقط
      const optionsWrap = qClone.querySelector('.quiz-options');
      const options = optionsWrap ? optionsWrap.querySelectorAll('button') : [];
      if(!options.length){
        // لو لأي سبب المخرجات ما فيها أزرار
        const warn = document.createElement('div');
        warn.className = 'rt-msg';
        warn.textContent = '⚠️ هذا السؤال لا يحتوي على خيارات قابلة للضغط.';
        output.innerHTML = '';
        output.appendChild(header);
        output.appendChild(qClone);
        output.appendChild(warn);
        nextBtn.style.display = 'block';
        output.appendChild(nextBtn);
        return;
      }

      options.forEach(btn=>{
        btn.onclick = ()=>{
          // تعطيل أزرار هذا السؤال فقط
          options.forEach(b=> b.disabled = true);

          const correct = btn.getAttribute('data-correct') === 'true';
          if(correct){
            btn.style.background = 'green';
            score++;
            // لو cloze: املأ الفراغ
            if (type === 'cloze' && p && p.textContent.includes('____')) {
              p.textContent = p.textContent.replace('____', btn.textContent);
            }
            toast('✅ إجابة صحيحة');
          } else {
            btn.style.background = 'crimson';
            toast('❌ إجابة خاطئة');
          }
          nextBtn.style.display = 'inline-block';
        };
      });

      // عرض
      output.innerHTML = '';
      output.appendChild(header);
      output.appendChild(qClone);
      output.appendChild(nextBtn);
    }

    showQuestion(0);

  } catch (err) {
    console.error(err);
    output.innerHTML = '⚠️ حدث خطأ أثناء إنشاء الأسئلة.';
  }
};

/* -------------------- المساعد الذكي (بطاقات سؤال + جواب) -------------------- */
const aiBtn = document.getElementById('rt-ai-ask');
const aiInput = document.getElementById('rt-ai-input');
const aiResponse = document.getElementById('rt-ai-response');

aiBtn.addEventListener('click', sendAIMessage);
aiInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendAIMessage();
  }
});

async function sendAIMessage() {
  const text = (aiInput.value || STATE.selectedText || '').trim();
  if (!text) {
    toast('اكتب سؤالك أو ظلّل فقرة ليشرحها المساعد');
    return;
  }

  const card = appendAIMessagePair(text);

  try {
    const response = await fetch("https://gpt-proxy-server-xs5u.onrender.com/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: text })
    });

    const data = await response.json();
    updateLastAIMessage(data.reply || '⚠️ لم يصل رد من المساعد.');
  } catch (error) {
    updateLastAIMessage("⚠️ حدث خطأ أثناء الاتصال بالمساعد.");
  }

  aiInput.value = '';
}

function appendAIMessagePair(questionText) {
  const container = document.getElementById('rt-ai-response');

  const card = document.createElement('div');
  card.className = 'chat-message-pair';
  card.style.margin = '10px 0';
  card.style.padding = '10px';
  card.style.borderRadius = '10px';
  card.style.background = '#1e1e1e';
  card.style.color = '#FFD54A';
  card.style.border = '1px solid rgba(0,120,255,.3)';
  card.dataset.pending = 'true';

  card.innerHTML = `
    <div style="font-weight:bold; color:#8fd3ff; margin-bottom:6px">🧠 سؤالك:</div>
    <div class="ai-question" style="margin-bottom:8px; color:#e1f5fe">${questionText}</div>
    <div class="ai-answer">🤖 ...جاري التفكير</div>
  `;

  if (container.firstChild) {
    container.insertBefore(card, container.firstChild);
  } else {
    container.appendChild(card);
  }

  return card;
}

function updateLastAIMessage(content) {
  const container = document.getElementById('rt-ai-response');
  const pendingCard = container.querySelector('.chat-message-pair[data-pending="true"]');
  if (pendingCard) {
    const answerDiv = pendingCard.querySelector('.ai-answer');
    answerDiv.textContent = content;
    pendingCard.removeAttribute('data-pending');
  }
}


function appendAIMessagePair(questionText) {
  const container = document.getElementById('rt-ai-response');

  const card = document.createElement('div');
  card.className = 'chat-message-pair';
  card.style.margin = '10px 0';
  card.style.padding = '10px';
  card.style.borderRadius = '10px';
  card.style.background = '#1e1e1e';
  card.style.color = '#FFD54A';
  card.style.border = '1px solid rgba(0,120,255,.3)';
  card.dataset.pending = 'true'; // نستخدمه لاحقًا لتحديث الجواب

  card.innerHTML = `
    <div style="font-weight:bold; color:#8fd3ff; margin-bottom:6px">🧠 سؤالك:</div>
    <div class="ai-question" style="margin-bottom:8px; color:#e1f5fe">${questionText}</div>
    <div class="ai-answer">🤖 ...جاري التفكير</div>
  `;

  // نضيف البطاقة في الأعلى
  if (container.firstChild) {
    container.insertBefore(card, container.firstChild);
  } else {
    container.appendChild(card);
  }

  return card;
}



function updateLastAIMessage(content) {
  const container = document.getElementById('rt-ai-response');
  const pendingCard = container.querySelector('.chat-message-pair[data-pending="true"]');
  if (pendingCard) {
    const answerDiv = pendingCard.querySelector('.ai-answer');
    answerDiv.textContent = content;
    pendingCard.removeAttribute('data-pending');
  }
}


  /* -------------------- القراءة الصوتية -------------------- */
  const voiceSel = document.getElementById('rt-voice');
  const rateInp  = document.getElementById('rt-rate');

  if('speechSynthesis' in window){
    loadVoices(); speechSynthesis.onvoiceschanged = loadVoices;
  } else {
    voiceSel.innerHTML = '<option>(المتصفح لا يدعم القراءة الصوتية)</option>';
  }

  function loadVoices(){
    STATE.voices = speechSynthesis.getVoices();
    voiceSel.innerHTML = '';
    if(!STATE.voices.length){
      voiceSel.innerHTML = '<option>(لا توجد أصوات متاحة)</option>'; return;
    }
    const sorted = STATE.voices.slice().sort((a,b)=> a.lang.localeCompare(b.lang));
    sorted.forEach(v=>{
      const opt = document.createElement('option');
      opt.value = v.voiceURI; opt.textContent = `${v.name} — ${v.lang}`;
      if(STATE.voicePrefs.voiceURI===v.voiceURI) opt.selected = true;
      voiceSel.appendChild(opt);
    });
  }

document.getElementById('rt-speak').onclick = ()=>{
  const input = document.getElementById('rt-speak-text');
  let text = (input?.value || STATE.selectedText || '').trim();

  // ⚙️ لو ما في نص، نطلب من المستخدم يكتبه بدل من منعه
  if(!text){
    input.focus();
    toast('اكتب نصًا للقراءة أو ظلّل كلمة');
    return;
  }

  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const isAr = /[\u0600-\u06FF]/.test(text);
  const prefer = STATE.voices.find(v=> v.voiceURI===STATE.voicePrefs.voiceURI)
               || STATE.voices.find(v=> v.lang.toLowerCase().startsWith(isAr?'ar':'en'))
               || STATE.voices[0];
  if(prefer) u.voice = prefer;
  u.lang = prefer?.lang || (isAr?'ar':'en');
  u.rate = STATE.voicePrefs.rate || 1;
  speechSynthesis.speak(u);
};

  document.getElementById('rt-stop').onclick = ()=> speechSynthesis.cancel();

  voiceSel.onchange = ()=>{
    STATE.voicePrefs.voiceURI = voiceSel.value;
    save(KEYS.VOICE, STATE.voicePrefs);
  };
  rateInp.oninput = ()=>{
    STATE.voicePrefs.rate = parseFloat(rateInp.value||'1') || 1;
    save(KEYS.VOICE, STATE.voicePrefs);
  };

  /* -------------------- استعادة + تشغيل أولي -------------------- */
  window.addEventListener('load', ()=>{
    restoreHL(); renderNotes();
  });

  /* -------------------- أدوات مساعدة -------------------- */
  function el(tag, cls, html){ const d=document.createElement(tag); if(cls) d.className=cls; if(html!=null) d.innerHTML=html; return d; }
  function escape(s){ return (s||'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  function confirmInline(parent, action, onYes){
    if(parent.querySelector('.rt-confirm')) return;
    const box = el('div','rt-confirm',`
      <span>تأكيد ${action}؟</span>
      <div>
        <button class="rt-btn rt-mini" data-x="yes">نعم</button>
        <button class="rt-btn rt-mini" data-x="no">لا</button>
      </div>
    `);
    parent.appendChild(box);
    box.querySelector('[data-x="yes"]').onclick = ()=>{ try{ onYes&&onYes(); }finally{ box.remove(); } };
    box.querySelector('[data-x="no"]').onclick  = ()=> box.remove();
  }
  function msgInline(parent, msg){
    const m = el('div','rt-msg', msg);
    parent.appendChild(m);
    setTimeout(()=> m.remove(), 1800);
  }
  function toast(text){
    const t = el('div', null, text);
    const side = (document.dir==='ltr' ? 'left' : 'right');
    Object.assign(t.style,{
      position:'fixed',
      bottom:'20px',
      [side]:'20px',
      background:'rgba(10,15,25,.92)',
      color:'#fff',
      border:'1px solid rgba(0,120,255,.45)',
      borderRadius:'10px',
      padding:'8px 12px',
      zIndex:99996,
      boxShadow:'0 0 18px rgba(0,120,255,.3)',
      transition:'opacity .3s'
    });
    document.body.appendChild(t);
    setTimeout(()=>{ t.style.opacity='0'; setTimeout(()=>t.remove(),300); },1500);
  }
})();

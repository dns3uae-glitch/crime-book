/* CrimeBook Editor Pro (Minimal UI) — v1
 * Features: Lock/Unlock, V/H Guides, Snap toggle, Drag/Resize, Text formatting,
 * Z-order, Per-page autosave, Lightweight toolbar.
 * No external deps.
 */
(function () {
  const CFG = {
    selector: '.page .content',
    grid: 10,
    storageKeyPrefix: 'crimebook_page_',
    autosaveMs: 10000,
    snapToGuidesPx: 6, // snap tolerance to guides
  };

  // ---------- Styles (minimal, unobtrusive) ----------
  const css = `
  .cbp-toolbar {
    position: fixed; top: 12px; left: 50%; transform: translateX(-50%);
    background: rgba(255,255,255,.96); border:1px solid #e6e6e6; border-radius:12px;
    box-shadow: 0 8px 24px rgba(0,0,0,.10);
    display:flex; gap:6px; padding:6px 8px; z-index:99990;
    font: 13px system-ui, -apple-system, "Tajawal", Arial;
  }
  .cbp-btn, .cbp-select, .cbp-color {
    border:1px solid #e6e6e6; background:#fff; border-radius:8px; padding:6px 8px;
    cursor:pointer; font-size:13px;
  }
  .cbp-btn:hover { background:#f5f5f5; }
  .cbp-divider { width:1px; background:#e9e9e9; margin:0 6px; }
  .cbp-muted { opacity:.7 }
  .cbp-hidden { display:none }

  .cbp-block {
    position:absolute; min-width:80px; min-height:40px; box-sizing:border-box;
    border:1px dashed rgba(0,0,0,.15); border-radius:8px; padding:6px; background:transparent;
  }
  .cbp-block.cbp-selected { border-color:#d8b97a; box-shadow:0 0 0 2px rgba(216,185,122,.22) inset; }
  .cbp-text { width:100%; height:100%; outline:none; color:#222; font-size:16px; line-height:1.7; font-family:"Tajawal", Arial; }
  .cbp-resize { position:absolute; right:-6px; bottom:-6px; width:12px; height:12px; border-radius:50%;
    background:#d8b97a; box-shadow:0 2px 6px rgba(0,0,0,.2); cursor:se-resize; }
  .cbp-lock-badge { position:absolute; top:-18px; right:0; background:#111; color:#fff; font-size:10px; padding:2px 6px; border-radius:6px; opacity:.85; }
  .cbp-pos { position:absolute; top:-18px; left:0; background:#111; color:#fff; font-size:10px; padding:2px 6px; border-radius:6px; opacity:.85; }

  /* Guides */
  .cbp-guide { position:absolute; background: #d8b97a; opacity:.45; z-index: 9990; }
  .cbp-guide.v { width:2px; cursor: ew-resize; }
  .cbp-guide.h { height:2px; cursor: ns-resize; }
  .cbp-guide.cbp-selected { box-shadow:0 0 0 2px rgba(216,185,122,.22); }

  /* drag preview */
  .cbp-dragging { outline: 1px dashed #bbb; }

  /* contextual hint */
  .cbp-hint {
    position: fixed; bottom:10px; right:10px; z-index:99991;
    font: 12px system-ui, -apple-system, "Tajawal", Arial;
    color:#555; background: rgba(255,255,255,.95); border:1px solid #e6e6e6; border-radius:8px; padding:6px 8px;
  }
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // ---------- Helpers ----------
  const snap = (v, g) => Math.round(v / g) * g;
  const clamp = (v, min, max) => Math.max(min, Math.min(v, max));
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform);

  function sel(container) {
    return container.querySelector('.cbp-block.cbp-selected') || container.querySelector('.cbp-guide.cbp-selected');
  }
  function maxZ(container) {
    let m = 1;
    container.querySelectorAll('.cbp-block').forEach(b => { m = Math.max(m, parseInt(getComputedStyle(b).zIndex || '1', 10)); });
    return m;
  }

  // ---------- Toolbar ----------
  function makeToolbar() {
    const el = document.createElement('div');
    el.className = 'cbp-toolbar';
    el.innerHTML = `
      <button class="cbp-btn" data-act="addText">+ نص</button>
      <button class="cbp-btn" data-act="addImage">+ صورة</button>
      <button class="cbp-btn" data-act="addVideo">+ فيديو</button>
      <span class="cbp-divider"></span>
      <select class="cbp-select" data-act="fontName">
        <option value="Tajawal">Tajawal</option><option>Arial</option><option>Georgia</option><option>Times New Roman</option>
      </select>
      <select class="cbp-select" data-act="fontSize">
        <option>14</option><option selected>16</option><option>18</option><option>20</option><option>24</option>
      </select>
      <input class="cbp-color" type="color" value="#222222" data-act="color" title="لون"/>
      <button class="cbp-btn" data-act="bold"><b>B</b></button>
      <button class="cbp-btn" data-act="italic"><i>I</i></button>
      <button class="cbp-btn" data-act="underline"><u>U</u></button>
      <button class="cbp-btn" data-act="alignLeft">يسار</button>
      <button class="cbp-btn" data-act="alignCenter">وسط</button>
      <button class="cbp-btn" data-act="alignRight">يمين</button>
      <span class="cbp-divider"></span>
      <button class="cbp-btn" data-act="bringFront">أمام</button>
      <button class="cbp-btn" data-act="sendBack">خلف</button>
      <span class="cbp-divider"></span>
      <button class="cbp-btn" data-act="lockToggle">🔒 قفل/فك</button>
      <button class="cbp-btn" data-act="snapToggle" title="Snap Grid">شبكة: تشغيل</button>
      <span class="cbp-divider"></span>
      <button class="cbp-btn" data-act="addGuideV">+ دليل رأسي</button>
      <button class="cbp-btn" data-act="addGuideH">+ دليل أفقي</button>
      <span class="cbp-divider"></span>
      <button class="cbp-btn" data-act="save">حفظ</button>
      <button class="cbp-btn" data-act="load">تحميل</button>
      <button class="cbp-btn cbp-muted" data-act="clear">مسح</button>
      <button class="cbp-btn cbp-muted" data-act="hide">إخفاء الشريط</button>
    `;
    document.body.appendChild(el);
    return el;
  }
  function makeHint() {
    const h = document.createElement('div');
    h.className = 'cbp-hint';
    h.innerHTML = `${isMac?'⌘':'Ctrl'}+S حفظ • Delete حذف • ${isMac?'⌘':'Ctrl'}+L قفل/فك • ${isMac?'⌘':'Ctrl'}+H إخفاء/إظهار`;
    document.body.appendChild(h);
    return h;
  }

  // ---------- Blocks ----------
  function baseBlock(container) {
    const b = document.createElement('div');
    b.className = 'cbp-block';
    b.style.left = '20px'; b.style.top = '20px'; b.style.width = '240px'; b.style.height = '110px';
    b.dataset.locked = '0';
    container.appendChild(b);

    const pos = document.createElement('div'); pos.className = 'cbp-pos'; pos.textContent = 'x:0 y:0';
    b.appendChild(pos);

    const rz = document.createElement('div'); rz.className = 'cbp-resize'; b.appendChild(rz);

    // Interactions
    makeDraggableResizable(b, container);

    b.addEventListener('mousedown', (e) => {
      if (b.dataset.locked === '1') return;
      selectBlock(container, b);
      e.stopPropagation();
    });
    return b;
  }
  function selectBlock(container, b) {
    container.querySelectorAll('.cbp-block, .cbp-guide').forEach(x => x.classList.remove('cbp-selected'));
    b.classList.add('cbp-selected');
    b.style.zIndex = maxZ(container) + 1;
  }
  function createText(container) {
    const b = baseBlock(container);
    b.dataset.type = 'text';
    const t = document.createElement('div');
    t.className = 'cbp-text'; t.contentEditable = 'true'; t.dir = 'auto';
    t.innerHTML = 'اكتب هنا...';
    b.appendChild(t);
    return b;
  }
  function createImage(container, src, alt='') {
    const b = baseBlock(container); b.dataset.type='image';
    const img = document.createElement('img');
    img.src = src; img.alt = alt; img.style.cssText='width:100%;height:100%;object-fit:cover;border-radius:6px;';
    b.appendChild(img); return b;
  }
  function createVideo(container, url) {
    const b = baseBlock(container); b.dataset.type='video';
    b.style.width='360px'; b.style.height='200px';
    if (/youtube\.com|youtu\.be/.test(url)) {
      if (url.includes('watch?v=')) url = url.replace('watch?v=', 'embed/');
      if (url.includes('youtu.be/')) url = url.replace('youtu.be/', 'www.youtube.com/embed/');
      const ifr = document.createElement('iframe');
      ifr.src = url; ifr.style.cssText='width:100%;height:100%;border:none;border-radius:6px;';
      b.appendChild(ifr);
    } else {
      const v = document.createElement('video'); v.controls = true;
      v.src = url; v.style.cssText='width:100%;height:100%;border-radius:6px;';
      b.appendChild(v);
    }
    return b;
  }

  // ---------- Guides ----------
  function createGuide(container, type, xOrY) {
    const g = document.createElement('div');
    g.className = 'cbp-guide ' + (type==='v'?'v':'h');
    if (type === 'v') { g.style.left = (xOrY||40) + 'px'; g.style.top = '0px'; g.style.height = container.clientHeight + 'px'; }
    else { g.style.top = (xOrY||40) + 'px'; g.style.left = '0px'; g.style.width = container.clientWidth + 'px'; }
    g.dataset.locked = '0';
    container.appendChild(g);
    makeGuideDraggable(g, container);
    g.addEventListener('mousedown', (e)=>{ selectGuide(container, g); e.stopPropagation(); });
    return g;
  }
  function selectGuide(container, g){
    container.querySelectorAll('.cbp-block, .cbp-guide').forEach(x => x.classList.remove('cbp-selected'));
    g.classList.add('cbp-selected');
  }
  function makeGuideDraggable(g, container) {
    let dragging = false, sx=0, sy=0, start=0;
    g.addEventListener('mousedown', (e)=>{
      if (g.dataset.locked === '1') return;
      dragging = true; sx = e.clientX; sy = e.clientY;
      start = (g.classList.contains('v') ? g.offsetLeft : g.offsetTop);
      document.body.classList.add('cbp-dragging');
      e.preventDefault();
    });
    document.addEventListener('mousemove', (e)=>{
      if (!dragging) return;
      if (g.classList.contains('v')) {
        const nl = clamp(start + (e.clientX - sx), 0, container.clientWidth);
        g.style.left = nl + 'px';
      } else {
        const nt = clamp(start + (e.clientY - sy), 0, container.clientHeight);
        g.style.top = nt + 'px';
      }
    });
    document.addEventListener('mouseup', ()=>{
      if (!dragging) return;
      dragging = false; document.body.classList.remove('cbp-dragging');
      // stretch to container in case size changed
      if (g.classList.contains('v')) g.style.height = container.clientHeight + 'px';
      else g.style.width = container.clientWidth + 'px';
    });
  }

  // ---------- Drag/Resize (with Snap grid & guides) ----------
  function makeDraggableResizable(b, container) {
    const pos = b.querySelector('.cbp-pos');
    const rz = b.querySelector('.cbp-resize');

    let drag=false, size=false, sx=0, sy=0, sl=0, st=0, sw=0, sh=0;

    b.addEventListener('mousedown', (e)=>{
      if (b.dataset.locked === '1') return;
      if (e.target === rz) { size = true; sx=e.clientX; sy=e.clientY; sw=b.offsetWidth; sh=b.offsetHeight; }
      else { drag = true; sx=e.clientX; sy=e.clientY; sl=b.offsetLeft; st=b.offsetTop; }
      selectBlock(container, b);
      document.body.classList.add('cbp-dragging');
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e)=>{
      if (!drag && !size) return;
      const grid = window.__CBP_SNAP_ENABLED__ !== false ? (window.__CBP_GRID__ || 10) : 1;

      if (drag) {
        let nl = sl + (e.clientX - sx);
        let nt = st + (e.clientY - sy);

        // Snap to grid
        nl = snap(nl, grid); nt = snap(nt, grid);

        // Snap to guides
        const guides = container.querySelectorAll('.cbp-guide');
        guides.forEach(g=>{
          if (g.classList.contains('v')) {
            const gx = g.offsetLeft;
            if (Math.abs(nl - gx) <= CFG.snapToGuidesPx) nl = gx;
            if (Math.abs(nl + b.offsetWidth - gx) <= CFG.snapToGuidesPx) nl = gx - b.offsetWidth;
          } else {
            const gy = g.offsetTop;
            if (Math.abs(nt - gy) <= CFG.snapToGuidesPx) nt = gy;
            if (Math.abs(nt + b.offsetHeight - gy) <= CFG.snapToGuidesPx) nt = gy - b.offsetHeight;
          }
        });

        nl = clamp(nl, 0, container.clientWidth - b.offsetWidth);
        nt = clamp(nt, 0, container.clientHeight - b.offsetHeight);

        b.style.left = nl + 'px'; b.style.top = nt + 'px';
        if (pos) pos.textContent = `x:${nl} y:${nt}`;
      } else if (size) {
        let nw = sw + (e.clientX - sx);
        let nh = sh + (e.clientY - sy);

        nw = Math.max(80, Math.min(nw, container.clientWidth - b.offsetLeft));
        nh = Math.max(40, Math.min(nh, container.clientHeight - b.offsetTop));

        // grid snap
        const grid = window.__CBP_SNAP_ENABLED__ !== false ? (window.__CBP_GRID__ || 10) : 1;
        nw = snap(nw, grid); nh = snap(nh, grid);

        // guides snap (right/bottom)
        const guides = container.querySelectorAll('.cbp-guide');
        guides.forEach(g=>{
          if (g.classList.contains('v')) {
            const gx = g.offsetLeft;
            const right = b.offsetLeft + nw;
            if (Math.abs(right - gx) <= CFG.snapToGuidesPx) nw = gx - b.offsetLeft;
          } else {
            const gy = g.offsetTop;
            const bottom = b.offsetTop + nh;
            if (Math.abs(bottom - gy) <= CFG.snapToGuidesPx) nh = gy - b.offsetTop;
          }
        });

        b.style.width = nw + 'px'; b.style.height = nh + 'px';
      }
    });

    document.addEventListener('mouseup', ()=>{
      if (!drag && !size) return;
      drag = false; size = false; document.body.classList.remove('cbp-dragging');
    });
  }

  // ---------- Serialize / Restore ----------
  function serialize(container) {
    const data = { blocks:[], guides:[], snap: (window.__CBP_SNAP_ENABLED__ !== false) };
    container.querySelectorAll('.cbp-block').forEach(b=>{
      const obj = {
        type: b.dataset.type || 'text',
        x: b.offsetLeft, y:b.offsetTop, w:b.offsetWidth, h:b.offsetHeight,
        z: parseInt(getComputedStyle(b).zIndex||'1',10),
        locked: b.dataset.locked==='1'
      };
      if (obj.type==='text') {
        const t = b.querySelector('.cbp-text');
        obj.html = t.innerHTML;
        obj.style = { color: t.style.color, fontSize: t.style.fontSize, fontFamily: t.style.fontFamily, textAlign: t.style.textAlign };
      } else if (obj.type==='image') {
        const img = b.querySelector('img'); obj.src = img.src; obj.alt = img.alt||'';
      } else if (obj.type==='video') {
        const ifr = b.querySelector('iframe'); const v = b.querySelector('video');
        obj.src = ifr ? ifr.src : (v ? v.src : '');
      }
      data.blocks.push(obj);
    });
    container.querySelectorAll('.cbp-guide').forEach(g=>{
      data.guides.push({
        type: g.classList.contains('v')?'v':'h',
        x: g.classList.contains('v') ? g.offsetLeft : 0,
        y: g.classList.contains('h') ? g.offsetTop  : 0,
        locked: g.dataset.locked==='1'
      });
    });
    return data;
  }
  function restore(container, data) {
    container.querySelectorAll('.cbp-block, .cbp-guide').forEach(x=>x.remove());
    (data.guides||[]).forEach(g=>{
      const gg = createGuide(container, g.type, g.type==='v'?g.x:g.y);
      gg.dataset.locked = g.locked ? '1':'0';
    });
    (data.blocks||[]).forEach(d=>{
      let b;
      if (d.type==='text'){ b = createText(container); const t=b.querySelector('.cbp-text'); t.innerHTML=d.html||''; if(d.style){ t.style.color=d.style.color||''; t.style.fontSize=d.style.fontSize||''; t.style.fontFamily=d.style.fontFamily||''; t.style.textAlign=d.style.textAlign||''; } }
      else if (d.type==='image'){ b = createImage(container, d.src, d.alt||''); }
      else if (d.type==='video'){ b = createVideo(container, d.src||''); }
      b.style.left=d.x+'px'; b.style.top=d.y+'px'; b.style.width=d.w+'px'; b.style.height=d.h+'px'; b.style.zIndex=d.z||1;
      b.dataset.locked = d.locked?'1':'0';
      updateLockBadge(b);
    });
    window.__CBP_SNAP_ENABLED__ = (data.snap !== false);
    updateSnapButton();
  }

  // ---------- Lock / Unlock ----------
  function toggleLock(container) {
    const s = sel(container); if (!s) return;
    const isGuide = s.classList.contains('cbp-guide');
    if (isGuide) {
      s.dataset.locked = s.dataset.locked==='1' ? '0':'1';
      return;
    }
    const b = s;
    b.dataset.locked = b.dataset.locked==='1' ? '0':'1';
    updateLockBadge(b);
  }
  function updateLockBadge(b) {
    let badge = b.querySelector('.cbp-lock-badge');
    if (b.dataset.locked==='1') {
      if (!badge) { badge = document.createElement('div'); badge.className='cbp-lock-badge'; badge.textContent='🔒 Locked'; b.appendChild(badge); }
      b.style.pointerEvents = 'auto'; // allow selection but block drag in handlers
    } else {
      if (badge) badge.remove();
    }
  }

  // ---------- Formatting ----------
  function applyFormat(container, act, val) {
    const s = sel(container);
    if (!s || !s.classList.contains('cbp-block') || s.dataset.type!=='text') return;
    const t = s.querySelector('.cbp-text'); if (!t) return;
    if (act==='fontName') t.style.fontFamily = val;
    else if (act==='fontSize') t.style.fontSize = (val+'px');
    else if (act==='color') t.style.color = val;
    else if (act==='bold') document.execCommand('bold');
    else if (act==='italic') document.execCommand('italic');
    else if (act==='underline') document.execCommand('underline');
    else if (act==='alignLeft') t.style.textAlign='left';
    else if (act==='alignCenter') t.style.textAlign='center';
    else if (act==='alignRight') t.style.textAlign='right';
  }

  function bringFront(container) { const s=sel(container); if(!s||!s.classList.contains('cbp-block')) return; s.style.zIndex = maxZ(container)+1; }
  function sendBack(container) { const s=sel(container); if(!s||!s.classList.contains('cbp-block')) return; s.style.zIndex = 1; }

  // ---------- Save / Load ----------
  function save(container, key) {
    localStorage.setItem(key, JSON.stringify(serialize(container)));
  }
  function load(container, key) {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    try { const data = JSON.parse(raw); restore(container, data); return true; } catch(e){ return false; }
  }

  // ---------- Snap toggle ----------
  function updateSnapButton() {
    const btn = document.querySelector('.cbp-toolbar [data-act="snapToggle"]');
    if (!btn) return;
    const on = (window.__CBP_SNAP_ENABLED__ !== false);
    btn.textContent = 'شبكة: ' + (on ? 'تشغيل' : 'إيقاف');
  }

  // ---------- Public init ----------
  window.initPageEditor = function initPageEditor(opts) {
    const selector = (opts && opts.selector) || CFG.selector;
    const grid = (opts && opts.grid) || CFG.grid;
    const key = (opts && opts.storageKey) || CFG.storageKeyPrefix + 'generic';

    window.__CBP_GRID__ = grid;
    if (typeof window.__CBP_SNAP_ENABLED__ === 'undefined') window.__CBP_SNAP_ENABLED__ = true;

    const toolbar = document.querySelector('.cbp-toolbar') || makeToolbar();
    makeHint();

    const container = document.querySelector(selector);
    if (!container) return;
    container.style.position = 'relative';

    // load existing
    load(container, key);

    // toolbar actions
    toolbar.addEventListener('click', (e)=>{
      const act = e.target && e.target.getAttribute('data-act'); if (!act) return;
      if (act==='addText') { const b=createText(container); selectBlock(container,b); }
      else if (act==='addImage') { const url=prompt('رابط الصورة:'); if(!url) return; const b=createImage(container,url); selectBlock(container,b); }
      else if (act==='addVideo') { const url=prompt('رابط الفيديو (YouTube/mp4):'); if(!url) return; const b=createVideo(container,url); selectBlock(container,b); }
      else if (['fontName','fontSize','color','bold','italic','underline','alignLeft','alignCenter','alignRight'].includes(act)) {
        // handled by change/input for selects & color; buttons here
        if (['bold','italic','underline','alignLeft','alignCenter','alignRight'].includes(act)) applyFormat(container, act);
      }
      else if (act==='bringFront') bringFront(container);
      else if (act==='sendBack') sendBack(container);
      else if (act==='lockToggle') toggleLock(container);
      else if (act==='snapToggle') { window.__CBP_SNAP_ENABLED__ = !(window.__CBP_SNAP_ENABLED__ !== false); updateSnapButton(); }
      else if (act==='addGuideV') createGuide(container, 'v');
      else if (act==='addGuideH') createGuide(container, 'h');
      else if (act==='save') save(container, key), alert('تم الحفظ ✅');
      else if (act==='load') { if (!load(container, key)) alert('لا توجد محفوظات'); }
      else if (act==='clear') { if (confirm('مسح جميع العناصر؟')) container.querySelectorAll('.cbp-block, .cbp-guide').forEach(x=>x.remove()); }
      else if (act==='hide') toolbar.classList.add('cbp-hidden');
    });
    // re-show toolbar
    document.addEventListener('keydown', (e)=>{
      if ((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='h') {
        e.preventDefault(); document.querySelector('.cbp-toolbar')?.classList.toggle('cbp-hidden');
      }
    });
    // live controls (font/color)
    toolbar.querySelector('[data-act="fontName"]').addEventListener('change', (e)=>applyFormat(container,'fontName', e.target.value));
    toolbar.querySelector('[data-act="fontSize"]').addEventListener('change', (e)=>applyFormat(container,'fontSize', e.target.value));
    toolbar.querySelector('[data-act="color"]').addEventListener('input', (e)=>applyFormat(container,'color', e.target.value));

    // prevent PageFlip when manipulating inside editor
    container.addEventListener('mousedown', ev => ev.stopPropagation(), true);
    container.addEventListener('touchstart', ev => ev.stopPropagation(), {passive:true, capture:true});

    // keyboard
    document.addEventListener('keydown', (e)=>{
      // save
      if ((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='s') { e.preventDefault(); save(container, key); }
      // lock toggle
      if ((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='l') { e.preventDefault(); toggleLock(container); }
      // delete selected (block or guide)
      if (e.key==='Delete') { const s = sel(container); if (s) s.remove(); }
    });

    // autosave
    setInterval(()=>{ save(container, key); }, CFG.autosaveMs);
    updateSnapButton();
  };

  // Enable editor on right-click guides menu? (optional—kept simple)
})();

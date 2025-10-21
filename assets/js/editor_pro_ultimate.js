/* ==========================================================
 * Royal Editor X — Quantum Edition (Single-file / AR / RTL)
 * Popup modern flat editor powered by TinyMCE 6 (loaded via CDN).
 * - Arabic UI, RTL
 * - Edit any .page .content
 * - Save into DOM + AutoSave (localStorage) + simple Version History
 * - Import HTML for a page
 * - Export whole book as a single HTML file (post-edit)
 * ========================================================== */
(function(){
const CDN_TINYMCE = 'https://cdn.tiny.cloud/1/wfzywll71fp456j62a7ol96ku7o9qekq2zfkdhlljs0i4mwn/tinymce/6/tinymce.min.js';
  const CDN_LANG_AR = 'https://cdn.jsdelivr.net/npm/tinymce@6-i18n/langs/ar.js';
  const GF_TAJAWAL  = 'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;600;700&display=swap';
  const LS_PREFIX   = 'royaledx_page_';   // autosave per page
  const HIST_PREFIX = 'royaledx_hist_';   // history per page
  const AUTOSAVE_MS = 10000;              // 10s

  // load TinyMCE + arabic once
  function loadScript(src){ return new Promise((res,rej)=>{ const s=document.createElement('script'); s.src=src; s.onload=res; s.onerror=()=>rej(new Error('Load '+src)); document.head.appendChild(s); }); }
  function ensureTiny(){ if (window.tinymce) return Promise.resolve(); return loadScript(CDN_TINYMCE).then(()=>loadScript(CDN_LANG_AR)); }

  // add font
  (function injectFont(){ const l=document.createElement('link'); l.rel='stylesheet'; l.href=GF_TAJAWAL; document.head.appendChild(l); })();

  // open button
  const openBtn = document.getElementById('cbx-open');
  if (openBtn) openBtn.addEventListener('click', openPopup);

  // utils
  function $(sel,root=document){ return root.querySelector(sel); }
  function $all(sel,root=document){ return Array.from(root.querySelectorAll(sel)); }

  // toast
  function toast(msg){
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = `
      position:fixed; inset-inline-start:50%; transform:translateX(-50%);
      inset-block-end:20px; background:#111; color:#fff; padding:10px 14px; border-radius:10px;
      box-shadow:0 6px 20px rgba(0,0,0,.25); z-index:10000; font-family:Tajawal; font-size:13px;
    `;
    document.body.appendChild(t);
    setTimeout(()=>t.remove(), 1600);
  }

  function download(filename, text){
    const blob = new Blob([text], {type:'text/html;charset=utf-8'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href), 1200);
  }

  function exportWhole(){
    const clone = document.documentElement.cloneNode(true);
    // remove editor artifacts
    ['#cbx-popup','#cbx-open'].forEach(sel=> clone.querySelectorAll(sel).forEach(n=>n.remove()));
    const docType = '<!DOCTYPE html>';
    const html = docType + '\n' + clone.outerHTML;
    download('crimebook_export.html', html);
  }

  // simple version history (keep last 10)
  function histPush(idx, html){
    const key = HIST_PREFIX + idx;
    let arr = [];
    try{ arr = JSON.parse(localStorage.getItem(key)||'[]'); }catch(e){}
    arr.unshift({ ts: Date.now(), html });
    if (arr.length>10) arr = arr.slice(0,10);
    localStorage.setItem(key, JSON.stringify(arr));
  }
  function histList(idx){
    try { return JSON.parse(localStorage.getItem(HIST_PREFIX+idx)||'[]'); } catch(e){ return []; }
  }
  function histRestore(idx, i){
    const arr = histList(idx);
    if (!arr[i]) return null;
    return arr[i].html || null;
  }

  // popup UI
  function buildPopup(pages){
    const overlay = document.createElement('div');
    overlay.id='cbx-popup';
    overlay.dir='rtl';
    overlay.style.cssText = `
      position:fixed; inset:0; background:rgba(0,0,0,.35); z-index:9999;
      display:flex; align-items:center; justify-content:center; font-family:Tajawal,system-ui;
      backdrop-filter: blur(2px);
    `;

    const dlg = document.createElement('div');
    dlg.style.cssText = `
      width:min(1200px, 94vw); height:min(820px, 92vh); background:#fff; border:1px solid #e6e6e6; border-radius:16px;
      display:grid; grid-template-columns:260px 1fr; grid-template-rows:auto 1fr auto; gap:0;
      box-shadow:0 20px 60px rgba(0,0,0,.25); overflow:hidden;
      animation: cbxPop .18s ease;
    `;
    const keyCSS = document.createElement('style');
    keyCSS.textContent = `@keyframes cbxPop{from{transform:scale(.98);opacity:0}to{transform:scale(1);opacity:1}}`;
    document.head.appendChild(keyCSS);

    const header = document.createElement('div');
    header.style.cssText = `
      grid-column:1 / -1; display:flex; align-items:center; justify-content:space-between;
      padding:12px 16px; border-bottom:1px solid #eee; background:#fafafa;
    `;
    header.innerHTML = `
      <div style="display:flex;gap:10px;align-items:center;">
        <strong style="font-size:16px;">المحرّر الملكي — Royal Editor X</strong>
        <span style="font-size:12px;color:#777">عربي • Modern Flat • TinyMCE</span>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <button class="cbx-btn" id="cbx-import">📥 استيراد للصفحة</button>
        <button class="cbx-btn" id="cbx-save">💾 حفظ الصفحة</button>
        <button class="cbx-btn" id="cbx-export">⬇️ تصدير الكتاب HTML</button>
        <button class="cbx-btn danger" id="cbx-close">إغلاق</button>
      </div>
    `;

    const sidebar = document.createElement('div');
    sidebar.style.cssText = `border-inline-end:1px solid #eee; padding:10px; overflow:auto; background:#fff;`;
    const list = document.createElement('div');
    list.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
    pages.forEach((p, i)=>{
      const btn = document.createElement('button');
      btn.className = 'cbx-item';
      btn.dataset.index = i;
      const title = p.querySelector('h1,h2,h3')?.textContent?.trim() || `الصفحة ${i+1}`;
      btn.textContent = `${i+1} — ${title}`;
      list.appendChild(btn);
    });
    sidebar.appendChild(list);

    const area = document.createElement('div');
    area.style.cssText = `display:grid; grid-template-rows:auto auto 1fr;`;
    const topBar = document.createElement('div');
    topBar.style.cssText = `padding:10px 12px; border-bottom:1px solid #eee; background:#fff; display:flex; gap:8px; align-items:center;`;
    topBar.innerHTML = `
      <span style="font-size:13px;color:#666">تحرير:</span>
      <select id="cbx-select" style="padding:6px 10px;border:1px solid #e6e6e6;border-radius:8px;"></select>
      <span style="flex:1"></span>
      <span style="font-size:12px;color:#999">Ctrl/Cmd+S حفظ • Ctrl/Cmd+Enter حفظ وإغلاق</span>
    `;

    const histBar = document.createElement('div');
    histBar.style.cssText = `padding:6px 12px; border-bottom:1px solid #f0f0f0; background:#fcfcfc; display:flex; gap:8px; align-items:center;`;
    histBar.innerHTML = `
      <span style="font-size:12px;color:#777">السجل:</span>
      <select id="cbx-history" style="padding:6px 10px;border:1px solid #e6e6e6;border-radius:8px; min-width:220px;">
        <option value="">— لا توجد نسخ محفوظة —</option>
      </select>
      <button class="cbx-btn" id="cbx-restore">استرجاع النسخة</button>
    `;

    const editorWrap = document.createElement('div');
    editorWrap.style.cssText = `padding:0;`;
    editorWrap.innerHTML = `<textarea id="cbx-editor" style="width:100%;height:100%;"></textarea>`;

    const footer = document.createElement('div');
    footer.style.cssText = `
      grid-column:1 / -1; padding:8px 12px; border-top:1px solid #eee; background:#fafafa; font-size:12px; color:#777;
      display:flex; justify-content:space-between; align-items:center;
    `;
    footer.innerHTML = `<span>Royal Editor X — يدعم RTL وTinyMCE</span><span>Autosave كل 10 ثوانٍ</span>`;

    // styles for buttons
    const css = document.createElement('style');
    css.textContent = `
      .cbx-btn{border:1px solid #e6e6e6;background:#fff;border-radius:10px;padding:8px 12px;cursor:pointer;font-family:Tajawal}
      .cbx-btn:hover{background:#f7f7f7}
      .cbx-btn.danger{color:#d00;border-color:#f0c6c6}
      .cbx-item{all:unset;display:block;width:100%;padding:10px;border:1px solid #eee;border-radius:10px;cursor:pointer;font-family:Tajawal}
      .cbx-item:hover{background:#f7f7f7}
      .cbx-item.active{background:#111;color:#fff;border-color:#111}
    `;
    document.head.appendChild(css);

    // assemble
    overlay.appendChild(dlg);
    dlg.appendChild(header);
    dlg.appendChild(sidebar);
    dlg.appendChild(area);
    area.appendChild(topBar);
    area.appendChild(histBar);
    area.appendChild(editorWrap);
    dlg.appendChild(footer);
    document.body.appendChild(overlay);

    // fill select
    const select = $('#cbx-select', topBar);
    pages.forEach((p,i)=>{
      const o=document.createElement('option');
      const title = p.querySelector('h1,h2,h3')?.textContent?.trim() || `الصفحة ${i+1}`;
      o.value=i; o.textContent = `${i+1} — ${title}`;
      select.appendChild(o);
    });

    return {
      overlay,
      pages,
      listRoot: list,
      select,
      histSelect: $('#cbx-history', histBar),
      btnRestore: $('#cbx-restore', histBar),
      btnSave: $('#cbx-save', header),
      btnExport: $('#cbx-export', header),
      btnImport: $('#cbx-import', header),
      btnClose: $('#cbx-close', header),
      editorId: 'cbx-editor',
      close: ()=>overlay.remove(),
    };
  }

  // main
  async function openPopup(){
    await ensureTiny();

    const pages = $all('.page .content');
    if (!pages.length){ alert('لا توجد .page .content في هذه الصفحة'); return; }

    const ui = buildPopup(pages);

    // init editor
    tinymce.init({
      selector: `#${ui.editorId}`,
      language: 'ar',
      directionality: 'rtl',
      menubar: true,
      statusbar: true,
      branding: false,
      height: '100%',
      skin: 'oxide',
      content_css: 'default',
      content_style: `
        @import url('${GF_TAJAWAL}');
        html,body{font-family:Tajawal,system-ui,Arial; direction:rtl}
        p{line-height:1.9; font-size:16px; color:#333}
        h1,h2,h3{font-weight:700}
        img{max-width:100%; height:auto}
        table{border-collapse:collapse;width:100%}
        table,td,th{border:1px solid #ddd; padding:8px}
      `,
      plugins: 'lists link image media table code codesample fullscreen',
      toolbar: [
        'undo redo | blocks fontfamily fontsize | bold italic underline forecolor backcolor | alignright aligncenter alignleft alignjustify | bullist numlist | link image media table | removeformat | fullscreen code'
      ].join(' '),
      block_unsupported_drop: false
    }).then(editors=>{
      const ed = editors[0];
      bindLogic(ui, ed);
    });
  }

  function bindLogic(ui, ed){
    let currentIndex = 0;
    const { pages } = ui;

    // load index
    function loadIndex(i){
      currentIndex = i;
      // sidebar highlight
      $all('.cbx-item', ui.listRoot).forEach(b=>b.classList.remove('active'));
      const btn = ui.listRoot.querySelector(`[data-index="${i}"]`);
      if (btn) btn.classList.add('active');
      ui.select.value = String(i);

      // prefer autosaved content if found
      const saved = localStorage.getItem(LS_PREFIX+i);
      const html = saved || pages[i].innerHTML || '<p></p>';
      ed.setContent(html);
      fillHistory(i);
    }

    // fill sidebar click
    ui.listRoot.addEventListener('click', (e)=>{
      const el = e.target.closest('.cbx-item'); if(!el) return;
      loadIndex(parseInt(el.dataset.index,10));
    });

    // fill select
    ui.select.addEventListener('change', e=> loadIndex(parseInt(e.target.value,10)));

    // sidebar items indices
    $all('.cbx-item', ui.listRoot).forEach((b,i)=> b.dataset.index=i);

    // first load
    loadIndex(0);

    // save into DOM
    function savePage(){
      const html = ed.getContent({format:'html'});
      // push history BEFORE overwrite
      histPush(currentIndex, pages[currentIndex].innerHTML || '');
      pages[currentIndex].innerHTML = html;
      localStorage.setItem(LS_PREFIX+currentIndex, html);
      fillHistory(currentIndex);
      toast('تم حفظ الصفحة داخل الكتاب ✅');
    }

    // fill history dropdown
    function fillHistory(idx){
      const items = histList(idx);
      ui.histSelect.innerHTML = '<option value="">— اختر نسخة قديمة للاسترجاع —</option>';
      items.forEach((it, i)=>{
        const o = document.createElement('option');
        const d = new Date(it.ts);
        o.value = i;
        o.textContent = `نسخة ${i+1} — ${d.toLocaleString()}`;
        ui.histSelect.appendChild(o);
      });
    }

    // restore
    ui.btnRestore.addEventListener('click', ()=>{
      const val = ui.histSelect.value;
      if (val===''){ toast('اختر نسخة أولاً'); return; }
      const html = histRestore(currentIndex, parseInt(val,10));
      if (html==null){ toast('لا يمكن الاسترجاع'); return; }
      ed.setContent(html);
      toast('تم تحميل النسخة — لا تنسَ حفظ الصفحة لتطبيقها');
    });

    // import for this page
    ui.btnImport.addEventListener('click', ()=>{
      const pasted = prompt('الصق HTML المراد استيراده لهذه الصفحة:');
      if (!pasted) return;
      ed.setContent(pasted);
      toast('تم إدراج المحتوى — احفظ الصفحة لتطبيقه.');
    });

    // export whole book
    ui.btnExport.addEventListener('click', ()=>{
      savePage(); // ensure latest applied
      exportWhole();
    });

    // close
    ui.btnClose.addEventListener('click', ()=>{
      savePage();
      ed.remove();
      ui.close();
    });

    // manual save
    ui.btnSave.addEventListener('click', savePage);

    // keyboard shortcuts
    document.addEventListener('keydown', (e)=>{
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase()==='s'){ e.preventDefault(); savePage(); }
      if (mod && e.key==='Enter'){ e.preventDefault(); savePage(); ed.remove(); ui.close(); }
    }, {capture:true});

    // autosave
    setInterval(()=>{
      const html = ed.getContent({format:'html'});
      localStorage.setItem(LS_PREFIX+currentIndex, html);
    }, AUTOSAVE_MS);
  }
})();

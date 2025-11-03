// notebooklm-fallback.js
// نسخة احتياطية لـ openNotebookCinematic() — تفتح NotebookLM داخل بوابة سينمائية (iframe)
// ضع هذا الملف قبل reader-tools1.js حتى تستدعيه أدوات القارئ كدالة جاهزة.

(function(){
  // URL الـ NotebookLM الأساسي (عدّله لو عندك رابط مختلف أو المسار المحلي)
  const NOTEBOOK_URL = 'https://notebooklm.google.com/'; // غيّر لو عندك عنوان مباشر لمشروعك

  // إذا كانت الدالة معرّفة بالفعل (نسخة رسمية)، لا نغيّرها
  if (typeof window.openNotebookCinematic === 'function') return;

  // ننشئ العنصر مرة وحدة
  function createOverlayIfNeeded(){
    if (document.getElementById('notebookOverlay')) return document.getElementById('notebookOverlay');

    // أنماط سريعة (تقدر تنقلها لملف CSS)
    const style = document.createElement('style');
    style.id = 'notebooklm-fallback-style';
    style.textContent = `
      #notebookOverlay{
        position:fixed; inset:0; display:flex; align-items:center; justify-content:center;
        background:rgba(0,0,0,0.85); z-index:100000; opacity:0; pointer-events:none; transition:opacity .32s;
      }
      #notebookOverlay.show{ opacity:1; pointer-events:auto }
      #notebookBox{
        width: min(1100px, 96vw); height: min(720px, 90vh);
        border-radius:14px; overflow:hidden; background:linear-gradient(180deg,#020617, #07122b);
        border: 2px solid rgba(255,215,0,0.12); box-shadow: 0 20px 60px rgba(0,0,0,0.6);
        transform: translateY(20px); transition: transform .28s;
      }
      #notebookOverlay.show #notebookBox{ transform: translateY(0) }
      #notebookHeader{
        display:flex; align-items:center; gap:8px; padding:10px 12px;
        background:linear-gradient(90deg, rgba(255,215,0,0.04), transparent);
        border-bottom:1px solid rgba(255,215,0,0.03); color:#ffd; font-weight:600;
      }
      #notebookFrame{ width:100%; height: calc(100% - 52px); border:0; display:block; background:#fff }
      #notebookClose{
        margin-left:auto; background:transparent; border:1px solid rgba(255,255,255,0.06);
        color:#ffd700; padding:6px 10px; border-radius:10px; cursor:pointer;
      }
      #notebookError{
        padding:14px; color:#ffd; text-align:center; font-size:0.98rem;
      }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.id = 'notebookOverlay';
    overlay.innerHTML = `
      <div id="notebookBox" role="dialog" aria-modal="true">
        <div id="notebookHeader">
          <div>📔 NotebookLM — بوابة السينما</div>
          <button id="notebookClose">✖ إغلاق</button>
        </div>
        <iframe id="notebookFrame" sandbox="allow-scripts allow-same-origin allow-forms"></iframe>
        <div id="notebookError" style="display:none;"></div>
      </div>
    `;
    document.body.appendChild(overlay);

    // إغلاق
    overlay.querySelector('#notebookClose').addEventListener('click', ()=> closeOverlay());

    // اضغط خارجي للإغلاق
    overlay.addEventListener('click', (ev)=>{ if(ev.target === overlay) closeOverlay(); });

    return overlay;
  }

  function openOverlayWithUrl(url, opts = {}){
    const overlay = createOverlayIfNeeded();
    const iframe = overlay.querySelector('#notebookFrame');
    const errDiv = overlay.querySelector('#notebookError');

    errDiv.style.display = 'none';
    iframe.style.display = 'block';
    try {
      iframe.src = url;
    } catch (e) {
      console.warn('notebooklm-fallback: failed to set iframe src', e);
      showLoadError('فشل تحميل NotebookLM داخل التطبيق.');
      return;
    }

    // إظهار الواجهة
    overlay.classList.add('show');

    // فحص تحميل الصفحة داخل iframe بعد مدة
    const loadTimeout = opts.loadTimeout || 9000; // ms
    let loaded = false;

    function onFrameLoad(){
      loaded = true;
      iframe.removeEventListener('load', onFrameLoad);
      // نجاح التحميل — ممكن نضيف هنا أي تهيئة إضافية
    }
    iframe.addEventListener('load', onFrameLoad);

    // بعد timeout لو ما حمل — نعرض رسالة وخيارات
    setTimeout(()=> {
      if (!loaded) {
        // بعض مواقع مثل notebooklm تمنع ال-iframe (X-Frame-Options أو CSP) — نعرض رسالة بديلة
        showLoadError(`تعذر تحميل NotebookLM داخل الإطار. قد تمنع سياسة الموقع (X-Frame-Options/CSP) العرض داخل التطبيق.`);
      }
    }, loadTimeout);

    function showLoadError(msg){
      iframe.style.display = 'none';
      errDiv.style.display = 'block';
      errDiv.innerHTML = `
        <div style="margin:12px 18px;">
          <div style="font-weight:700; margin-bottom:8px">⚠️ ${msg}</div>
          <div style="margin-bottom:10px">اقتراحات:</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">
            <button id="notebookOpenExternal" class="rt-fallback-btn">فتح في المتصفح</button>
            <button id="notebookRetry" class="rt-fallback-btn">إعادة المحاولة</button>
            <button id="notebookCloseBtn" class="rt-fallback-btn">إغلاق</button>
          </div>
        </div>
      `;
      // أزرار التعامل
      errDiv.querySelector('#notebookRetry').onclick = ()=> {
        iframe.style.display = 'block'; errDiv.style.display='none'; iframe.src = url + '?_=' + Date.now();
      };
      errDiv.querySelector('#notebookCloseBtn').onclick = closeOverlay;
      errDiv.querySelector('#notebookOpenExternal').onclick = ()=> {
        // في المتصفح: افتح في تبويب جديد
        try {
          window.open(url, '_blank');
        } catch(e){
          console.error(e);
        }
        // لو في Electron: افتح خارجياً (سياسة الأمان) — تستدعي الكود داخل main process
        // يمكنك إضافة: require('electron').shell.openExternal(url) من داخل كود Electron.
      };
    }
  }

  function closeOverlay(){
    const overlay = document.getElementById('notebookOverlay');
    if(!overlay) return;
    overlay.classList.remove('show');
    const iframe = overlay.querySelector('#notebookFrame');
    if(iframe) iframe.src = 'about:blank';
  }

  // الدالة التي كانت أدوات القارئ تتوقعها
  window.openNotebookCinematic = function(){
    // طريقة فتح تماشيًا مع طريقة فتح الكتاب: نفتح البوابة السينمائية بداخلها iframe
    openOverlayWithUrl(NOTEBOOK_URL, { loadTimeout: 9000 });
  };

  // للدخول التجريبي: لو حاب تفحص عمل الدالة من المتصفح مباشرة
  // window.addEventListener('keydown', (e)=> { if(e.key==='n' && e.ctrlKey) window.openNotebookCinematic(); });

})();

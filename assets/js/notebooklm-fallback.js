// notebooklm-fallback.js (نسخة Royal Book Cinematic)
function openNotebookCinematic() {
  // لو النافذة موجودة أصلاً
  let overlay = document.getElementById('bookOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'bookOverlay';
    overlay.style.cssText = `
      position:fixed;inset:0;
      display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,0.85);
      z-index:999999;
      opacity:0;pointer-events:none;
      transition:opacity .5s ease;
    `;
    overlay.innerHTML = `
      <div id="bookOverlayContent" style="
        width:92%;height:92%;
        border-radius:16px;
        overflow:hidden;
        background:#000;
        box-shadow:0 0 50px rgba(255,215,0,0.3);
        transform:scale(0.9);
        transition:transform .5s ease;
      ">
        <iframe id="notebookFrame" src="" allow="fullscreen" style="
          width:100%;height:100%;border:0;"></iframe>
      </div>
      <button id="closeNotebook" style="
        position:absolute;top:25px;left:25px;
        background:rgba(255,215,0,0.15);
        border:1px solid rgba(255,215,0,0.6);
        color:#ffd700;
        font-size:22px;font-weight:bold;
        padding:8px 14px;
        border-radius:10px;
        cursor:pointer;
        transition:all .3s ease;
      ">✖</button>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#closeNotebook').addEventListener('click', () => {
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
      overlay.querySelector('#bookOverlayContent').style.transform = 'scale(0.9)';
      setTimeout(() => {
        overlay.remove();
      }, 500);
    });
  }

  // عنوان NotebookLM الرسمي
  const frame = overlay.querySelector('#notebookFrame');
  frame.src = 'https://notebooklm.google.com/'; // ← يمكنك تغييره لصفحة مخصصة لو عندك

  // عرض البوابة السينمائية
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'auto';
    overlay.querySelector('#bookOverlayContent').style.transform = 'scale(1)';
  });
}

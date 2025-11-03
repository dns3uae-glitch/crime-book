/* ============================================================
   🎬 notebooklm-fallback.js — نسخة مطوّرة (أسلوب صفحة البوك)
   ============================================================ */
(function(){
  "use strict";

  if (window.NotebookLM_Cinematic_Ready) return;
  window.NotebookLM_Cinematic_Ready = true;

  function createPortal() {
    if (document.getElementById("nbkCineBack")) return;

    const style = document.createElement("style");
    style.textContent = `
      :root{--gold:#d4af37}
      #nbkCineBack{
        position:fixed;inset:0;z-index:99999;display:none;
        background:radial-gradient(1200px 700px at 50% 45%, rgba(212,175,55,0.1), rgba(0,0,0,0)) , rgba(0,0,0,0.6);
        backdrop-filter:blur(8px);
      }
      #nbkPanel{
        position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
        width:min(1100px,94vw);height:min(720px,88vh);
        border-radius:20px;background:rgba(20,25,32,.8);
        border:1px solid rgba(255,255,255,.08);
        box-shadow:0 0 60px rgba(0,0,0,.7),0 0 0 2px rgba(212,175,55,.1) inset;
        display:flex;flex-direction:column;overflow:hidden;
      }
      #nbkBody{display:flex;flex:1;overflow:hidden}
      #nbkLeft{width:260px;background:rgba(255,255,255,.03);
        border-inline-end:1px solid rgba(255,255,255,.1);
        overflow:auto;padding:10px}
      #nbkRight{flex:1;padding:14px;display:flex;flex-direction:column;justify-content:space-between}
      .nbkItem{padding:8px;border-radius:10px;margin-bottom:8px;background:rgba(255,255,255,.05);cursor:pointer;font-size:14px}
      .nbkItem.active{background:rgba(255,215,0,.15);border:1px solid var(--gold)}
      header#nbkHead{display:flex;justify-content:space-between;align-items:center;
        padding:10px 16px;border-bottom:1px solid rgba(255,255,255,.1)}
      .nbkBtn{background:#111a22;border:1px solid rgba(255,255,255,.1);color:#fff;
        padding:7px 14px;border-radius:10px;cursor:pointer;font-weight:700}
      .nbkBtn.gold{background:var(--gold);color:#000;border:0}
    `;
    document.head.appendChild(style);

    const back = document.createElement("div");
    back.id = "nbkCineBack";
    back.innerHTML = `
      <div id="nbkPanel">
        <header id="nbkHead">
          <strong style="color:var(--gold)">🧠 NotebookLM — وضع سينمائي</strong>
          <div>
            <button class="nbkBtn" id="nbkHow">؟ تعليمات</button>
            <button class="nbkBtn gold" id="nbkClose">إغلاق</button>
          </div>
        </header>
        <div id="nbkBody">
          <aside id="nbkLeft">
            <div class="nbkItem active" data-url="https://notebooklm.google.com/notebook/d4f1d4ef-fec3-496e-b11e-1bb38d405ce5">📘 الدفتر الرئيسي</div>
            <div class="nbkItem" data-url="https://notebooklm.google.com/notebook/d4f1d4ef-fec3-496e-b11e-1bb38d405ce5?artifactId=d1d2c9f3-e698-41eb-8de1-0025156e0982">📗 البطاقات التعليمية</div>
            <div class="nbkItem" data-url="https://notebooklm.google.com/notebook/d4f1d4ef-fec3-496e-b11e-1bb38d405ce5?artifactId=8b77cc97-9149-4b9e-b56b-e103f332fb71">📕 اختبار المعاينة</div>
            <div class="nbkItem" data-url="https://notebooklm.google.com/notebook/d4f1d4ef-fec3-496e-b11e-1bb38d405ce5?artifactId=5ad196ea-d6c2-49a8-8874-65636fa6262d">📙 البودكاست</div>
          </aside>
          <section id="nbkRight">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div><strong style="color:var(--gold)">فتح مباشر فوق نفس الإطار</strong></div>
              <div><button class="nbkBtn gold" id="nbkStart">▶️ ابدأ التفاعل</button></div>
            </div>
            <p style="opacity:.7;font-size:13px;margin-top:10px">سيتم فتح الصفحة فوق هذا الإطار بنفس الحجم والمكان تمامًا ✨</p>
          </section>
        </div>
      </div>
    `;
    document.body.appendChild(back);

    const items = back.querySelectorAll(".nbkItem");
    let currentUrl = items[0].dataset.url;
    items.forEach(i => i.onclick = () => {
      items.forEach(x => x.classList.remove("active"));
      i.classList.add("active");
      currentUrl = i.dataset.url;
    });

    const closeBtn = back.querySelector("#nbkClose");
    const howBtn = back.querySelector("#nbkHow");
    const startBtn = back.querySelector("#nbkStart");

    closeBtn.onclick = () => back.style.display = "none";
    howBtn.onclick = () => alert("اختر القسم ثم اضغط «ابدأ التفاعل». سيتم فتح الصفحة بنفس حجم الإطار الذهبي ✨");

    startBtn.onclick = () => {
      const rect = back.querySelector("#nbkPanel").getBoundingClientRect();
      const left = window.screenX + rect.left + 40;
      const top = window.screenY + rect.top + 60;
      const w = Math.round(rect.width - 80);
      const h = Math.round(rect.height - 100);
      const popup = window.open(currentUrl, "notebookLM",
        `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`);
      if (!popup) alert("⚠️ المتصفح منع النوافذ المنبثقة، فعّلها وأعد المحاولة.");
      else popup.focus();
    };

    window.openNotebookCinematic = () => {
      back.style.display = "block";
    };
  }

  window.addEventListener("DOMContentLoaded", createPortal);
})();

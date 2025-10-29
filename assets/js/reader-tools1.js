/* ==========================================================
   Reader Tools – Cinematic Golden Edition
   Same cinematic portal style as NotebookLM
   Positioned on right side with golden lighting
   ========================================================== */
(function(){
  const style = document.createElement("style");
  style.textContent = `
  :root{
    --gold:#d4af37;--dark:#0a0c0f;--glass:#0f1317ee;
  }
  #readerCineBtn{
    position:fixed;top:50%;right:14px;z-index:2147483600;
    transform:translateY(-50%);
    background:var(--gold);color:var(--dark);
    border:0;border-radius:12px 0 0 12px;
    padding:14px 18px;font-weight:900;
    font-family:"Tajawal",system-ui,Arial;cursor:pointer;
    box-shadow:0 0 24px rgba(212,175,55,.45);
    writing-mode:vertical-rl;text-orientation:mixed;
    letter-spacing:.8px;
  }
  #readerCineBack{
    position:fixed;inset:0;z-index:2147483599;
    display:none;background:radial-gradient(900px 600px at 70% 45%,rgba(212,175,55,.08),rgba(0,0,0,.7));
    backdrop-filter:blur(8px) saturate(1.05);
  }
  #readerCineBack.show{display:block;animation:fadeIn .6s ease forwards;}
  @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
  #readerCineWin{
    position:absolute;top:50%;right:0;transform:translateY(-50%) translateX(102%);
    width:min(680px,45vw);height:min(700px,90vh);
    border-radius:16px 0 0 16px;overflow:hidden;
    background:var(--glass);
    box-shadow:
      -6px 0 24px rgba(0,0,0,.6),
      inset 0 0 120px rgba(212,175,55,.08),
      0 0 0 1px rgba(255,255,255,.08);
    transition:transform .65s cubic-bezier(.18,.88,.26,1.04);
  }
  #readerCineBack.show #readerCineWin{transform:translateY(-50%) translateX(0);}
  #readerCineHalo{
    position:absolute;inset:0;
    background:radial-gradient(600px 380px at 70% 50%,rgba(255,255,200,.12),transparent 70%);
    mix-blend-mode:screen;pointer-events:none;filter:blur(8px);
  }
  #readerHead{
    display:flex;justify-content:space-between;align-items:center;gap:12px;
    padding:14px 18px;border-bottom:1px solid rgba(255,255,255,.08);
    background:linear-gradient(180deg,rgba(255,255,255,.03),rgba(255,255,255,0));
    font-family:"Tajawal",system-ui,Arial;color:#fff;
  }
  #readerHead h3{margin:0;color:var(--gold);font-weight:900;font-size:18px;}
  .rBtn{
    background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);
    color:#fff;padding:8px 14px;border-radius:10px;cursor:pointer;font-weight:700;
  }
  .rBtn:hover{background:rgba(255,255,255,.1);}
  #readerTabs{display:flex;gap:6px;padding:10px;border-bottom:1px solid rgba(255,255,255,.08);}
  .rTab{
    flex:1;text-align:center;padding:10px;border-radius:10px;cursor:pointer;
    border:1px solid rgba(255,255,255,.08);
    background:rgba(255,255,255,.03);color:#ddd;font-weight:800;
  }
  .rTab.active{color:#fff;border-color:var(--gold);box-shadow:0 0 12px rgba(212,175,55,.2);}
  #readerBody{flex:1;padding:10px;overflow:auto;height:calc(100% - 120px);}
  .rCard{
    background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);
    border-radius:12px;padding:12px;margin-bottom:10px;color:#eee;
  }
  .rLabel{font-weight:700;font-size:13px;color:#ccc;margin-bottom:6px;}
  .rField,.rArea,.rOutput{
    width:100%;border:1px solid rgba(255,255,255,.08);
    border-radius:10px;background:#0b0f13;color:#fff;padding:10px;
    font-family:inherit;font-size:14px;
  }
  .rArea{min-height:100px;resize:vertical;}
  .rOutput{min-height:100px;background:#0a0e12;}
  .rRow{display:flex;gap:8px;margin-top:6px;}
  `;
  document.head.appendChild(style);

  // Base elements
  const btn = document.createElement("button");
  btn.id = "readerCineBtn";
  btn.textContent = "📖 أدوات القارئ";

  const back = document.createElement("div");
  back.id = "readerCineBack";
  back.innerHTML = `
    <div id="readerCineWin">
      <div id="readerCineHalo"></div>
      <header id="readerHead">
        <h3>أدوات القارئ</h3>
        <button class="rBtn" id="rClose">إغلاق</button>
      </header>
      <nav id="readerTabs">
        <div class="rTab active" data-tab="dict">📘 القاموس</div>
        <div class="rTab" data-tab="trans">🌐 الترجمة</div>
        <div class="rTab" data-tab="notes">📝 الملاحظات</div>
        <div class="rTab" data-tab="sum">✨ الملخصات</div>
      </nav>
      <section id="readerBody">
        <div class="rCard" data-pane="dict">
          <div class="rLabel">ابحث عن مصطلح</div>
          <div class="rRow">
            <input class="rField" id="rDictInput" placeholder="مثال: مسرح الجريمة" />
            <button class="rBtn" id="rDictBtn">بحث</button>
          </div>
          <div class="rOutput" id="rDictOut" style="margin-top:8px"></div>
        </div>

        <div class="rCard" data-pane="trans" hidden>
          <div class="rLabel">الترجمة</div>
          <textarea class="rArea" id="rTransSrc" placeholder="ألصق النص هنا…"></textarea>
          <div class="rRow">
            <button class="rBtn" id="rToAr">إلى العربية</button>
            <button class="rBtn" id="rToEn">To English</button>
          </div>
          <div class="rOutput" id="rTransOut" style="margin-top:8px"></div>
        </div>

        <div class="rCard" data-pane="notes" hidden>
          <div class="rLabel">ملاحظاتك</div>
          <textarea class="rArea" id="rNotes" placeholder="دوّن ملاحظات…"></textarea>
          <div class="rRow">
            <button class="rBtn" id="rSaveNotes">💾 حفظ</button>
            <button class="rBtn" id="rClearNotes">🗑️ تفريغ</button>
          </div>
        </div>

        <div class="rCard" data-pane="sum" hidden>
          <div class="rLabel">الملخصات</div>
          <div class="rOutput" id="rSumOut">لا توجد ملخصات بعد…</div>
        </div>
      </section>
    </div>
  `;

  document.body.appendChild(btn);
  document.body.appendChild(back);

  const win = back.querySelector("#readerCineWin");
  const tabs = back.querySelectorAll(".rTab");
  const panes = back.querySelectorAll("[data-pane]");
  const closeBtn = back.querySelector("#rClose");

  function openPortal(){
    back.classList.add("show");
  }
  function closePortal(){
    back.classList.remove("show");
    setTimeout(()=>back.style.display="none",500);
  }

  btn.addEventListener("click",()=>{
    back.style.display="block";
    setTimeout(openPortal,10);
  });
  closeBtn.addEventListener("click",closePortal);
  back.addEventListener("click",e=>{if(e.target===back)closePortal();});

  tabs.forEach(t=>{
    t.addEventListener("click",()=>{
      tabs.forEach(x=>x.classList.remove("active"));
      t.classList.add("active");
      panes.forEach(p=>{
        p.hidden = p.dataset.pane!==t.dataset.tab;
      });
    });
  });

  // Tools logic
  const dictBtn = back.querySelector("#rDictBtn");
  const dictInput = back.querySelector("#rDictInput");
  const dictOut = back.querySelector("#rDictOut");
  dictBtn.addEventListener("click",()=>{
    const q = dictInput.value.trim();
    dictOut.innerHTML = q
      ? `🔎 نتيجة شكلية: <b>${q}</b> = <i>[مثال توضيحي]</i>`
      : "اكتب كلمة أولاً…";
  });

  const tSrc = back.querySelector("#rTransSrc");
  const tOut = back.querySelector("#rTransOut");
  back.querySelector("#rToAr").addEventListener("click",()=>{
    const t=tSrc.value.trim();
    tOut.textContent=t?`ترجمة شكلية للعربية: ${t}`:"ألصق نصًا أولاً…";
  });
  back.querySelector("#rToEn").addEventListener("click",()=>{
    const t=tSrc.value.trim();
    tOut.textContent=t?`Pseudo translation: ${t}`:"Paste text first…";
  });

  const notes = back.querySelector("#rNotes");
  const saveNotes = back.querySelector("#rSaveNotes");
  const clearNotes = back.querySelector("#rClearNotes");
  const key = "readerNotes_v1";
  const saved = localStorage.getItem(key);
  if(saved)notes.value=saved;
  saveNotes.addEventListener("click",()=>{
    localStorage.setItem(key,notes.value||"");
    toast("✅ تم حفظ الملاحظات");
  });
  clearNotes.addEventListener("click",()=>{
    notes.value="";
    localStorage.removeItem(key);
    toast("🗑️ تم حذف الملاحظات");
  });

  function toast(msg){
    const t=document.createElement("div");
    t.textContent=msg;
    t.style.cssText="position:fixed;bottom:20px;right:20px;background:rgba(0,0,0,.7);color:#fff;padding:10px 16px;border-radius:10px;font-family:Tajawal;z-index:2147483602;";
    document.body.appendChild(t);
    setTimeout(()=>t.remove(),2000);
  }
})();

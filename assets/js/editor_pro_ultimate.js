/* ==========================================================
 * Royal Editor X — Quantum Edition (AR / RTL / TinyMCE 6)
 * Popup modern flat editor (Arabic UI + Movable + Autosave)
 * ========================================================== */
(function(){
const CDN_TINYMCE = 'https://cdn.tiny.cloud/1/wfzywll71fp456j62a7ol96ku7o9qekq2zfkdhlljs0i4mwn/tinymce/6/tinymce.min.js';
const CDN_LANG_AR = 'https://cdn.jsdelivr.net/npm/tinymce@6-i18n/langs/ar.js';
const GF_TAJAWAL  = 'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;600;700&display=swap';
const LS_PREFIX   = 'royaledx_page_';
const HIST_PREFIX = 'royaledx_hist_';
const AUTOSAVE_MS = 10000;

// تحميل المكتبة
function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=()=>rej(new Error('Load '+src));document.head.appendChild(s);});}
function ensureTiny(){if(window.tinymce)return Promise.resolve();return loadScript(CDN_TINYMCE).then(()=>loadScript(CDN_LANG_AR));}
(function injectFont(){const l=document.createElement('link');l.rel='stylesheet';l.href=GF_TAJAWAL;document.head.appendChild(l);})();

// الزر الرئيسي
const openBtn=document.getElementById('cbx-open');
if(openBtn)openBtn.addEventListener('click',openPopup);

// أدوات مساعدة
function $(sel,root=document){return root.querySelector(sel);}
function $all(sel,root=document){return Array.from(root.querySelectorAll(sel));}

// إشعار صغير
function toast(msg){
 const t=document.createElement('div');
 t.textContent=msg;
 t.style.cssText=`position:fixed;inset-inline-start:50%;transform:translateX(-50%);
 inset-block-end:20px;background:#111;color:#fff;padding:10px 14px;border-radius:10px;
 box-shadow:0 6px 20px rgba(0,0,0,.25);z-index:10000;font-family:Tajawal;font-size:13px;`;
 document.body.appendChild(t);setTimeout(()=>t.remove(),1600);
}

// حفظ وتصدير
function download(filename,text){
 const blob=new Blob([text],{type:'text/html;charset=utf-8'});
 const a=document.createElement('a');
 a.href=URL.createObjectURL(blob);a.download=filename;a.click();
 setTimeout(()=>URL.revokeObjectURL(a.href),1200);
}
function exportWhole(){
 const clone=document.documentElement.cloneNode(true);
 ['#cbx-popup','#cbx-open'].forEach(sel=>clone.querySelectorAll(sel).forEach(n=>n.remove()));
 const html='<!DOCTYPE html>\n'+clone.outerHTML;
 download('crimebook_export.html',html);
}

// السجل
function histPush(idx,html){
 const key=HIST_PREFIX+idx;let arr=[];
 try{arr=JSON.parse(localStorage.getItem(key)||'[]');}catch(e){}
 arr.unshift({ts:Date.now(),html});if(arr.length>10)arr=arr.slice(0,10);
 localStorage.setItem(key,JSON.stringify(arr));
}
function histList(idx){try{return JSON.parse(localStorage.getItem(HIST_PREFIX+idx)||'[]');}catch(e){return[];}}
function histRestore(idx,i){const arr=histList(idx);if(!arr[i])return null;return arr[i].html||null;}

// إنشاء النافذة
function buildPopup(pages){
 const overlay=document.createElement('div');
 overlay.id='cbx-popup';
 overlay.style.cssText=`position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,.15);backdrop-filter:blur(3px);`;

 const dlg=document.createElement('div');
 dlg.style.cssText=`position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
 width:min(1000px,90vw);height:min(700px,90vh);background:#fff;border-radius:16px;
 display:grid;grid-template-columns:260px 1fr;grid-template-rows:auto 1fr auto;
 box-shadow:0 25px 60px rgba(0,0,0,.35);font-family:Tajawal;overflow:hidden;cursor:move;`;

 const header=document.createElement('div');
 header.style.cssText=`grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;
 padding:10px 16px;border-bottom:1px solid #eee;background:#fafafa;`;
 header.innerHTML=`
  <div><b>المحرّر الملكي — Royal Editor X</b><span style="font-size:12px;color:#777"> • عربي • TinyMCE 6</span></div>
  <div style="display:flex;gap:6px;">
   <button class="cbx-btn" id="cbx-import">📥 استيراد</button>
   <button class="cbx-btn" id="cbx-save">💾 حفظ</button>
   <button class="cbx-btn" id="cbx-export">⬇️ تصدير HTML</button>
   <button class="cbx-btn danger" id="cbx-close">إغلاق ✖</button>
  </div>`;

 const sidebar=document.createElement('div');
 sidebar.style.cssText=`border-inline-end:1px solid #eee;padding:10px;overflow:auto;background:#fff;`;
 const list=document.createElement('div');
 list.style.cssText='display:flex;flex-direction:column;gap:6px;';
 pages.forEach((p,i)=>{
   const btn=document.createElement('button');
   btn.className='cbx-item';
   const title=p.querySelector('h1,h2,h3')?.textContent?.trim()||`الصفحة ${i+1}`;
   btn.textContent=`${i+1} — ${title}`;btn.dataset.index=i;list.appendChild(btn);
 });
 sidebar.appendChild(list);

 const area=document.createElement('div');
 area.style.cssText='display:grid;grid-template-rows:auto auto 1fr;';
 const topBar=document.createElement('div');
 topBar.style.cssText='padding:8px 12px;border-bottom:1px solid #eee;background:#fff;display:flex;gap:8px;';
 topBar.innerHTML=`
  <span style="font-size:13px;color:#666">تحرير:</span>
  <select id="cbx-select" style="padding:4px 8px;border:1px solid #e6e6e6;border-radius:8px;"></select>
  <span style="flex:1"></span>
  <span style="font-size:12px;color:#999">Ctrl + S حفظ • Ctrl + Enter إغلاق</span>`;

 const histBar=document.createElement('div');
 histBar.style.cssText='padding:6px 12px;border-bottom:1px solid #f0f0f0;background:#fcfcfc;display:flex;gap:6px;';
 histBar.innerHTML=`
  <span style="font-size:12px;color:#777">السجل:</span>
  <select id="cbx-history" style="padding:4px 8px;border:1px solid #e6e6e6;border-radius:8px;min-width:200px;">
   <option value="">— لا يوجد سجل —</option></select>
  <button class="cbx-btn" id="cbx-restore">استرجاع</button>`;

 const editorWrap=document.createElement('div');
 editorWrap.innerHTML=`<textarea id="cbx-editor" style="width:100%;height:100%;"></textarea>`;

 const footer=document.createElement('div');
 footer.style.cssText='grid-column:1/-1;padding:6px 10px;border-top:1px solid #eee;background:#fafafa;font-size:12px;color:#777;';
 footer.textContent='Royal Editor X — يدعم RTL • TinyMCE 6 • Autosave كل 10 ثوانٍ';

 const css=document.createElement('style');
 css.textContent=`
  .cbx-btn{border:1px solid #e6e6e6;background:#fff;border-radius:8px;padding:6px 10px;cursor:pointer;font-family:Tajawal}
  .cbx-btn:hover{background:#f7f7f7}
  .cbx-btn.danger{color:#d00;border-color:#f0c6c6}
  .cbx-item{all:unset;display:block;width:100%;padding:8px;border:1px solid #eee;border-radius:8px;cursor:pointer;font-family:Tajawal}
  .cbx-item:hover{background:#f7f7f7}
  .cbx-item.active{background:#111;color:#fff;border-color:#111}`;document.head.appendChild(css);

 overlay.appendChild(dlg);
 dlg.appendChild(header);dlg.appendChild(sidebar);
 dlg.appendChild(area);area.appendChild(topBar);area.appendChild(histBar);area.appendChild(editorWrap);
 dlg.appendChild(footer);document.body.appendChild(overlay);

 const select=$('#cbx-select',topBar);
 pages.forEach((p,i)=>{const o=document.createElement('option');o.value=i;o.textContent=`${i+1}`;select.appendChild(o);});

// 🔹 التحريك اليدوي
let drag=false,offX=0,offY=0;
dlg.addEventListener('mousedown',e=>{
 if(e.target.closest('button,select,textarea'))return;
 drag=true;offX=e.clientX-dlg.getBoundingClientRect().left;offY=e.clientY-dlg.getBoundingClientRect().top;
});
document.addEventListener('mousemove',e=>{
 if(!drag)return;
 dlg.style.left=(e.clientX-offX)+'px';dlg.style.top=(e.clientY-offY)+'px';dlg.style.transform='none';
});
document.addEventListener('mouseup',()=>drag=false);

 return {
  overlay,pages,listRoot:list,select,
  histSelect:$('#cbx-history',histBar),
  btnRestore:$('#cbx-restore',histBar),
  btnSave:$('#cbx-save',header),
  btnExport:$('#cbx-export',header),
  btnImport:$('#cbx-import',header),
  btnClose:$('#cbx-close',header),
  editorId:'cbx-editor',
  close:()=>overlay.remove(),
 };
}

// فتح المحرر
async function openPopup(){
 await ensureTiny();
 const pages=$all('.page .content');
 if(!pages.length){alert('لا توجد صفحات لتحريرها');return;}
 const ui=buildPopup(pages);

 tinymce.init({
  selector:`#${ui.editorId}`,language:'ar',directionality:'rtl',
  menubar:true,statusbar:true,branding:false,height:'100%',
  zindex:99999,skin:'oxide',content_css:'default',
  content_style:`@import url('${GF_TAJAWAL}');
   html,body{font-family:Tajawal,system-ui,Arial;direction:rtl;}
   p{line-height:1.9;font-size:16px;color:#333}
   h1,h2,h3{font-weight:700}
   img{max-width:100%;height:auto}`,plugins:'lists link image media table code fullscreen',
  toolbar:'undo redo | blocks fontfamily fontsize | bold italic underline forecolor backcolor | alignright aligncenter alignleft alignjustify | bullist numlist | link image media table | removeformat fullscreen code'
 }).then(editors=>{
  const ed=editors[0];bindLogic(ui,ed);
 });
}

function bindLogic(ui,ed){
 let current=0;const{pages}=ui;
 function load(i){
  current=i;$all('.cbx-item',ui.listRoot).forEach(b=>b.classList.remove('active'));
  const btn=ui.listRoot.querySelector(`[data-index="${i}"]`);if(btn)btn.classList.add('active');
  ui.select.value=String(i);
  const saved=localStorage.getItem(LS_PREFIX+i);
  const html=saved||pages[i].innerHTML||'<p></p>';ed.setContent(html);fillHist(i);
 }
 ui.listRoot.addEventListener('click',e=>{
  const el=e.target.closest('.cbx-item');if(!el)return;load(parseInt(el.dataset.index,10));
 });
 ui.select.addEventListener('change',e=>load(parseInt(e.target.value,10)));
 $all('.cbx-item',ui.listRoot).forEach((b,i)=>b.dataset.index=i);
 load(0);

 function save(){
  const html=ed.getContent({format:'html'});
  histPush(current,pages[current].innerHTML||'');
  pages[current].innerHTML=html;
  localStorage.setItem(LS_PREFIX+current,html);
  fillHist(current);toast('✅ تم الحفظ');
 }
 function fillHist(idx){
  const items=histList(idx);
  ui.histSelect.innerHTML='<option value="">— اختر نسخة —</option>';
  items.forEach((it,i)=>{
   const o=document.createElement('option');
   const d=new Date(it.ts);
   o.value=i;o.textContent=`${i+1} — ${d.toLocaleString()}`;ui.histSelect.appendChild(o);
  });
 }
 ui.btnRestore.addEventListener('click',()=>{
  const v=ui.histSelect.value;if(v===''){toast('اختر نسخة أولاً');return;}
  const html=histRestore(current,parseInt(v,10));if(!html){toast('تعذّر الاسترجاع');return;}
  ed.setContent(html);toast('تم تحميل النسخة');
 });
 ui.btnImport.addEventListener('click',()=>{
  const p=prompt('ألصق HTML للصفحة:');if(!p)return;ed.setContent(p);toast('تم الإدراج');
 });
 ui.btnExport.addEventListener('click',()=>{save();exportWhole();});
 ui.btnClose.addEventListener('click',()=>{save();ed.remove();ui.close();});
 ui.btnSave.addEventListener('click',save);

 document.addEventListener('keydown',e=>{
  const m=e.metaKey||e.ctrlKey;
  if(m&&e.key.toLowerCase()==='s'){e.preventDefault();save();}
  if(m&&e.key==='Enter'){e.preventDefault();save();ed.remove();ui.close();}
 },{capture:true});

 setInterval(()=>{const h=ed.getContent({format:'html'});localStorage.setItem(LS_PREFIX+current,h);},AUTOSAVE_MS);
}
})();

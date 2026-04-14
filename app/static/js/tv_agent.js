const TV_API = window.location.origin + '/api/v1';
const tv = { messages: [], cars: [], user: {}, busy: false };

document.addEventListener('DOMContentLoaded', async function() {
  var pd = document.getElementById('pageData');
  if (pd) { tv.user = { name: pd.dataset.userName||'', phone: pd.dataset.userPhone||'' }; }
  try {
    var r = await fetch(TV_API+'/cars',{credentials:'include'});
    if (r.ok) {
      var d = await r.json();
      tv.cars = (d.cars||[]).map(function(c){
        return {id:c.id,brand:c.hang||'',model:c.dong||'',year:c.nam||0,price:c.gia||0,km:c.km||0,fuel:c.nhien_lieu||'',location:c.khu_vuc||'',image:c.anh||''};
      });
    }
  } catch(e){}
  var hn=document.getElementById('tvHoTen'),ph=document.getElementById('tvPhone');
  if(hn&&tv.user.name) hn.value=tv.user.name;
  if(ph&&tv.user.phone) ph.value=tv.user.phone;
  tvChips(['Xe 500 trieu','Tu van vay xe','Toyota vs Honda','Xe dien tot','SUV gia dinh']);
  tvBotMsg('Xin chao! Minh la tro ly AI AutoMart.\nMinh giup ban tim xe, so sanh, tu van vay.\nBan can tim xe nhu the nao?');
  if(window.lucide) lucide.createIcons();
});

function tvSend() {
  var inp=document.getElementById('tvInput');
  var txt=inp?inp.value.trim():'';
  if(!txt||tv.busy) return;
  inp.value=''; inp.style.height='auto';
  document.getElementById('tvChips').innerHTML='';
  var slot=document.getElementById('tvCarSlot');
  if(slot){slot.style.display='none';slot.innerHTML='';}
  tvUserMsg(txt);
  tv.messages.push({role:'user',content:txt});
  tvCall();
}

async function tvCall() {
  tv.busy=true;
  var btn=document.getElementById('tvSendBtn');
  if(btn) btn.disabled=true;
  tvTyping(true);

  try {
    var r = await fetch(TV_API+'/ai/chat',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      credentials:'include',
      body:JSON.stringify({system:buildSystemPrompt(),messages:tv.messages})
    });

    var d = await r.json();

    if(!r.ok) {
      tvTyping(false);
      tvBotMsg(String(d.error || d.detail || 'Loi ket noi. Thu lai sau.'));
      tv.busy=false; if(btn) btn.disabled=false;
      return;
    }

    tvTyping(false);
    var raw = '';
    if(d.content && Array.isArray(d.content)) {
      raw = d.content.filter(function(b){return b.type==='text';}).map(function(b){return b.text||'';}).join('');
    }
    if(!raw) raw = d.error || d.detail || 'Khong co phan hoi.';
    raw = String(raw);

    var ids=[], re=/\[\[XE:(\d+)\]\]/g, m;
    while((m=re.exec(raw))!==null) ids.push(parseInt(m[1]));
    var clean=raw.replace(/\[\[XE:\d+\]\]/g,'').trim();
    var low=raw.toLowerCase();
    if(['tu van vien','dang ky','nhan vien'].some(function(w){return low.indexOf(w)!==-1;})) tvShowForm();
    tv.messages.push({role:'assistant',content:raw});
    tvBotMsg(clean);
    if(ids.length){
      var found=ids.map(function(id){return tv.cars.find(function(c){return c.id===id;});}).filter(Boolean).slice(0,4);
      if(found.length) tvShowCars(found);
    }
    var t=raw.toLowerCase(), chips;
    if(t.indexOf('trieu')!==-1||t.indexOf('ngan sach')!==-1) chips=['Xe SUV tam gia','Sedan phu hop','Xe dien re'];
    else if(t.indexOf('vay')!==-1) chips=['Dieu kien vay','Vay bao nhieu?','Ngan hang tot?'];
    else if(t.indexOf('so sanh')!==-1) chips=['So sanh xe khac','Xe nao ben?','Chi phi bao duong?'];
    else if(t.indexOf('vinfast')!==-1||t.indexOf('dien')!==-1) chips=['Chi phi sac','VF8 vs VF6','Tram sac o dau?'];
    else chips=['Xem them xe','Tu van vay','Gap tu van vien'];
    tvChips(chips);
  } catch(e) {
    tvTyping(false);
    tvBotMsg('Gap su co. Thu lai hoac goi 1900 1234.');
    console.error('[AI Agent]', e);
  }
  tv.busy=false;
  if(btn) btn.disabled=false;
}

function buildSystemPrompt() {
  var carList = tv.cars.length
    ? tv.cars.map(function(c){
        return '[ID:'+c.id+'] '+c.brand+' '+c.model+' | Nam:'+c.year+' | Gia:'+c.price+'tr | ODO:'+c.km+'km | NL:'+c.fuel+' | KV:'+c.location;
      }).join('\n')
    : 'Chua co du lieu xe.';

  var userCtx = tv.user.name
    ? 'Khach hang: '+tv.user.name+(tv.user.phone?', SDT:'+tv.user.phone:'')+'.'
    : 'Khach chua dang nhap.';

  return 'Ban la tro ly AI cua AutoMart - san mua ban xe cu tai Viet Nam.\n'
    + userCtx + '\n\n'
    + 'NHIEM VU:\n'
    + '- Tu van khach tim xe phu hop ngan sach, nhu cau, khu vuc\n'
    + '- So sanh cac dong xe trong kho\n'
    + '- Giai thich thong tin ky thuat xe\n'
    + '- Tu van so bo ve vay mua xe, bao hiem, dang ky xe\n'
    + '- Khi goi y xe cu the: dung [[XE:ID]], toi da 4 xe\n\n'
    + 'KIEN THUC CO BAN:\n'
    + '- Chi phi sac xe dien tai nha: 1.500-2.500 VND/kWh, trung binh 50.000-80.000 VND/lan sac day\n'
    + '- Sac tai tram cong cong VinFast: 3.858 VND/kWh (AC), 4.500-5.000 VND/kWh (DC fast charge)\n'
    + '- Thue truoc ba: 2-6% tuy tinh (Ha Noi, HCM: 6%, tinh khac: 2%)\n'
    + '- Phi dang ky bien so: 1-2 trieu VND\n'
    + '- Bao hiem bat buoc TNDS: 600.000-700.000 VND/nam\n'
    + '- Bao hiem than xe: 1-1.5% gia tri xe/nam\n'
    + '- Chi phi bao duong xe xang: 3-5 trieu/nam\n'
    + '- Chi phi bao duong xe dien: thap hon 40-60% so xe xang\n'
    + '- Lai suat vay mua xe: 7-9%/nam (ngan hang), 8-11% (cong ty tai chinh)\n'
    + '- Ty le vay toi da: 70-80% gia tri xe, ky han 5-8 nam\n\n'
    + 'NGUYEN TAC BAT BUOC:\n'
    + '1. Chi tra loi dua tren KIEN THUC CO BAN hoac DANH SACH XE ben duoi\n'
    + '2. NEU KHONG BIET chinh xac: noi "Minh chua co thong tin chinh xac, ban lien he truc tiep de duoc ho tro"\n'
    + '3. KHONG bao gio tu y bia dat so lieu, chi phi, chinh sach\n'
    + '4. KHONG nham lan "phi tu van" va "chi phi mua xe" - AutoMart tu van MIEN PHI\n'
    + '5. Tra loi ngan gon, dung trong tam, than thien, bang Tieng Viet\n'
    + '6. Cuoi moi tu van ve xe: nhac khach dang ky gap tu van vien\n\n'
    + 'DANH SACH XE TRONG KHO (' + tv.cars.length + ' xe):\n'
    + carList;
}

function tvShowForm() {
  var w=document.getElementById('tvFormWrapper');
  if(!w||w.style.display!=='none') return;
  w.style.display='block';
  if(window.innerWidth<=960) setTimeout(function(){w.scrollIntoView({behavior:'smooth'});},100);
  tvBotMsg('Form dang ky da mo - dien thong tin de nhan vien lien he trong 30 phut!');
  if(window.lucide) lucide.createIcons();
}

function tvShowCars(cars) {
  var slot=document.getElementById('tvCarSlot');
  if(!slot) return;
  slot.style.display='block';
  slot.innerHTML='<div style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase;margin-bottom:8px;">Xe goi y</div>'
    +'<div style="display:flex;gap:10px;">'
    +cars.map(function(c){
      var img=c.image?'<img src="'+c.image+'" style="width:100%;height:100%;object-fit:cover;">':'';
      return '<a class="tv-mini-card" href="/xe/'+c.id+'">'
        +'<div class="tv-mini-img">'+img+'</div>'
        +'<div class="tv-mini-body">'
        +'<div class="tv-mini-title">'+c.brand+' '+c.model+'</div>'
        +'<div class="tv-mini-price">'+Number(c.price).toLocaleString('vi-VN')+' tr</div>'
        +'<div class="tv-mini-spec">'+c.year+' - '+Number(c.km).toLocaleString('vi-VN')+'km</div>'
        +'</div>'
        +'<span class="tv-mini-cta">Xem chi tiet</span></a>';
    }).join('')+'</div>';
}

function tvUserMsg(text) {
  var box=document.getElementById('tvMessages'); if(!box) return;
  var el=document.createElement('div'); el.className='tv-bubble tv-bubble-user';
  el.innerHTML='<div class="tv-avatar tv-avatar-user"><i data-lucide="user" style="width:16px;height:16px;color:#888;"></i></div>'
    +'<div class="tv-text tv-text-user">'+tvEsc(text)+'</div>';
  box.appendChild(el); box.scrollTop=box.scrollHeight;
  if(window.lucide) lucide.createIcons();
}

function tvBotMsg(text) {
  var box=document.getElementById('tvMessages'); if(!box) return;
  var el=document.createElement('div'); el.className='tv-bubble tv-bubble-bot';
  el.innerHTML='<div class="tv-avatar tv-avatar-bot"><i data-lucide="bot" style="width:16px;height:16px;color:#fff;"></i></div>'
    +'<div class="tv-text tv-text-bot" style="white-space:pre-wrap;">'+tvEsc(text)+'</div>';
  box.appendChild(el); box.scrollTop=box.scrollHeight;
  if(window.lucide) lucide.createIcons();
}

function tvTyping(show) {
  var box=document.getElementById('tvMessages'); if(!box) return;
  var old=document.getElementById('tvTyping'); if(old) old.remove();
  if(!show) return;
  var el=document.createElement('div'); el.id='tvTyping'; el.className='tv-bubble tv-bubble-bot';
  el.innerHTML='<div class="tv-avatar tv-avatar-bot"><i data-lucide="bot" style="width:16px;height:16px;color:#fff;"></i></div>'
    +'<div class="tv-text tv-text-bot" style="padding:10px 16px;">'
    +'<div style="display:flex;gap:5px;align-items:center;">'
    +'<div class="tv-dot"></div><div class="tv-dot"></div><div class="tv-dot"></div>'
    +'</div></div>';
  box.appendChild(el); box.scrollTop=box.scrollHeight;
  if(window.lucide) lucide.createIcons();
}

function tvChips(items) {
  var box=document.getElementById('tvChips'); if(!box) return;
  box.innerHTML=items.map(function(it){
    return '<button class="tv-chip" onclick="tvChipClick(this)">'+it+'</button>';
  }).join('');
}

function tvChipClick(btn) {
  var inp=document.getElementById('tvInput');
  if(inp){inp.value=btn.textContent;inp.focus();}
  tvSend();
}

function tvClearChat() {
  tv.messages=[];
  var box=document.getElementById('tvMessages'); if(box) box.innerHTML='';
  var slot=document.getElementById('tvCarSlot'); if(slot){slot.style.display='none';slot.innerHTML='';}
  tvChips(['Xe 500 trieu','Tu van vay xe','Toyota vs Honda','Xe dien tot','SUV gia dinh']);
  tvBotMsg('Xin chao! Minh la tro ly AI AutoMart.\nBan can tim xe nhu the nao?');
}

function tvKeyDown(e) { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();tvSend();} }
function tvResize(el) { el.style.height='auto'; el.style.height=Math.min(el.scrollHeight,100)+'px'; }

async function tvFormSubmit(e) {
  e.preventDefault();
  var form=e.target, btn=form.querySelector('button[type=submit]');
  var data=Object.fromEntries(new FormData(form));
  if(!data.ho_ten||!data.so_dien_thoai){if(typeof showToast==='function')showToast('Dien ho ten va SDT!');return;}
  if(tv.messages.length>0){
    data.mo_ta=(data.mo_ta?data.mo_ta+'\n\n':'')+'[Chat AI]\n'+
      tv.messages.map(function(m){return(m.role==='user'?'Khach':'AI')+': '+m.content;}).join('\n');
  }
  if(btn){btn.disabled=true;btn.classList.add('btn-loading');}
  try {
    var r=await fetch(TV_API+'/tu-van',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(data)});
    var res=await r.json();
    if(!r.ok){if(typeof showToast==='function')showToast(res.detail||'Gui that bai!');return;}
    var s=document.getElementById('tvFormSuccess');
    if(s){s.style.display='flex';if(window.lucide)lucide.createIcons();}
    if(btn) btn.style.display='none';
    form.reset();
    var hn=document.getElementById('tvHoTen'),ph=document.getElementById('tvPhone');
    if(hn&&tv.user.name)hn.value=tv.user.name;
    if(ph&&tv.user.phone)ph.value=tv.user.phone;
    if(typeof showToast==='function') showToast('Dang ky thanh cong!');
    tvBotMsg('Da dang ky thanh cong! Nhan vien se lien he trong 30 phut.');
  } catch(err){if(typeof showToast==='function')showToast('Khong the ket noi!');}
  finally{if(btn){btn.disabled=false;btn.classList.remove('btn-loading');}}
}

function tvEsc(s){s=s==null?'':String(s);return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

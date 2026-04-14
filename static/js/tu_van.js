const API_BASE_TV = window.location.origin + '/api/v1';

const agentState = {
  messages: [],
  cars: [],
  userInfo: {},
  typing: false,
};

document.addEventListener('DOMContentLoaded', async () => {
  loadUserInfo();
  await loadCarsForAgent();
  bootChat();
  prefillForm();
  if (window.lucide) lucide.createIcons();
});

function loadUserInfo() {
  const el = document.getElementById('pageData');
  if (!el) return;
  agentState.userInfo = {
    name:  el.dataset.userName  || '',
    phone: el.dataset.userPhone || '',
    email: el.dataset.userEmail || '',
  };
}

async function loadCarsForAgent() {
  try {
    const res = await fetch(API_BASE_TV + '/cars', { credentials: 'include' });
    if (!res.ok) throw new Error();
    const data = await res.json();
    agentState.cars = (data.cars || []).map(function(c) {
      return {
        id: c.id, brand: c.hang || '', model: c.dong || '',
        year: c.nam || 0, price: c.gia || 0, km: c.km || 0,
        fuel: c.nhien_lieu || 'Xang', trans: c.hop_so || 'Tu dong',
        location: c.khu_vuc || '', image: c.anh || '', badge: c.badge || '',
      };
    });
  } catch(e) {
    console.warn('[AI Agent] Khong load duoc xe:', e);
  }
}

function prefillForm() {
  var info = agentState.userInfo;
  if (info.name)  { var a = document.getElementById('formHoTen');  if (a) a.value = info.name; }
  if (info.phone) { var b = document.getElementById('formPhone');  if (b) b.value = info.phone; }
}

function buildSystemPrompt() {
  var carList = agentState.cars.length
    ? agentState.cars.map(function(c) {
        return '[ID:' + c.id + '] ' + c.brand + ' ' + c.model +
          ' | Nam:' + c.year + ' | Gia:' + c.price + ' trieu | ODO:' +
          c.km.toLocaleString('vi-VN') + 'km | Nhien lieu:' + c.fuel +
          ' | Hop so:' + c.trans + ' | Khu vuc:' + c.location;
      }).join('\n')
    : 'Hien chua co du lieu xe.';

  var userCtx = agentState.userInfo.name
    ? 'Khach hang dang dang nhap: ' + agentState.userInfo.name +
      (agentState.userInfo.phone ? ', SDT: ' + agentState.userInfo.phone : '') + '.'
    : 'Khach hang chua dang nhap.';

  return 'Ban la tro ly AI cua AutoMart — san mua ban xe cu uy tin tai Viet Nam.\n' +
    userCtx + '\n\n' +
    'NHIEM VU:\n' +
    '- Tu van khach tim xe phu hop ngan sach, nhu cau, khu vuc\n' +
    '- Giai thich uu/nhuoc diem dong xe, so sanh cac xe\n' +
    '- Tu van vay von, bao hiem, bao hanh, kiem dinh\n' +
    '- Khi goi y xe cu the, LUON dung cu phap: [[XE:ID]] vi du [[XE:12]] [[XE:7]]\n' +
    '- Goi y toi da 4 xe moi lan\n\n' +
    'NGUYEN TAC:\n' +
    '- Tra loi bang Tieng Viet, ngan gon, than thien\n' +
    '- Hoi them neu chua ro ngan sach hoac nhu cau\n' +
    '- Khong bia thong tin ngoai danh sach xe ben duoi\n' +
    '- Cuoi moi cau tra loi tu van xe, nhac khach dang ky gap tu van vien.\n\n' +
    'DANH SACH XE TRONG KHO (' + agentState.cars.length + ' xe):\n' +
    carList;
}

function bootChat() {
  renderSuggestions([
    'Xe phu hop ngan sach 500 trieu',
    'Tu van vay mua xe',
    'So sanh Toyota vs Honda',
    'Xe dien tot nhat hien nay',
    'SUV gia dinh duoi 800 trieu',
  ]);
  appendBotMessage(
    'Xin chao! Minh la tro ly AI cua AutoMart.\n' +
    'Minh co the giup ban tim xe phu hop ngan sach, so sanh dong xe, hoac tu van vay mua xe.\n\n' +
    'Ban dang tim loai xe nhu the nao?'
  );
}

async function sendChatMessage() {
  var input = document.getElementById('chatInput');
  var text = input ? input.value.trim() : '';
  if (!text || agentState.typing) return;
  input.value = '';
  input.style.height = 'auto';
  clearSuggestions();
  hideCarSuggestions();
  appendUserMessage(text);
  agentState.messages.push({ role: 'user', content: text });
  await callAnthropicAgent();
}

async function callAnthropicAgent() {
  showTyping();
  try {
    var res = await fetch(API_BASE_TV + '/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        system: buildSystemPrompt(),
        messages: agentState.messages,
      }),
    });
    if (!res.ok) {
      var err = await res.json();
      throw new Error(err.error || 'HTTP ' + res.status);
    }
    var data = await res.json();
    var rawText = (data.content || [])
      .filter(function(b) { return b.type === 'text'; })
      .map(function(b) { return b.text; })
      .join('');
    hideTyping();
    var carIds = [];
    var m;
    var re = /\[\[XE:(\d+)\]\]/g;
    while ((m = re.exec(rawText)) !== null) { carIds.push(parseInt(m[1])); }
    var cleanText = rawText.replace(/\[\[XE:\d+\]\]/g, '').trim();
    var triggers = ['tu van vien', 'dang ky', 'form ben phai', 'nhan vien', 'lien he'];
    var low = rawText.toLowerCase();
    for (var i = 0; i < triggers.length; i++) {
      if (low.indexOf(triggers[i]) !== -1) { showConsultForm(); break; }
    }
    agentState.messages.push({ role: 'assistant', content: rawText });
    appendBotMessage(cleanText);
    if (carIds.length > 0) {
      var suggested = carIds.map(function(id) {
        return agentState.cars.find(function(c) { return c.id === id; });
      }).filter(Boolean).slice(0, 4);
      if (suggested.length) renderCarSuggestions(suggested);
    }
    renderSuggestions(pickFollowUpSuggestions(rawText));
  } catch(err) {
    hideTyping();
    appendBotMessage('Xin loi, minh dang gap su co ket noi. Vui long thu lai hoac lien he hotline 1900 1234.');
    console.error('[AI Agent]', err);
  }
}

function showConsultForm() {
  var wrapper = document.getElementById('consultFormWrapper');
  if (!wrapper || wrapper.style.display !== 'none') return;
  wrapper.style.display = 'block';
  if (window.innerWidth <= 960) {
    setTimeout(function() { wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
  }
  appendBotMessage('Form dang ky da mo o ben phai — ban dien thong tin de nhan vien lien he trong 30 phut nhe!');
  if (window.lucide) lucide.createIcons();
}

function pickFollowUpSuggestions(text) {
  var t = text.toLowerCase();
  if (t.indexOf('ngan sach') !== -1 || t.indexOf('trieu') !== -1)
    return ['Xe SUV trong tam gia nay', 'Xe sedan phu hop', 'Xe dien gia re'];
  if (t.indexOf('vay') !== -1 || t.indexOf('lai suat') !== -1)
    return ['Dieu kien vay mua xe', 'Vay duoc bao nhieu %?', 'Ngan hang nao tot nhat?'];
  if (t.indexOf('so sanh') !== -1 || t.indexOf('vs') !== -1)
    return ['So sanh them xe khac', 'Xe nao ben hon?', 'Chi phi bao duong ra sao?'];
  if (t.indexOf('dien') !== -1 || t.indexOf('vinfast') !== -1)
    return ['Chi phi sac dien moi ngay', 'Vinfast VF8 vs VF6', 'Tram sac o dau?'];
  return ['Xem them xe khac', 'Tu van vay von', 'Lien he tu van vien'];
}

function appendUserMessage(text) {
  var box = document.getElementById('chatMessages');
  if (!box) return;
  var el = document.createElement('div');
  el.className = 'chat-bubble chat-bubble-user';
  el.innerHTML = '<div class="bubble-avatar bubble-avatar-user"><i data-lucide="user" style="width:16px;height:16px;color:#888;"></i></div>' +
    '<div class="bubble-text bubble-text-user">' + escapeHtml(text) + '</div>';
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
  if (window.lucide) lucide.createIcons();
}

function appendBotMessage(text) {
  var box = document.getElementById('chatMessages');
  if (!box) return;
  var el = document.createElement('div');
  el.className = 'chat-bubble chat-bubble-bot';
  el.innerHTML = '<div class="bubble-avatar bubble-avatar-bot"><i data-lucide="bot" style="width:16px;height:16px;color:#fff;"></i></div>' +
    '<div class="bubble-text bubble-text-bot" style="white-space:pre-wrap;">' + escapeHtml(text) + '</div>';
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
  if (window.lucide) lucide.createIcons();
}

function showTyping() {
  agentState.typing = true;
  var btn = document.getElementById('sendBtn');
  if (btn) btn.disabled = true;
  var box = document.getElementById('chatMessages');
  if (!box) return;
  var el = document.createElement('div');
  el.id = 'typingIndicator';
  el.className = 'chat-bubble chat-bubble-bot';
  el.innerHTML = '<div class="bubble-avatar bubble-avatar-bot"><i data-lucide="bot" style="width:16px;height:16px;color:#fff;"></i></div>' +
    '<div class="bubble-text bubble-text-bot" style="padding:10px 16px;">' +
    '<div class="typing-dots"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>';
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
  if (window.lucide) lucide.createIcons();
}

function hideTyping() {
  agentState.typing = false;
  var btn = document.getElementById('sendBtn');
  if (btn) btn.disabled = false;
  var el = document.getElementById('typingIndicator');
  if (el) el.remove();
}

function renderSuggestions(items) {
  var box = document.getElementById('chatSuggestions');
  if (!box) return;
  box.innerHTML = items.map(function(item) {
    return '<button class="suggestion-chip" onclick="selectSuggestion(' + JSON.stringify(item) + ')">' + item + '</button>';
  }).join('');
}

function clearSuggestions() {
  var box = document.getElementById('chatSuggestions');
  if (box) box.innerHTML = '';
}

function renderCarSuggestions(cars) {
  var slot = document.getElementById('carSuggestionSlot');
  var chatBox = document.getElementById('chatMessages');
  if (!slot) return;
  slot.style.display = 'block';
  slot.innerHTML = '<div class="car-suggestion-label">Xe duoc goi y cho ban</div>' +
    '<div class="car-suggestion-row">' + cars.map(buildMiniCarCard).join('') + '</div>';
  if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
}

function hideCarSuggestions() {
  var slot = document.getElementById('carSuggestionSlot');
  if (slot) { slot.style.display = 'none'; slot.innerHTML = ''; }
}

function buildMiniCarCard(car) {
  var imgHtml = car.image
    ? '<img src="' + car.image + '" alt="' + car.brand + ' ' + car.model + '" loading="lazy">'
    : '<svg viewBox="0 0 190 110" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;position:absolute;top:0;left:0;"><rect width="190" height="110" fill="#d8d8d0"/><line x1="0" y1="0" x2="190" y2="110" stroke="#b0b0a8" stroke-width="1"/><line x1="190" y1="0" x2="0" y2="110" stroke="#b0b0a8" stroke-width="1"/></svg>';
  return '<a class="mini-car-card" href="/xe/' + car.id + '">' +
    '<div class="mini-car-img">' + imgHtml + '</div>' +
    '<div class="mini-car-body">' +
    '<div class="mini-car-title">' + car.brand + ' ' + car.model + '</div>' +
    '<div class="mini-car-price">' + Number(car.price).toLocaleString('vi-VN') + ' trieu</div>' +
    '<div class="mini-car-specs"><span>' + car.year + ' - ' + Number(car.km).toLocaleString('vi-VN') + ' km</span>' +
    '<span>' + car.fuel + ' - ' + car.location + '</span></div>' +
    '</div>' +
    '<span class="mini-car-cta">Xem chi tiet</span></a>';
}

function selectSuggestion(text) {
  var input = document.getElementById('chatInput');
  if (input) { input.value = text; input.focus(); }
  sendChatMessage();
}

function clearChat() {
  agentState.messages = [];
  var box = document.getElementById('chatMessages');
  if (box) box.innerHTML = '';
  hideCarSuggestions();
  bootChat();
}

function handleChatKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
}

function autoResizeChat(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 100) + 'px';
}

async function handleConsultFormSubmit(e) {
  e.preventDefault();
  var form = e.target;
  var btn = form.querySelector('button[type="submit"]');
  var data = Object.fromEntries(new FormData(form));
  if (!data.ho_ten || !data.so_dien_thoai) {
    if (typeof showToast === 'function') showToast('Vui long dien ho ten va so dien thoai!');
    return;
  }
  if (agentState.messages.length > 0) {
    data.mo_ta = (data.mo_ta ? data.mo_ta + '\n\n' : '') + '[Lich su chat AI]\n' +
      agentState.messages.map(function(m) {
        return (m.role === 'user' ? 'Khach' : 'AI') + ': ' + m.content;
      }).join('\n');
  }
  if (btn) { btn.disabled = true; btn.classList.add('btn-loading'); }
  try {
    var res = await fetch(API_BASE_TV + '/tu-van', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    var result = await res.json();
    if (!res.ok) {
      if (typeof showToast === 'function') showToast(result.detail || 'Gui that bai!');
      return;
    }
    var successEl = document.getElementById('consultSuccess');
    if (successEl) { successEl.style.display = 'flex'; if (window.lucide) lucide.createIcons(); }
    if (btn) btn.style.display = 'none';
    form.reset();
    prefillForm();
    if (typeof showToast === 'function') showToast('Dang ky tu van thanh cong!');
    appendBotMessage('Ban da dang ky tu van vien thanh cong! Nhan vien AutoMart se lien he ban trong vong 30 phut.');
  } catch(err) {
    if (typeof showToast === 'function') showToast('Khong the ket noi server!');
  } finally {
    if (btn) { btn.disabled = false; btn.classList.remove('btn-loading'); }
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

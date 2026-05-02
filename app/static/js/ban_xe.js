// ── ban_xe.js ──────────────────────────────────────────────────────────────

// Safe modal opener — không phụ thuộc main.js
function bxOpenModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

window.BX_API_BASE = `${window.location.origin}/api/v1`;

// ==================== TOAST ====================
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  const msg = document.getElementById('toastMessage');
  if (msg) msg.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ==================== SELL FORM ====================
async function handleSellSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  const data = Object.fromEntries(new FormData(form));

  if (!data.hang_xe || !data.dong_xe || !data.nam_san_xuat || !data.khu_vuc || !data.ho_ten || !data.so_dien_thoai) {
    showToast('Vui lòng điền đầy đủ thông tin!');
    return;
  }

  const payload = {
    hang_xe: data.hang_xe,
    dong_xe: data.dong_xe,
    nam_san_xuat: parseInt(data.nam_san_xuat),
    so_km: parseInt(data.so_km) || 0,
    gia_mong_muon: parseInt(data.gia_mong_muon) || 0,
    khu_vuc: data.khu_vuc,
    mo_ta: data.mo_ta || '',
    ho_ten: data.ho_ten,
    so_dien_thoai: data.so_dien_thoai
  };

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = 'Đang xử lý...';
  }

  try {
    const res = await fetch(`${window.BX_API_BASE}/ban-xe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (!res.ok) {
      showToast(result.detail || 'Đăng tin thất bại!');
      return;
    }
    showToast('✅ Đăng tin bán xe thành công!');
    form.reset();
    setTimeout(() => { window.location.href = '/danh-sach-ban-xe'; }, 1200);
  } catch (err) {
    console.error(err);
    showToast('Không thể kết nối server. Vui lòng thử lại!');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i data-lucide="tag" style="width:18px;height:18px;"></i> Định giá & bán xe ngay`;
      if (window.lucide) lucide.createIcons();
    }
  }
}

// ==================== AI CHATBOX ====================
const bxState = { messages: [], cars: [], busy: false };

async function loadRealCars() {
  try {
    const res = await fetch(`${window.BX_API_BASE}/cars`, { credentials: 'include' });
    if (!res.ok) return;
    const data = await res.json();
    const arr = Array.isArray(data) ? data : (data.cars || data.data || []);
    bxState.cars = arr.map(c => ({
      id: c.id,
      brand: c.hang || '',
      model: c.dong || '',
      year: c.nam || 0,
      price: c.gia || 0,
      km: c.km || 0,
      fuel: c.loai || ''
    }));
  } catch (e) {
    console.warn('Không load được danh sách xe:', e);
  }
}

function buildSystemPrompt() {
  const carList = bxState.cars.length
    ? bxState.cars.map(c => `[ID:${c.id}] ${c.brand} ${c.model} | ${c.year} | ${c.price}tr`).join('\n')
    : 'Hiện chưa có xe nào trong kho.';
  return `Bạn là trợ lý AI của AutoMart — chợ xe đã qua sử dụng tại Việt Nam. Tư vấn mua/bán xe ngắn gọn, thân thiện, bằng tiếng Việt.\n\nDanh sách xe hiện có:\n${carList}`;
}

async function bxSend() {
  const input = document.getElementById('bxInput');
  const text = input ? input.value.trim() : '';
  if (!text || bxState.busy) return;

  input.value = '';
  const suggestions = document.getElementById('bxSuggestions');
  if (suggestions) suggestions.innerHTML = '';

  bxAppendMsg('user', text);
  bxState.messages.push({ role: 'user', content: text });
  bxState.busy = true;
  bxShowTyping();

  try {
    const res = await fetch(`${window.BX_API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ system: buildSystemPrompt(), messages: bxState.messages })
    });
    const data = await res.json();
    bxHideTyping();
    const reply = data.content?.[0]?.text || data.reply || 'Xin lỗi, tôi chưa hiểu rõ câu hỏi của bạn.';
    bxAppendMsg('bot', reply);
    bxState.messages.push({ role: 'assistant', content: reply });
    bxShowSuggestions(['Xe SUV', 'Xe sedan', 'Xe điện', 'Dưới 500 triệu', 'Xem xe khác']);
  } catch (e) {
    bxHideTyping();
    bxAppendMsg('bot', 'Không thể kết nối AI. Vui lòng thử lại.');
  }

  bxState.busy = false;
}

function bxAppendMsg(role, text) {
  const box = document.getElementById('bxChatMessages');
  if (!box) return;
  const isBot = role === 'bot';
  const div = document.createElement('div');
  div.style.cssText = `display:flex;gap:8px;align-items:flex-end;flex-direction:${isBot ? 'row' : 'row-reverse'};margin-bottom:8px;`;
  div.innerHTML = `
    <div style="width:26px;height:26px;border-radius:50%;flex-shrink:0;background:${isBot ? 'var(--accent-primary)' : '#e2e2da'};display:flex;align-items:center;justify-content:center;">
      <i data-lucide="${isBot ? 'bot' : 'user'}" style="width:14px;height:14px;color:${isBot ? '#fff' : '#888'};"></i>
    </div>
    <div style="max-width:82%;padding:8px 12px;font-size:13px;line-height:1.5;border-radius:${isBot ? '4px 12px 12px 12px' : '12px 4px 12px 12px'};background:${isBot ? '#fff' : 'var(--accent-primary)'};color:${isBot ? '#1a1a1a' : '#fff'};box-shadow:0 1px 4px rgba(0,0,0,.07);white-space:pre-wrap;">${text}</div>`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  if (window.lucide) lucide.createIcons();
}

function bxShowTyping() {
  const box = document.getElementById('bxChatMessages');
  if (!box) return;
  const el = document.createElement('div');
  el.id = 'bxTyping';
  el.style.cssText = 'display:flex;gap:8px;align-items:center;margin-bottom:8px;';
  el.innerHTML = `
    <div style="width:26px;height:26px;border-radius:50%;background:var(--accent-primary);display:flex;align-items:center;justify-content:center;">
      <i data-lucide="bot" style="width:14px;height:14px;color:#fff;"></i>
    </div>
    <div style="background:#fff;border-radius:12px;padding:8px 12px;box-shadow:0 1px 4px rgba(0,0,0,.07);display:flex;gap:4px;">
      <span class="tv-dot"></span><span class="tv-dot"></span><span class="tv-dot"></span>
    </div>`;
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
  if (window.lucide) lucide.createIcons();
}

function bxHideTyping() {
  const el = document.getElementById('bxTyping');
  if (el) el.remove();
}

function bxShowSuggestions(items) {
  const box = document.getElementById('bxSuggestions');
  if (!box) return;
  box.innerHTML = items.map(s =>
    `<button onclick="bxSelectSug('${s}')" style="border:1.5px solid var(--accent-primary);background:transparent;color:var(--accent-primary);border-radius:16px;padding:3px 10px;font-size:11px;cursor:pointer;">${s}</button>`
  ).join('');
}

function bxSelectSug(text) {
  const input = document.getElementById('bxInput');
  if (input) { input.value = text; input.focus(); }
  bxSend();
}

function initBxChat() {
  // Chỉ init nếu chatbox tồn tại (tức là user đã login, Jinja2 đã render)
  const box = document.getElementById('bxChatMessages');
  if (!box) return;

  bxAppendMsg('bot', 'Xin chào! Mình là trợ lý AI AutoMart.\nBạn muốn tư vấn bán xe gì hôm nay?');
  bxShowSuggestions(['Xe SUV', 'Xe sedan', 'Xe điện', 'Dưới 500 triệu', 'Xem xe khác']);

  const input = document.getElementById('bxInput');
  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); bxSend(); }
    });
  }
  if (window.lucide) lucide.createIcons();
}

// ==================== KHỞI TẠO ====================
document.addEventListener('DOMContentLoaded', async () => {
  await loadRealCars();
  initBxChat();
});
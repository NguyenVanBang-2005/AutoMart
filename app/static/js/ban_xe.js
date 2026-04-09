// ── Ban Xe JS ─────────────────────────────────────────
const API_BASE_BX = `${window.location.origin}/api/v1`;

// ── Sell Form ─────────────────────────────────────────
async function handleSellSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const btn  = form.querySelector('button[type="submit"]');

  // Lấy data theo name attribute
  const data = Object.fromEntries(new FormData(form));

  // Validate
  if (!data.hang_xe)        { showToast('Vui lòng chọn hãng xe!'); return; }
  if (!data.dong_xe)        { showToast('Vui lòng nhập dòng xe!'); return; }
  if (!data.nam_san_xuat)   { showToast('Vui lòng chọn năm sản xuất!'); return; }
  if (!data.khu_vuc)        { showToast('Vui lòng chọn khu vực!'); return; }
  if (!data.ho_ten)         { showToast('Vui lòng nhập họ tên!'); return; }
  if (!data.so_dien_thoai)  { showToast('Vui lòng nhập số điện thoại!'); return; }

  const payload = {
    hang_xe:       data.hang_xe,
    dong_xe:       data.dong_xe,
    nam_san_xuat:  parseInt(data.nam_san_xuat),
    so_km:         parseInt(data.so_km) || 0,
    gia_mong_muon: parseInt(data.gia_mong_muon) || 0,
    khu_vuc:       data.khu_vuc,
    mo_ta:         data.mo_ta || '',
    ho_ten:        data.ho_ten,
    so_dien_thoai: data.so_dien_thoai
  };

  if (btn) { btn.disabled = true; btn.classList.add('btn-loading'); }

  try {
    const res    = await fetch(`${API_BASE_BX}/ban-xe`, {
      method:      'POST',
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'include',
      body:        JSON.stringify(payload)
    });
    const result = await res.json();

    if (res.status === 401) {
      showToast('Vui lòng đăng nhập để đăng tin!');
      setTimeout(() => openModal('loginModal'), 800);
      return;
    }
    if (!res.ok) {
      showToast(result.detail || 'Đăng tin thất bại!');
      return;
    }

    showToast('✅ Đăng tin thành công!');
    form.reset();

    // Chuyển sang trang danh sách sau 1.2s
    setTimeout(() => {
      window.location.href = `/danh-sach-ban-xe`;
    }, 1200);

  } catch {
    showToast('Không thể kết nối server!');
  } finally {
    if (btn) { btn.disabled = false; btn.classList.remove('btn-loading'); }
  }
}

// ── AI Chatbox Mini ───────────────────────────────────
const bxChatMessages = [];
let bxTyping = false;

function bxAppendMsg(role, text) {
  const box   = document.getElementById('bxChatMessages');
  if (!box) return;
  const isBot = role === 'bot';
  const div   = document.createElement('div');
  div.style.cssText = `display:flex;gap:8px;align-items:flex-end;flex-direction:${isBot ? 'row' : 'row-reverse'};margin-bottom:8px;`;
  div.innerHTML = `
    <div style="width:26px;height:26px;border-radius:50%;flex-shrink:0;
      background:${isBot ? 'var(--accent-primary)' : '#e2e2da'};
      display:flex;align-items:center;justify-content:center;">
      <i data-lucide="${isBot ? 'bot' : 'user'}" style="width:14px;height:14px;color:${isBot ? '#fff' : '#888'};"></i>
    </div>
    <div style="max-width:82%;padding:8px 12px;font-size:13px;line-height:1.5;
      border-radius:${isBot ? '4px 12px 12px 12px' : '12px 4px 12px 12px'};
      background:${isBot ? '#fff' : 'var(--accent-primary)'};
      color:${isBot ? 'var(--text-primary,#1a1a1a)' : '#fff'};
      box-shadow:0 1px 4px rgba(0,0,0,.07);white-space:pre-wrap;">${text}</div>`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  bxChatMessages.push({ role: isBot ? 'assistant' : 'user', content: text });
  if (bxChatMessages.length > 10) bxChatMessages.shift();
  if (window.lucide) lucide.createIcons();
}

function bxShowTyping() {
  const box = document.getElementById('bxChatMessages');
  if (!box || bxTyping) return;
  bxTyping = true;
  const el  = document.createElement('div');
  el.id = 'bxTyping';
  el.style.cssText = 'display:flex;gap:8px;align-items:center;margin-bottom:8px;';
  el.innerHTML = `
    <div style="width:26px;height:26px;border-radius:50%;background:var(--accent-primary);
      display:flex;align-items:center;justify-content:center;">
      <i data-lucide="bot" style="width:14px;height:14px;color:#fff;"></i>
    </div>
    <div style="background:#fff;border-radius:12px;padding:8px 12px;
      box-shadow:0 1px 4px rgba(0,0,0,.07);display:flex;gap:4px;align-items:center;">
      <span style="width:5px;height:5px;border-radius:50%;background:#c8a96e;animation:pulse-dot .8s infinite;display:inline-block;"></span>
      <span style="width:5px;height:5px;border-radius:50%;background:#c8a96e;animation:pulse-dot .8s .2s infinite;display:inline-block;"></span>
      <span style="width:5px;height:5px;border-radius:50%;background:#c8a96e;animation:pulse-dot .8s .4s infinite;display:inline-block;"></span>
    </div>`;
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
  if (window.lucide) lucide.createIcons();
}

function bxHideTyping() {
  document.getElementById('bxTyping')?.remove();
  bxTyping = false;
}

function bxShowSuggestions(items) {
  const box = document.getElementById('bxSuggestions');
  if (!box) return;
  box.innerHTML = items.map(s => `
    <button onclick="bxSelectSug('${s}')" style="
      border:1.5px solid var(--accent-primary);background:transparent;
      color:var(--accent-primary);border-radius:16px;padding:3px 10px;
      font-size:11px;cursor:pointer;font-family:inherit;transition:.15s;"
      onmouseover="this.style.background='var(--accent-primary)';this.style.color='#fff'"
      onmouseout="this.style.background='transparent';this.style.color='var(--accent-primary)'"
    >${s}</button>`).join('');
}

function bxSelectSug(text) {
  const input = document.getElementById('bxInput');
  if (input) { input.value = text; input.focus(); }
  bxSend();
}

async function bxSend() {
  const input = document.getElementById('bxInput');
  const text  = input?.value.trim();
  if (!text || bxTyping) return;

  input.value = '';
  document.getElementById('bxSuggestions').innerHTML = '';
  bxAppendMsg('user', text);
  bxShowTyping();

  try {
    const res  = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `Bạn là chuyên gia tư vấn mua bán xe hơi của AutoMart. Người dùng đang điền form bán xe. Hãy tư vấn ngắn gọn, thực tế về: định giá xe, cách mô tả tình trạng xe, giấy tờ cần thiết, quy trình bán xe. Trả lời bằng tiếng Việt, tối đa 3-4 câu.`,
        messages: bxChatMessages
      })
    });
    const data  = await res.json();
    const reply = data.content?.[0]?.text || 'Xin lỗi, không thể trả lời lúc này.';
    bxHideTyping();
    bxAppendMsg('bot', reply);
  } catch {
    bxHideTyping();
    bxAppendMsg('bot', 'Không thể kết nối AI. Vui lòng liên hệ hotline 1900 1234!');
  }

  bxShowSuggestions(['Xe tôi trị giá bao nhiêu?', 'Cần giấy tờ gì?', 'Mô tả xe thế nào?']);
}

// ── Init chatbox ──────────────────────────────────────
function initBxChat() {
  // Inject CSS animation nếu chưa có
  if (!document.getElementById('bxChatStyle')) {
    const s = document.createElement('style');
    s.id = 'bxChatStyle';
    s.textContent = `@keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:.3}}`;
    document.head.appendChild(s);
  }

  bxAppendMsg('bot', 'Xin chào! Mình có thể tư vấn bạn về:\n• Cách định giá xe hợp lý\n• Mô tả tình trạng xe\n• Giấy tờ cần chuẩn bị\n\nBạn cần hỗ trợ gì?');
  bxShowSuggestions(['Xe tôi trị giá bao nhiêu?', 'Cần giấy tờ gì để bán xe?', 'Mô tả tình trạng xe thế nào?']);

  const input = document.getElementById('bxInput');
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); bxSend(); }
    });
  }

  if (window.lucide) lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', initBxChat);
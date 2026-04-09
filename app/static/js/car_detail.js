// ── Dữ liệu xe từ template ────────────────────────────
const _carEl    = document.getElementById('carData');
const CAR_PRICE = parseInt(_carEl.dataset.price);
const CAR_NAME  = _carEl.dataset.name;
const AI_MESSAGES = [];

// ── Ảnh ──────────────────────────────────────────────
function switchImage(url) {
  const img = document.getElementById('mainImage');
  if (img) img.src = url;
}

// ── Dịch vụ ──────────────────────────────────────────
function handleService(name) { showToast(`Đang kết nối dịch vụ: ${name}`); }
function handleTestDrive()   { showToast('Đã đăng ký lái thử! Tư vấn viên sẽ liên hệ sớm.'); }

// ── Tính vay ─────────────────────────────────────────
function calcLoan() {
  const pct     = parseInt(document.getElementById('downPaymentPct').value);
  const term    = parseInt(document.getElementById('loanTerm').value);
  const rate    = 0.09 / 12;
  const loan    = CAR_PRICE * (1 - pct / 100);
  const monthly = loan * rate / (1 - Math.pow(1 + rate, -term));
  document.getElementById('downPctLabel').textContent   = pct + '%';
  document.getElementById('monthlyPayment').textContent = monthly.toFixed(1);
}

// ── AI Chat ───────────────────────────────────────────
function appendAiMsg(role, text) {
  const box   = document.getElementById('aiMessages');
  const isBot = role === 'bot';
  const div   = document.createElement('div');
  div.style.cssText = `display:flex;gap:8px;align-items:flex-end;flex-direction:${isBot ? 'row' : 'row-reverse'};`;
  div.innerHTML = `
    <div style="width:28px;height:28px;border-radius:50%;flex-shrink:0;background:${isBot ? 'var(--accent-primary)' : '#e2e2da'};display:flex;align-items:center;justify-content:center;font-size:14px;">
      ${isBot ? '🤖' : '👤'}
    </div>
    <div style="max-width:80%;padding:10px 14px;font-size:13.5px;line-height:1.55;border-radius:${isBot ? '4px 14px 14px 14px' : '14px 4px 14px 14px'};background:${isBot ? '#fff' : 'var(--accent-primary)'};color:${isBot ? 'var(--text-primary)' : '#fff'};box-shadow:0 1px 4px rgba(0,0,0,.07);white-space:pre-wrap;">${text}</div>`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  AI_MESSAGES.push({ role: isBot ? 'assistant' : 'user', content: text });
  if (AI_MESSAGES.length > 10) AI_MESSAGES.shift();
}

function showAiTyping() {
  const box = document.getElementById('aiMessages');
  const el  = document.createElement('div');
  el.id = 'aiTyping';
  el.innerHTML = `
    <div style="display:flex;gap:8px;align-items:center;">
      <div style="width:28px;height:28px;border-radius:50%;background:var(--accent-primary);display:flex;align-items:center;justify-content:center;font-size:14px;">🤖</div>
      <div style="background:#fff;border-radius:14px;padding:10px 14px;box-shadow:0 1px 4px rgba(0,0,0,.07);display:flex;gap:4px;align-items:center;">
        <span style="width:6px;height:6px;border-radius:50%;background:#c8a96e;animation:pulse-dot .8s infinite;display:inline-block;"></span>
        <span style="width:6px;height:6px;border-radius:50%;background:#c8a96e;animation:pulse-dot .8s .2s infinite;display:inline-block;"></span>
        <span style="width:6px;height:6px;border-radius:50%;background:#c8a96e;animation:pulse-dot .8s .4s infinite;display:inline-block;"></span>
      </div>
    </div>`;
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
}

function hideAiTyping() { document.getElementById('aiTyping')?.remove(); }

function showAiSuggestions(items) {
  const box = document.getElementById('aiSuggestions');
  if (!box) return;
  box.innerHTML = items.map(s => `
    <button onclick="selectAiSug('${s}')" style="border:1.5px solid var(--accent-primary);background:transparent;color:var(--accent-primary);border-radius:20px;padding:4px 12px;font-size:12px;cursor:pointer;font-family:inherit;transition:.18s;"
      onmouseover="this.style.background='var(--accent-primary)';this.style.color='#fff'"
      onmouseout="this.style.background='transparent';this.style.color='var(--accent-primary)'">${s}</button>`).join('');
}

function selectAiSug(text) {
  const input = document.getElementById('aiInput');
  if (input) { input.value = text; input.focus(); }
  sendAiMessage();
}

async function sendAiMessage() {
  const input = document.getElementById('aiInput');
  const text  = input?.value.trim();
  if (!text) return;
  input.value = '';
  document.getElementById('aiSuggestions').innerHTML = '';
  appendAiMsg('user', text);
  showAiTyping();
  try {
    const res  = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `Bạn là chuyên gia tư vấn xe hơi của AutoMart. Người dùng đang xem xe ${CAR_NAME}, giá ${CAR_PRICE} triệu VNĐ. Trả lời ngắn gọn, thân thiện, chuyên nghiệp bằng tiếng Việt.`,
        messages: AI_MESSAGES
      })
    });
    const data  = await res.json();
    const reply = data.content?.[0]?.text || 'Xin lỗi, tôi không thể trả lời lúc này.';
    hideAiTyping();
    appendAiMsg('bot', reply);
  } catch {
    hideAiTyping();
    appendAiMsg('bot', 'Không thể kết nối AI. Vui lòng liên hệ hotline 1900 1234!');
  }
  showAiSuggestions(['Xe có bền không?', 'Chi phí bảo dưỡng?', 'So sánh với xe khác']);
}

// ── CSS ───────────────────────────────────────────────
const _style = document.createElement('style');
_style.textContent = `@keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:.3}}`;
document.head.appendChild(_style);

// ── Init ──────────────────────────────────────────────
calcLoan();
appendAiMsg('bot', `Xin chào! Bạn đang xem ${CAR_NAME}.\nMình có thể tư vấn về xe này, chi phí vay, bảo hiểm hoặc bảo dưỡng. Bạn muốn hỏi gì?`);
showAiSuggestions(['Chi phí sở hữu thực tế?', 'Có nên mua xe này không?', 'Tư vấn vay vốn']);
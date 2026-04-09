// ── Chat với người bán (simulate + AI fallback) ───────
const SELLER_MESSAGES = [];
let sellerTyping = false;

const SELLER_NAME = document.querySelector('strong')?.textContent || 'Người bán';

function sellerAppendMsg(role, text) {
  const box   = document.getElementById('sellerMessages');
  const isMe  = role === 'user';
  const div   = document.createElement('div');
  div.style.cssText = `display:flex;gap:8px;align-items:flex-end;flex-direction:${isMe ? 'row-reverse' : 'row'};`;
  div.innerHTML = `
    <div style="width:28px;height:28px;border-radius:50%;flex-shrink:0;
      background:${isMe ? '#e2e2da' : 'var(--accent-primary)'};
      display:flex;align-items:center;justify-content:center;">
      <i data-lucide="${isMe ? 'user' : 'user-circle'}" style="width:14px;height:14px;color:${isMe ? '#888' : '#fff'};"></i>
    </div>
    <div style="max-width:80%;padding:9px 13px;font-size:13.5px;line-height:1.5;
      border-radius:${isMe ? '14px 4px 14px 14px' : '4px 14px 14px 14px'};
      background:${isMe ? 'var(--accent-primary)' : '#fff'};
      color:${isMe ? '#fff' : 'var(--text-primary,#1a1a1a)'};
      box-shadow:0 1px 4px rgba(0,0,0,.07);white-space:pre-wrap;">${text}</div>`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  SELLER_MESSAGES.push({ role: isMe ? 'user' : 'assistant', content: text });
  if (window.lucide) lucide.createIcons();
}

function sellerShowTyping() {
  if (sellerTyping) return;
  sellerTyping = true;
  const box = document.getElementById('sellerMessages');
  const el  = document.createElement('div');
  el.id = 'sellerTyping';
  el.style.cssText = 'display:flex;gap:8px;align-items:center;';
  el.innerHTML = `
    <div style="width:28px;height:28px;border-radius:50%;background:var(--accent-primary);
      display:flex;align-items:center;justify-content:center;">
      <i data-lucide="user-circle" style="width:14px;height:14px;color:#fff;"></i>
    </div>
    <div style="background:#fff;border-radius:14px;padding:9px 13px;
      box-shadow:0 1px 4px rgba(0,0,0,.07);display:flex;gap:4px;align-items:center;">
      <span style="width:6px;height:6px;border-radius:50%;background:#c8a96e;animation:pulse-dot .8s infinite;display:inline-block;"></span>
      <span style="width:6px;height:6px;border-radius:50%;background:#c8a96e;animation:pulse-dot .8s .2s infinite;display:inline-block;"></span>
      <span style="width:6px;height:6px;border-radius:50%;background:#c8a96e;animation:pulse-dot .8s .4s infinite;display:inline-block;"></span>
    </div>`;
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
  if (window.lucide) lucide.createIcons();
}

function sellerHideTyping() {
  document.getElementById('sellerTyping')?.remove();
  sellerTyping = false;
}

async function sellerSend() {
  const input = document.getElementById('sellerInput');
  const text  = input?.value.trim();
  if (!text || sellerTyping) return;

  input.value = '';
  sellerAppendMsg('user', text);
  sellerShowTyping();

  // Lấy thông tin xe từ trang
  const carInfo = document.querySelector('h1')?.textContent || 'xe này';
  const price   = document.querySelector('[style*="accent-primary"]')?.textContent || '';

  try {
    const res  = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: `Bạn đang đóng vai người bán xe tên "${SELLER_NAME}" trên sàn AutoMart. Xe đang bán: ${carInfo}, giá ${price}. Trả lời ngắn gọn, thân thiện như một người bán xe thực sự. Nếu được hỏi về thông tin xe, hãy dựa vào thông tin đã có. Trả lời bằng tiếng Việt, tối đa 2-3 câu.`,
        messages: SELLER_MESSAGES
      })
    });
    const data  = await res.json();
    const reply = data.content?.[0]?.text || 'Xin lỗi, tôi chưa thể trả lời ngay. Vui lòng gọi điện cho tôi!';
    sellerHideTyping();
    sellerAppendMsg('bot', reply);
  } catch {
    sellerHideTyping();
    sellerAppendMsg('bot', 'Hiện tôi không online. Bạn có thể gọi điện trực tiếp cho tôi nhé!');
  }
}

// ── CSS ───────────────────────────────────────────────
const _s = document.createElement('style');
_s.textContent = `@keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:.3}}`;
document.head.appendChild(_s);

// ── Init ──────────────────────────────────────────────
sellerAppendMsg('bot', `Xin chào! Tôi là ${SELLER_NAME}, chủ xe này.\nBạn có câu hỏi gì về xe không? Tôi sẽ trả lời sớm nhất có thể 😊`);
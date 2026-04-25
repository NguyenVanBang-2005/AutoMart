/* ═══════════════════════════════════════════════════════════
   tv_agent.js — AutoMart AI Chat + Config Panel
   ═══════════════════════════════════════════════════════════ */

// ── State ──────────────────────────────────────────────────
let tvHistory = [];          // [{role, content}]
let tvLoading = false;
let tvPanelOpen = false;

let tvConfig = {
  persona: 'thân thiện',
  focus:   'tìm xe phù hợp',
  budget:  5,                // 0-5, 5 = mọi mức
  brands:  [],               // [] = tất cả
  year:    '',               // '' = tất cả
};

const TV_BUDGET_LABELS = [
  'Mọi mức', 'dưới 300 triệu', '300–500 triệu',
  '500 triệu–1 tỷ', '1–1.5 tỷ', '1.5–2 tỷ', 'trên 2 tỷ'
];

// ── System prompt builder ──────────────────────────────────
function tvBuildSystemPrompt() {
  const budget = tvConfig.budget === 5
    ? 'mọi mức giá'
    : TV_BUDGET_LABELS[tvConfig.budget];

  const brands = tvConfig.brands.length
    ? tvConfig.brands.join(', ')
    : 'tất cả hãng xe';

  const year = tvConfig.year || 'mọi năm sản xuất';

  let toneGuide = '';
  if (tvConfig.persona === 'thân thiện')    toneGuide = 'Nói chuyện thân thiện, gần gũi, dùng từ ngữ đời thường.';
  if (tvConfig.persona === 'chuyên nghiệp') toneGuide = 'Phong cách chuyên nghiệp, chính xác, trích dẫn số liệu cụ thể.';
  if (tvConfig.persona === 'ngắn gọn')      toneGuide = 'Trả lời ngắn gọn, súc tích, tối đa 3-4 câu mỗi lượt.';

  return `Bạn là AutoMart AI, trợ lý tư vấn xe cũ thông minh của AutoMart Việt Nam — nền tảng mua bán xe uy tín tại Việt Nam.

CÁCH GIAO TIẾP: ${toneGuide}
LĨNH VỰC TRỌNG TÂM: ${tvConfig.focus}.
NGÂN SÁCH KHÁCH HÀNG: ${budget}.
HÃNG XE ƯU TIÊN: ${brands}.
NĂM SẢN XUẤT: ${year}.

QUY TẮC:
- Luôn trả lời bằng tiếng Việt.
- Khi gợi ý xe, đưa ra tối đa 3 xe cụ thể, nêu tên model, giá ước tính, ưu điểm nổi bật.
- Ưu tiên các xe phù hợp với ngân sách và hãng đã cấu hình.
- Nếu không có xe phù hợp, hãy nói thật và gợi ý thay thế hợp lý.
- Không bịa đặt thông tin. Nếu không chắc, hãy nói "Bạn nên liên hệ nhân viên AutoMart để xác nhận chính xác."
- Cuối mỗi câu trả lời dài, hỏi thêm 1 câu để hiểu thêm nhu cầu khách hàng.`;
}

// ── Panel toggle ───────────────────────────────────────────
function tvTogglePanel() {
  tvPanelOpen = !tvPanelOpen;
  const body    = document.getElementById('tvPanelBody');
  const chevron = document.getElementById('tvPanelChevron');

  if (tvPanelOpen) {
    body.style.maxHeight = body.scrollHeight + 800 + 'px';
    body.style.opacity   = '1';
    chevron.style.transform = 'rotate(180deg)';
    // Render Lucide icons bên trong panel sau khi mở
    setTimeout(() => { if (window.lucide) lucide.createIcons(); }, 50);
  } else {
    body.style.maxHeight = '0';
    body.style.opacity   = '0';
    chevron.style.transform = 'rotate(0deg)';
  }
}

// ── Tab switch ─────────────────────────────────────────────
function tvSwitchTab(n) {
  document.getElementById('tvConfigPane').style.display = n === 1 ? 'block' : 'none';
  document.getElementById('tvFormPane').style.display   = n === 2 ? 'block' : 'none';
  document.getElementById('tvTab1').classList.toggle('tv-tab-active', n === 1);
  document.getElementById('tvTab2').classList.toggle('tv-tab-active', n === 2);

  // Recalc panel height
  const body = document.getElementById('tvPanelBody');
  if (tvPanelOpen) {
    body.style.maxHeight = body.scrollHeight + 800 + 'px';
  }
  // Re-render icons
  setTimeout(() => { if (window.lucide) lucide.createIcons(); }, 50);
}

// ── Pill picker (single select) ────────────────────────────
function tvPickPill(el, groupId) {
  document.querySelectorAll(`#${groupId} .tv-pill`).forEach(b => b.classList.remove('tv-pill-active'));
  el.classList.add('tv-pill-active');
}

// ── Pill picker (multi select) cho brand ──────────────────
function tvPickPillMulti(el, groupId, isAll) {
  const group = document.getElementById(groupId);
  const allBtn = group.querySelector('[data-val=""]');

  if (isAll) {
    // "Tất cả" được chọn → bỏ hết, chỉ active "Tất cả"
    group.querySelectorAll('.tv-pill').forEach(b => b.classList.remove('tv-pill-active'));
    allBtn.classList.add('tv-pill-active');
    return;
  }

  // Bỏ active "Tất cả"
  allBtn.classList.remove('tv-pill-active');
  el.classList.toggle('tv-pill-active');

  // Nếu không còn hãng nào được chọn → quay về "Tất cả"
  const anyActive = [...group.querySelectorAll('.tv-pill:not([data-val=""])')].some(b => b.classList.contains('tv-pill-active'));
  if (!anyActive) allBtn.classList.add('tv-pill-active');
}

// ── Budget slider ──────────────────────────────────────────
function tvBudgetChange(val) {
  const v = parseInt(val);
  const labels = ['Mọi mức', '< 300tr', '300–500tr', '500tr–1 tỷ', '1–1.5 tỷ', '1.5–2 tỷ', '> 2 tỷ'];
  document.getElementById('tvBudgetLabel').textContent = labels[v] || 'Mọi mức';

  // Update track fill
  const pct = (v / 5) * 100;
  document.getElementById('tvBudgetTrack').style.width = pct + '%';
}

// ── Apply config & reset chat ──────────────────────────────
function tvApplyConfig() {
  // Đọc persona
  const personaEl = document.querySelector('#tvPersonaGroup .tv-pill-active');
  if (personaEl) tvConfig.persona = personaEl.dataset.val;

  // Đọc focus
  const focusEl = document.querySelector('#tvFocusGroup .tv-pill-active');
  if (focusEl) tvConfig.focus = focusEl.dataset.val;

  // Đọc budget
  tvConfig.budget = parseInt(document.getElementById('tvBudget').value);

  // Đọc brands
  tvConfig.brands = [...document.querySelectorAll('#tvBrandGroup .tv-pill-active')]
    .map(b => b.dataset.val)
    .filter(v => v !== '');

  // Đọc year
  const yearEl = document.querySelector('#tvYearGroup .tv-pill-active');
  tvConfig.year = yearEl ? yearEl.dataset.val : '';

  // Update subtitle
  tvUpdateSubtitle();

  // Reset chat với config mới
  tvClearChat();

  // Hiện thông báo
  const applied = document.getElementById('tvConfigApplied');
  applied.style.display = 'block';
  setTimeout(() => { applied.style.display = 'none'; }, 2500);
}

// ── Update subtitle header ─────────────────────────────────
function tvUpdateSubtitle() {
  const budgetLabels = ['Mọi mức', '<300tr', '300–500tr', '500tr–1tỷ', '1–1.5tỷ', '1.5–2tỷ', '>2tỷ'];
  const budget = budgetLabels[tvConfig.budget] || 'Mọi mức';

  const personaMap = { 'thân thiện': 'Thân thiện', 'chuyên nghiệp': 'Chuyên nghiệp', 'ngắn gọn': 'Ngắn gọn' };
  const focusMap = {
    'tìm xe phù hợp': 'Tìm xe',
    'tư vấn vay vốn mua xe': 'Vay vốn',
    'bảo hành & bảo hiểm xe': 'Bảo hành',
    'định giá xe cũ': 'Định giá',
  };

  const persona = personaMap[tvConfig.persona] || tvConfig.persona;
  const focus   = focusMap[tvConfig.focus] || tvConfig.focus;

  document.getElementById('tvPanelSubtitle').textContent = `${persona} · ${focus} · ${budget}`;
}

// ── Clear chat ─────────────────────────────────────────────
function tvClearChat() {
  tvHistory = [];
  tvLoading = false;
  document.getElementById('tvMessages').innerHTML = '';
  document.getElementById('tvCarSlot').style.display  = 'none';
  document.getElementById('tvCarSlot').innerHTML      = '';
  document.getElementById('tvChips').innerHTML        = '';
  tvShowWelcome();
}

// ── Welcome message ────────────────────────────────────────
function tvShowWelcome() {
  const focusMap = {
    'tìm xe phù hợp':        'Bạn cần tìm một chiếc xe như thế nào?',
    'tư vấn vay vốn mua xe':  'Bạn muốn tư vấn gói vay mua xe nào?',
    'bảo hành & bảo hiểm xe': 'Bạn cần tư vấn bảo hành cho dòng xe nào?',
    'định giá xe cũ':         'Bạn muốn định giá chiếc xe nào?',
  };
  const question = focusMap[tvConfig.focus] || 'Bạn cần tìm một chiếc xe như thế nào?';

  tvAppendBot(`Xin chào, mình là AutoMart AI của trang web bán xe cũ AutoMart.\nMình giúp bạn tìm xe, so sánh, và tư vấn vay.\nVậy, ${question}`);

  tvSetChips([
    'Xe dưới 500 triệu',
    'Toyota phổ biến',
    'Xe gia đình 7 chỗ',
    'Xe tiết kiệm xăng',
    'Xe mới nhập 2022+',
  ]);
}

// ── Append bot message ─────────────────────────────────────
function tvAppendBot(text) {
  const wrap = document.getElementById('tvMessages');
  const div  = document.createElement('div');
  div.className = 'tv-bubble tv-bubble-bot';
  div.innerHTML = `
    <div class="tv-avatar tv-avatar-bot">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        <line x1="12" y1="15" x2="12" y2="17"/>
      </svg>
    </div>
    <div class="tv-text tv-text-bot" style="white-space:pre-line;">${tvEscape(text)}</div>`;
  wrap.appendChild(div);
  tvScrollBottom();
}

// ── Append user message ────────────────────────────────────
function tvAppendUser(text) {
  const wrap = document.getElementById('tvMessages');
  const div  = document.createElement('div');
  div.className = 'tv-bubble tv-bubble-user';
  div.innerHTML = `
    <div class="tv-avatar tv-avatar-user">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    </div>
    <div class="tv-text tv-text-user">${tvEscape(text)}</div>`;
  wrap.appendChild(div);
  tvScrollBottom();
}

// ── Typing indicator ───────────────────────────────────────
function tvShowTyping() {
  const wrap = document.getElementById('tvMessages');
  const div  = document.createElement('div');
  div.className = 'tv-bubble tv-bubble-bot';
  div.id = 'tvTypingIndicator';
  div.innerHTML = `
    <div class="tv-avatar tv-avatar-bot">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        <line x1="12" y1="15" x2="12" y2="17"/>
      </svg>
    </div>
    <div class="tv-text tv-text-bot" style="display:flex;gap:5px;align-items:center;padding:12px 16px;">
      <span class="tv-dot"></span><span class="tv-dot"></span><span class="tv-dot"></span>
    </div>`;
  wrap.appendChild(div);
  tvScrollBottom();
}

function tvHideTyping() {
  const el = document.getElementById('tvTypingIndicator');
  if (el) el.remove();
}

// ── Quick chips ────────────────────────────────────────────
function tvSetChips(chips) {
  const el = document.getElementById('tvChips');
  el.innerHTML = chips.map(c =>
    `<button class="tv-chip" onclick="tvChipClick(this,'${tvEscape(c)}')">${tvEscape(c)}</button>`
  ).join('');
}

function tvChipClick(el, text) {
  document.getElementById('tvInput').value = text;
  tvSend();
}

// ── Send message ───────────────────────────────────────────
async function tvSend() {
  if (tvLoading) return;
  const input = document.getElementById('tvInput');
  const text  = input.value.trim();
  if (!text) return;

  input.value = '';
  tvResize(input);
  document.getElementById('tvChips').innerHTML = '';

  tvAppendUser(text);
  tvHistory.push({ role: 'user', content: text });

  tvLoading = true;
  tvShowTyping();

  try {
    const res = await fetch('/api/v1/tu-van/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages:      tvHistory,
        system_prompt: tvBuildSystemPrompt(),
      }),
    });

    tvHideTyping();

    if (!res.ok) throw new Error('API error ' + res.status);
    const data = await res.json();
    const reply = data.reply || data.message || '(Không có phản hồi)';

    tvAppendBot(reply);
    tvHistory.push({ role: 'assistant', content: reply });

    // Gợi ý chips tiếp theo
    tvSetChips(['Xem thêm xe khác', 'So sánh 2 xe', 'Tư vấn vay vốn', 'Đặt lịch xem xe']);

  } catch (err) {
    tvHideTyping();
    tvAppendBot('Xin lỗi, hiện tại không thể kết nối. Vui lòng thử lại sau hoặc gọi Hotline 1900 1234.');
    console.error('[tv_agent]', err);
  }

  tvLoading = false;
}

// ── Keyboard handler ───────────────────────────────────────
function tvKeyDown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    tvSend();
  }
}

// ── Auto-resize textarea ───────────────────────────────────
function tvResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 100) + 'px';
}

// ── Scroll to bottom ───────────────────────────────────────
function tvScrollBottom() {
  const el = document.getElementById('tvMessages');
  el.scrollTop = el.scrollHeight;
}

// ── HTML escape ────────────────────────────────────────────
function tvEscape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Form submit ────────────────────────────────────────────
async function tvFormSubmit(e) {
  e.preventDefault();
  const form    = document.getElementById('tvForm');
  const data    = Object.fromEntries(new FormData(form));
  const success = document.getElementById('tvFormSuccess');

  try {
    const res = await fetch('/api/v1/tu-van', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    });
    if (res.ok) {
      success.style.display = 'flex';
      form.reset();
      setTimeout(() => { success.style.display = 'none'; }, 4000);
    }
  } catch (err) {
    console.error('[tvForm]', err);
  }
}

// ── Init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Prefill form từ user đang đăng nhập (nếu có)
  const pageData = document.getElementById('pageData');
  if (pageData) {
    const name  = pageData.dataset.userName;
    const phone = pageData.dataset.userPhone;
    if (name)  { const el = document.getElementById('tvHoTen');  if (el) el.value = name; }
    if (phone) { const el = document.getElementById('tvPhone');  if (el) el.value = phone; }
  }

  // Budget track init (slider bắt đầu ở max = "Mọi mức")
  tvBudgetChange(5);

  // Hiện welcome message
  tvShowWelcome();
});
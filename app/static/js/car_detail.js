// car_detail.js

const API_BASE = `${window.location.origin}/api/v1`;

const ai = {
    messages: [],
    cars: [],
    currentCar: null,
    busy: false
};

// ── Fix: khai báo global để onclick trong HTML gọi được ──
window.switchImage = function(url, thumbEl) {
    const main = document.getElementById('mainImage');
    if (main) main.src = url;

    // Cập nhật active thumb
    document.querySelectorAll('.cd-thumb').forEach(t => t.classList.remove('active'));
    if (thumbEl) thumbEl.classList.add('active');
};

window.handleService = function(name) {
    const input = document.getElementById('aiInput');
    if (input) {
        input.value = 'Tư vấn về dịch vụ: ' + name;
        sendAiMessage();
    }
};

window.aiQuickAsk = function(text) {
    const input = document.getElementById('aiInput');
    if (input) {
        input.value = text;
        sendAiMessage();
    }
};

function getCurrentCar() {
    const el = document.getElementById('carData');
    if (!el) return null;
    return {
        name: el.dataset.name || '',
        price: parseInt(el.dataset.price) || 0
    };
}

async function loadRealCars() {
    try {
        const res = await fetch(`${API_BASE}/cars`, { credentials: 'include' });
        if (res.ok) {
            const data = await res.json();
            const carsArray = Array.isArray(data) ? data : (data.cars || data.data || []);
            ai.cars = carsArray.map(c => ({
                id: c.id,
                brand: c.hang || '',
                model: c.dong || '',
                year: c.nam || 0,
                price: c.gia || 0,
                km: c.km || 0,
                fuel: c.nhien_lieu || '',
                location: c.khu_vuc || ''
            }));
        }
    } catch (e) {
        console.warn('Không load được danh sách xe', e);
    }
}

function buildSystemPrompt() {
    const car = ai.currentCar;
    const carContext = car
        ? `Xe đang xem: ${car.name} - Giá ${car.price} triệu\n`
        : '';
    const carList = ai.cars.length
        ? ai.cars.map(c => `[ID:${c.id}] ${c.brand} ${c.model} | ${c.year} | ${c.price}tr | ${c.km}km`).join('\n')
        : 'Chưa có xe nào trong kho.';

    return `Bạn là trợ lý AI chuyên tư vấn mua xe của AutoMart.
${carContext}
NHIỆM VỤ:
- Tư vấn chi tiết về xe đang xem
- So sánh với các xe khác trong kho
- Giải thích thông số kỹ thuật, chi phí sở hữu, vay vốn, bảo hiểm
- Trả lời ngắn gọn, thân thiện, bằng tiếng Việt

DANH SÁCH XE TRONG KHO:
${carList}`;
}

function aiUserMsg(text) {
    const box = document.getElementById('aiMessages');
    if (!box) return;
    const div = document.createElement('div');
    div.style.cssText = 'display:flex;justify-content:flex-end;margin-bottom:12px;';
    div.innerHTML = `<div style="max-width:75%;background:var(--accent-primary);color:white;padding:10px 14px;border-radius:12px 4px 12px 12px;">${text}</div>`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

function aiBotMsg(text) {
    const box = document.getElementById('aiMessages');
    if (!box) return;
    const div = document.createElement('div');
    div.style.cssText = 'display:flex;margin-bottom:12px;';
    div.innerHTML = `<div style="max-width:75%;background:#fff;padding:10px 14px;border-radius:4px 12px 12px 12px;box-shadow:0 1px 4px rgba(0,0,0,.08);">${text}</div>`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

function aiShowTyping() {
    const box = document.getElementById('aiMessages');
    if (!box) return;
    const typing = document.createElement('div');
    typing.id = 'aiTyping';
    typing.style.cssText = 'display:flex;margin-bottom:12px;';
    typing.innerHTML = `<div style="background:#fff;padding:10px 14px;border-radius:4px 12px 12px 12px;box-shadow:0 1px 4px rgba(0,0,0,.08);display:flex;gap:5px;">
        <div class="tv-dot"></div><div class="tv-dot"></div><div class="tv-dot"></div>
    </div>`;
    box.appendChild(typing);
    box.scrollTop = box.scrollHeight;
}

function aiHideTyping() {
    const el = document.getElementById('aiTyping');
    if (el) el.remove();
}

function aiShowSuggestions(items) {
    const box = document.getElementById('aiSuggestions');
    if (!box) return;
    box.innerHTML = items.map(item =>
        `<button onclick="aiQuickAsk('${item}')" style="font-size:12px;padding:4px 12px;border:1px solid #d4af37;color:#d4af37;background:transparent;border-radius:9999px;cursor:pointer;">${item}</button>`
    ).join('');
}

window.sendAiMessage = async function() {
    const input = document.getElementById('aiInput');
    const text = input ? input.value.trim() : '';
    if (!text || ai.busy) return;

    input.value = '';
    aiUserMsg(text);
    ai.messages.push({ role: 'user', content: text });
    ai.busy = true;
    aiShowTyping();

    try {
        const res = await fetch(`${API_BASE}/ai/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                system: buildSystemPrompt(),
                messages: ai.messages
            })
        });
        const data = await res.json();
        aiHideTyping();
        const reply = data.content?.[0]?.text || data.reply || 'Xin lỗi, tôi chưa hiểu rõ.';
        aiBotMsg(reply);
        ai.messages.push({ role: 'assistant', content: reply });
        aiShowSuggestions(['So sánh xe khác', 'Chi phí vay', 'Bảo hiểm', 'Lái thử', 'Xem thêm xe']);
    } catch (e) {
        aiHideTyping();
        aiBotMsg('Không thể kết nối AI. Vui lòng thử lại sau.');
    }
    ai.busy = false;
};

// ── Tính khoản vay ──
window.calcLoan = function() {
    const carData = document.getElementById('carData');
    if (!carData) return;
    const price = parseFloat(carData.dataset.price) || 0;
    if (price <= 0) return;

    const downPct = parseFloat(document.getElementById('downPaymentPct').value) || 30;
    document.getElementById('downPctLabel').textContent = downPct + '%';

    const months = parseInt(document.getElementById('loanTerm').value) || 36;
    const monthlyRate = 0.09 / 12;
    const loanAmount = price * (1 - downPct / 100);
    const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, months)) /
                           (Math.pow(1 + monthlyRate, months) - 1);

    const el = document.getElementById('monthlyPayment');
    if (el) el.textContent = monthlyPayment.toFixed(2);
};

// ── Init ──
document.addEventListener('DOMContentLoaded', async () => {
    ai.currentCar = getCurrentCar();
    await loadRealCars();

    // Chat welcome
    const initialMsg = ai.currentCar
        ? `Chào bạn! Bạn đang xem xe <strong>${ai.currentCar.name}</strong> giá ${ai.currentCar.price} triệu.<br>Mình có thể tư vấn gì cho bạn?`
        : 'Chào bạn! Bạn muốn hỏi gì về xe này?';
    aiBotMsg(initialMsg);
    aiShowSuggestions(['Giá có thương lượng không?', 'Chi phí bảo dưỡng?', 'So sánh với xe khác', 'Tính vay mua xe', 'Đăng ký lái thử']);

    // Enter để gửi
    const input = document.getElementById('aiInput');
    if (input) {
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); sendAiMessage(); }
        });
    }

    // Loan calculator — dùng addEventListener thay oninput inline
    const slider = document.getElementById('downPaymentPct');
    const select = document.getElementById('loanTerm');
    if (slider) slider.addEventListener('input', calcLoan);
    if (select) select.addEventListener('change', calcLoan);
    calcLoan();

    if (window.lucide) lucide.createIcons();
});
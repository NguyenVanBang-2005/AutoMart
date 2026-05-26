const ai = {
    messages: [],
    busy: false,
    currentCar: null
};

// ── Lấy thông tin xe đang xem ──────────────────────────────
function getCurrentCar() {
    var el = document.getElementById('carData');
    if (!el) return null;
    return {
        name: el.dataset.name || '',
        price: parseInt(el.dataset.price) || 0
    };
}

function switchImage(url) {
    var main = document.getElementById('mainImage');
    if (main) main.src = url;
}

// ── System prompt (inject context xe đang xem) ─────────────
function buildSystemPrompt() {
    var car = ai.currentCar;
    var carContext = car
        ? 'Khách hàng đang xem xe: ' + car.name + ' - Giá ' + car.price + ' triệu.\n'
        : '';

    return 'Bạn là AutoMart AI, trợ lý tư vấn xe cũ thông minh của AutoMart Việt Nam.\n'
        + carContext
        + '\nQUY TẮC:\n'
        + '- Luôn trả lời bằng tiếng Việt, thân thiện và ngắn gọn.\n'
        + '- Tư vấn chi tiết về xe đang xem, so sánh với xe khác trong kho.\n'
        + '- Giải thích thông số kỹ thuật, chi phí sở hữu, vay vốn, bảo hiểm.\n'
        + '- Không bịa đặt thông tin. Nếu không chắc, hãy nói "Bạn nên liên hệ nhân viên AutoMart để xác nhận."\n'
        + '- Cuối mỗi câu trả lời dài, hỏi thêm 1 câu để hiểu thêm nhu cầu.\n';
}

// ── Markdown parser ─────────────────────────────────────────
function cdEscape(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function cdMarkdown(text) {
    return cdEscape(text)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|\n)\* (.+)/g, '$1<span style="margin-right:6px;">•</span>$2')
        .replace(/(^|\n)- (.+)/g, '$1<span style="margin-right:6px;">•</span>$2')
        .replace(/\*([^\*\n]+)\*/g, '<em>$1</em>')
        .replace(/\/xe\/(\d+)/g, '<a href="/xe/$1" target="_blank" style="color:#c8a96e;font-weight:600;text-decoration:underline;">Xem chi tiết</a>')
        .replace(/`([^`]+)`/g, '<code style="background:#f0ede4;padding:1px 5px;border-radius:3px;font-size:12px;">$1</code>')
        .replace(/\n/g, '<br>');
}

// ── Chat UI ─────────────────────────────────────────────────
function aiUserMsg(text) {
    var box = document.getElementById('aiMessages');
    if (!box) return;
    var div = document.createElement('div');
    div.style.cssText = 'display:flex;justify-content:flex-end;margin-bottom:12px;';
    div.innerHTML = '<div style="max-width:75%;background:var(--accent-primary);color:white;padding:10px 14px;border-radius:12px 4px 12px 12px;">'
        + cdEscape(text) + '</div>';
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

function aiBotMsg(text, isHtml) {
    var box = document.getElementById('aiMessages');
    if (!box) return;
    var div = document.createElement('div');
    div.style.cssText = 'display:flex;margin-bottom:12px;';
    var content = isHtml ? text : cdMarkdown(text);
    div.innerHTML = '<div style="max-width:75%;background:#fff;padding:10px 14px;border-radius:4px 12px 12px 12px;box-shadow:0 1px 4px rgba(0,0,0,.08);">'
        + content + '</div>';
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

function aiShowTyping() {
    var box = document.getElementById('aiMessages');
    if (!box) return;
    var typing = document.createElement('div');
    typing.id = 'aiTyping';
    typing.style.cssText = 'display:flex;margin-bottom:12px;';
    typing.innerHTML = '<div style="background:#fff;padding:10px 14px;border-radius:4px 12px 12px 12px;box-shadow:0 1px 4px rgba(0,0,0,.08);display:flex;gap:5px;">'
        + '<div class="tv-dot"></div><div class="tv-dot"></div><div class="tv-dot"></div></div>';
    box.appendChild(typing);
    box.scrollTop = box.scrollHeight;
}

function aiHideTyping() {
    var el = document.getElementById('aiTyping');
    if (el) el.remove();
}

function aiShowSuggestions(items) {
    var box = document.getElementById('aiSuggestions');
    if (!box) return;
    box.innerHTML = items.map(function(item) {
        return '<button onclick="aiQuickAsk(\'' + item.replace(/'/g, '') + '\')" '
            + 'style="font-size:12px;padding:4px 12px;border:1px solid #c8a96e;color:#c8a96e;'
            + 'background:transparent;border-radius:9999px;cursor:pointer;font-family:inherit;">'
            + item + '</button>';
    }).join('');
}

function aiQuickAsk(text) {
    var input = document.getElementById('aiInput');
    if (input) {
        input.value = text;
        sendAiMessage();
    }
}

// ── Gửi tin nhắn — dùng chung endpoint /tu-van/chat ────────
async function sendAiMessage() {
    var input = document.getElementById('aiInput');
    var text = input ? input.value.trim() : '';
    if (!text || ai.busy) return;

    input.value = '';
    aiUserMsg(text);
    ai.messages.push({ role: 'user', content: text });

    ai.busy = true;
    aiShowTyping();

    try {
        var res = await fetch('/api/v1/tu-van/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                messages: ai.messages,
                system_prompt: buildSystemPrompt()
            })
        });

        aiHideTyping();

        if (!res.ok) throw new Error('API error ' + res.status);
        var data = await res.json();
        var reply = data.reply || '(Không có phản hồi)';

        aiBotMsg(reply, false);
        ai.messages.push({ role: 'assistant', content: reply });

        aiShowSuggestions(['So sánh xe khác', 'Chi phí vay', 'Bảo hiểm', 'Đăng ký lái thử']);

    } catch (e) {
        aiHideTyping();
        aiBotMsg('Không thể kết nối AI. Vui lòng thử lại sau hoặc gọi Hotline 1900 1234.', true);
        console.error('[car_detail AI]', e);
    }

    ai.busy = false;
}

// ── Tính khoản vay ──────────────────────────────────────────
function calcLoan() {
    var carData = document.getElementById('carData');
    if (!carData) return;

    var price = parseFloat(carData.dataset.price) || 0;
    if (price <= 0) return;

    var downPct = parseFloat(document.getElementById('downPaymentPct').value) || 30;
    document.getElementById('downPctLabel').textContent = downPct + '%';

    var months = parseInt(document.getElementById('loanTerm').value) || 36;
    var annualRate = 0.09;
    var monthlyRate = annualRate / 12;
    var loanAmount = price * (1 - downPct / 100);

    var monthlyPayment = 0;
    if (monthlyRate > 0) {
        monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, months)) /
            (Math.pow(1 + monthlyRate, months) - 1);
    } else {
        monthlyPayment = loanAmount / months;
    }

    var displayEl = document.getElementById('monthlyPayment');
    if (displayEl) {
        displayEl.textContent = monthlyPayment.toFixed(2);
    }
}

function initLoanCalculator() {
    var slider = document.getElementById('downPaymentPct');
    var select = document.getElementById('loanTerm');
    if (slider) slider.addEventListener('input', calcLoan);
    if (select) select.addEventListener('change', calcLoan);
    calcLoan();
}

initLoanCalculator();

// ── Khởi tạo ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
    ai.currentCar = getCurrentCar();

    var car = ai.currentCar;
    var initialMsg = car
        ? 'Chào bạn! Bạn đang xem xe <strong>' + cdEscape(car.name) + '</strong> giá ' + car.price + ' triệu.<br>Mình có thể tư vấn gì cho bạn về xe này?'
        : 'Chào bạn! Bạn muốn hỏi gì về xe này?';

    aiBotMsg(initialMsg, true);
    aiShowSuggestions(['Giá có thương lượng không?', 'Chi phí bảo dưỡng?', 'So sánh với xe khác', 'Tính vay mua xe']);

    if (window.lucide) lucide.createIcons();
});
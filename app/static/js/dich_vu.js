// ══════════════════════════════════════════════════
// dich_vu.js — Trang Dịch Vụ AutoMart
// ══════════════════════════════════════════════════

const API_BASE = `${window.location.origin}/api/v1`;

// ── Đọc trạng thái login từ data attribute ────────
// Tránh Jinja2-in-JS: main.py truyền qua hidden div
function getIsLoggedIn() {
  const el = document.getElementById('dvPageData');
  return el?.dataset.loggedIn === 'true';
}

// ── Tab switching ────────────────────────────────
function switchTab(tab) {
  const isLaiThu = tab === 'lai-thu';
  document.getElementById('panelLaiThu').style.display = isLaiThu ? 'block' : 'none';
  document.getElementById('panelHoTro').style.display  = isLaiThu ? 'none'  : 'block';
  document.querySelectorAll('.dv-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
}

// ── FAQ accordion ────────────────────────────────
function toggleFaq(i) {
  const body = document.getElementById(`faqBody${i}`);
  const icon = document.getElementById(`faqIcon${i}`);
  const isOpen = body.style.display === 'block';
  body.style.display   = isOpen ? 'none' : 'block';
  icon.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
}

// ── File upload preview ──────────────────────────
function initFileUpload(inputId, previewId, labelId) {
  const input   = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  const label   = document.getElementById(labelId);
  if (!input || !preview) return;

  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      showToast('❌ Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP');
      input.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('❌ Ảnh không được vượt quá 5MB');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      preview.innerHTML = `
        <div style="position:relative;display:inline-block;width:100%;">
          <img src="${e.target.result}" alt="preview">
          <button type="button"
            class="dv-upload-clear-btn"
            onclick="clearFileUpload('${inputId}','${previewId}','${labelId}')">✕</button>
          <div class="dv-upload-preview-name">${file.name}</div>
        </div>`;
      if (label) label.style.display = 'none';
    };
    reader.readAsDataURL(file);
  });
}

function clearFileUpload(inputId, previewId, labelId) {
  const input   = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  const label   = document.getElementById(labelId);
  if (input)   input.value = '';
  if (preview) preview.innerHTML = '';
  if (label)   label.style.display = 'flex';
}

// ── Submit lái thử ───────────────────────────────
async function handleLaiThuSubmit(e) {
  e.preventDefault();

  if (!getIsLoggedIn()) {
    showToast('❌ Vui lòng đăng nhập để đặt lịch lái thử');
    openModal('loginModal');
    return;
  }

  const form     = e.target;
  const btn      = form.querySelector('button[type="submit"]');
  const cccdFile = document.getElementById('anhCccd')?.files[0];
  const gplxFile = document.getElementById('anhGplx')?.files[0];

  if (!cccdFile) { showToast('❌ Vui lòng tải lên ảnh CCCD/CMND'); return; }
  if (!gplxFile) { showToast('❌ Vui lòng tải lên ảnh Giấy phép lái xe'); return; }

  const fd = new FormData(form);
  fd.set('anh_cccd', cccdFile);
  fd.set('anh_gplx', gplxFile);

  btn.disabled  = true;
  btn.innerHTML = '<span style="opacity:.6">Đang gửi...</span>';

  try {
    const res  = await fetch(`${API_BASE}/lai-thu`, {
      method: 'POST',
      credentials: 'include',
      body: fd,
    });
    const data = await res.json();

    if (!res.ok) {
      showToast(`❌ ${data.detail || 'Đặt lịch thất bại!'}`);
      return;
    }

    showToast('✅ Đặt lịch lái thử thành công! Chúng tôi sẽ liên hệ sớm.');
    form.reset();
    clearFileUpload('anhCccd', 'anhCccdPreview', 'anhCccdLabel');
    clearFileUpload('anhGplx', 'anhGplxPreview', 'anhGplxLabel');

  } catch (err) {
    console.error(err);
    showToast('❌ Không thể kết nối server!');
  } finally {
    btn.disabled  = false;
    btn.innerHTML = '<i data-lucide="calendar-check" style="width:16px;height:16px;"></i> Đặt lịch lái thử';
    lucide.createIcons();
  }
}

// ── Submit hỗ trợ ────────────────────────────────
function handleHoTroSubmit(e) {
  e.preventDefault();
  showToast('✅ Đã gửi câu hỏi! Chúng tôi sẽ phản hồi trong 2 giờ.');
  e.target.reset();
}

// ── Init ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('dateInput');
  if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];

  // Chỉ init upload khi đã đăng nhập (form tồn tại)
  if (getIsLoggedIn()) {
    initFileUpload('anhCccd', 'anhCccdPreview', 'anhCccdLabel');
    initFileUpload('anhGplx', 'anhGplxPreview', 'anhGplxLabel');
  }
});
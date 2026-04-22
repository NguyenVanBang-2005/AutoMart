// ====================== EMAIL & OTP MODULE ======================
// File chuyên trách logic gửi OTP và multi-step register

let _regData = {
  ho_ten: '',
  email: '',
  so_dien_thoai: '',
  password: ''
};

let resendTimer = null;

// ==================== GỬI OTP ====================
async function sendOTP(email) {
  try {
    const res = await fetch(`${API_BASE}/users/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const result = await res.json();

    if (!res.ok) {
      showToast(result.detail || 'Gửi OTP thất bại!');
      return false;
    }

    showToast(`Đã gửi mã OTP đến ${email}`);
    return true;
  } catch (err) {
    console.error(err);
    showToast('Không thể kết nối server!');
    return false;
  }
}

// ==================== XÁC THỰC OTP ====================
async function verifyOTP(email, otp) {
  try {
    const res = await fetch(`${API_BASE}/users/register-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        ho_ten: _regData.ho_ten || 'Người dùng',
        email: email,
        so_dien_thoai: _regData.so_dien_thoai,
        password: _regData.password,
        otp: otp
      })
    });

    const result = await res.json();

    if (!res.ok) {
      showToast(result.detail || 'Xác thực OTP thất bại!');
      return false;
    }

    return true;
  } catch (err) {
    console.error(err);
    showToast('Không thể kết nối server!');
    return false;
  }
}

// ==================== OTP INPUT UI ====================
function initOTPBoxes() {
  const container = document.getElementById('otpContainer');
  if (!container) return;

  container.innerHTML = '';

  for (let i = 0; i < 6; i++) {
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 1;
    input.className = 'otp-box';
    input.style.cssText = `
      width: 48px; height: 48px; text-align: center; font-size: 24px;
      border: 2px solid #e2e8f0; border-radius: 8px; margin: 0 4px;
    `;

    // Auto focus next box
    input.addEventListener('input', function () {
      if (this.value.length === 1) {
        const next = this.nextElementSibling;
        if (next) next.focus();
      }
    });

    // Backspace
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Backspace' && this.value === '') {
        const prev = this.previousElementSibling;
        if (prev) prev.focus();
      }
    });

    // Paste toàn bộ OTP
    input.addEventListener('paste', function (e) {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').trim();
      if (/^\d{6}$/.test(pasted)) {
        const boxes = container.querySelectorAll('.otp-box');
        for (let i = 0; i < 6; i++) {
          boxes[i].value = pasted[i];
        }
        boxes[5].focus();
      }
    });

    container.appendChild(input);
  }

  // Focus vào ô đầu tiên
  setTimeout(() => container.querySelector('.otp-box').focus(), 300);
}

// ==================== COUNTDOWN RESEND ====================
function startResendCountdown(btn) {
  let timeLeft = 60;
  btn.disabled = true;
  btn.textContent = `Gửi lại sau ${timeLeft}s`;

  if (resendTimer) clearInterval(resendTimer);

  resendTimer = setInterval(() => {
    timeLeft--;
    btn.textContent = `Gửi lại sau ${timeLeft}s`;

    if (timeLeft <= 0) {
      clearInterval(resendTimer);
      btn.disabled = false;
      btn.textContent = 'Gửi lại mã OTP';
    }
  }, 1000);
}

// ==================== MULTI-STEP REGISTER ====================
function regGoStep2() {
  const email = document.getElementById('regEmail').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const agreed = document.getElementById('regAgree').checked;

  if (!email || !email.includes('@')) {
    showToast('Vui lòng nhập email hợp lệ!');
    return;
  }
  if (!phone || phone.length < 9) {
    showToast('Vui lòng nhập số điện thoại hợp lệ!');
    return;
  }
  if (!agreed) {
    showToast('Vui lòng đồng ý với điều khoản!');
    return;
  }

  _regData.email = email;
  _regData.so_dien_thoai = phone;
  regShowStep(2);
}

async function regGoStep3() {
  const pw = document.getElementById('regPassword').value;
  const pw2 = document.getElementById('regConfirmPassword').value;
  const errEl = document.getElementById('regStep2Error');

  if (pw.length < 6) {
    errEl.textContent = 'Mật khẩu phải có ít nhất 6 ký tự!';
    errEl.style.display = 'block';
    return;
  }
  if (pw !== pw2) {
    errEl.textContent = 'Mật khẩu xác nhận không khớp!';
    errEl.style.display = 'block';
    return;
  }

  errEl.style.display = 'none';
  _regData.password = pw;

  const success = await sendOTP(_regData.email);
  if (success) {
    regShowStep(3);
    initOTPBoxes();
  }
}

async function regSubmitOTP() {
  const boxes = document.querySelectorAll('.otp-box');
  const otp = Array.from(boxes).map(b => b.value).join('');
  const errEl = document.getElementById('regStep3Error');

  if (otp.length !== 6) {
    errEl.textContent = 'Vui lòng nhập đủ 6 chữ số OTP!';
    errEl.style.display = 'block';
    return;
  }

  errEl.style.display = 'none';

  const success = await verifyOTP(_regData.email, otp);

  if (success) {
    showToast('Đăng ký tài khoản thành công!');
    closeModal('registerModal');
    _regData = { ho_ten: '', email: '', so_dien_thoai: '', password: '' };
    setTimeout(() => window.location.reload(), 800);
  }
}

async function regResendOTP(e) {
  e.preventDefault();
  const btn = e.target;
  const success = await sendOTP(_regData.email);
  if (success) {
    startResendCountdown(btn);
    initOTPBoxes();
  }
}

// ==================== KHỞI TẠO ====================
function initEmailOTP() {
  console.log("✅ email.js initialized - OTP module ready");
}

export { sendOTP, verifyOTP, initOTPBoxes, regGoStep2, regGoStep3, regSubmitOTP, regResendOTP, initEmailOTP };
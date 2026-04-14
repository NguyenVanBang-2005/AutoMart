// ── Tab switching ─────────────────────────────────────────────
document.querySelectorAll('.profile-nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.profile-nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

// ── Helpers ───────────────────────────────────────────────────
function showMsg(id, text, type) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = 'form-message ' + type;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}

function setLoading(btn, loading, text) {
  btn.disabled = loading;
  if (text) btn.innerHTML = text;
}

// ── Cập nhật thông tin ────────────────────────────────────────
document.getElementById('infoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btnSaveInfo');
  const hoTen = document.getElementById('hoTen').value.trim();
  const soDienThoai = document.getElementById('soDienThoai').value.trim();

  if (!hoTen) { showMsg('infoMsg', 'Vui lòng nhập họ và tên.', 'error'); return; }

  setLoading(btn, true, '<i data-lucide="loader" style="width:15px;height:15px"></i> Đang lưu...');
  lucide.createIcons();

  try {
    const res = await fetch('/api/v1/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ho_ten: hoTen, so_dien_thoai: soDienThoai }),
    });
    const data = await res.json();
    if (res.ok) {
      showMsg('infoMsg', 'Cập nhật thành công!', 'success');
      document.getElementById('sidebarName').textContent = data.ho_ten;
    } else {
      showMsg('infoMsg', data.detail || 'Lỗi cập nhật.', 'error');
    }
  } catch {
    showMsg('infoMsg', 'Không thể kết nối server.', 'error');
  } finally {
    setLoading(btn, false, '<i data-lucide="save" style="width:15px;height:15px"></i> Lưu thay đổi');
    lucide.createIcons();
  }
});

// ── Đổi mật khẩu ─────────────────────────────────────────────
document.getElementById('passwordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btnSavePw');
  const cu = document.getElementById('pwCu').value;
  const moi = document.getElementById('pwMoi').value;
  const confirm = document.getElementById('pwMoiConfirm').value;

  if (!cu || !moi || !confirm) { showMsg('pwMsg', 'Vui lòng điền đầy đủ.', 'error'); return; }
  if (moi !== confirm) { showMsg('pwMsg', 'Mật khẩu mới không khớp.', 'error'); return; }
  if (moi.length < 6) { showMsg('pwMsg', 'Mật khẩu tối thiểu 6 ký tự.', 'error'); return; }

  setLoading(btn, true, '<i data-lucide="loader" style="width:15px;height:15px"></i> Đang xử lý...');
  lucide.createIcons();

  try {
    const res = await fetch('/api/v1/users/me/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ password_cu: cu, password_moi: moi, password_moi_confirm: confirm }),
    });
    const data = await res.json();
    if (res.ok) {
      showMsg('pwMsg', 'Đổi mật khẩu thành công!', 'success');
      document.getElementById('passwordForm').reset();
    } else {
      showMsg('pwMsg', data.detail || 'Lỗi đổi mật khẩu.', 'error');
    }
  } catch {
    showMsg('pwMsg', 'Không thể kết nối server.', 'error');
  } finally {
    setLoading(btn, false, '<i data-lucide="shield-check" style="width:15px;height:15px"></i> Đổi mật khẩu');
    lucide.createIcons();
  }
});

// ── Toggle hiện/ẩn mật khẩu ──────────────────────────────────
document.querySelectorAll('.toggle-pw').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    btn.innerHTML = `<i data-lucide="${isHidden ? 'eye-off' : 'eye'}" style="width:15px;height:15px"></i>`;
    lucide.createIcons();
  });
});

// ── Upload avatar ─────────────────────────────────────────────
document.getElementById('avatarInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const status = document.getElementById('avatarStatus');
  status.textContent = 'Đang tải lên...';

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch('/api/v1/users/me/avatar', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    const data = await res.json();
    if (res.ok && data.avatar_url) {
      const img = document.getElementById('avatarImg');
      const placeholder = document.getElementById('avatarPlaceholder');
      img.src = data.avatar_url;
      img.style.display = 'block';
      if (placeholder) placeholder.style.display = 'none';
      status.textContent = 'Cập nhật ảnh thành công!';
    } else {
      status.textContent = 'Lỗi tải ảnh lên.';
    }
  } catch {
    status.textContent = 'Không thể kết nối server.';
  } finally {
    setTimeout(() => { status.textContent = ''; }, 3000);
  }
});
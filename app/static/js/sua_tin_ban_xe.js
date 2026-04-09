// ── Sửa tin bán xe ────────────────────────────────────
const TIN_ID = parseInt(document.getElementById('tinData').dataset.id);

async function handleSuaSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const btn  = form.querySelector('button[type="submit"]');
  const data = Object.fromEntries(new FormData(form));

  if (!data.hang_xe)       { showToast('Vui lòng chọn hãng xe!'); return; }
  if (!data.dong_xe)       { showToast('Vui lòng nhập dòng xe!'); return; }
  if (!data.nam_san_xuat)  { showToast('Vui lòng chọn năm sản xuất!'); return; }
  if (!data.khu_vuc)       { showToast('Vui lòng chọn khu vực!'); return; }
  if (!data.ho_ten)        { showToast('Vui lòng nhập họ tên!'); return; }
  if (!data.so_dien_thoai) { showToast('Vui lòng nhập số điện thoại!'); return; }

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

  if (btn) { btn.disabled = true; btn.innerHTML = '<i data-lucide="loader" style="width:16px;height:16px;"></i> Đang lưu...'; }

  try {
    const res    = await fetch(`/api/v1/ban-xe/${TIN_ID}`, {
      method:      'PUT',
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'include',
      body:        JSON.stringify(payload)
    });
    const result = await res.json();
    if (!res.ok) { showToast(result.detail || 'Cập nhật thất bại!'); return; }
    if (res.status === 401) {
      showToast('Vui lòng đăng nhập!');
      setTimeout(() => window.location.href = '/', 800);
      return;
    }
    if (res.status === 403) {
      showToast('Bạn không có quyền sửa tin này!');
      return;
    }
    showToast('✅ Cập nhật thành công!');
    setTimeout(() => window.location.href = `/ban-xe/${TIN_ID}`, 1000);
  } catch {
    showToast('Không thể kết nối server!');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i data-lucide="save" style="width:18px;height:18px;"></i> Lưu thay đổi'; if (window.lucide) lucide.createIcons(); }
  }
}
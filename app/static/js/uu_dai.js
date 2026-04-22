/* ══════════════════════════════════════════════════
   UU_DAI.JS — Trang ưu đãi tháng
   Tất cả function là global — gọi được từ onclick HTML
   ══════════════════════════════════════════════════ */

var isAdmin     = false;
var allCars     = [];
var selectedCar = null;

/* ── Init (gọi cuối trang sau khi DOM sẵn sàng) ─── */
function initUuDai() {
  var pageData = document.getElementById('pageData');
  isAdmin = pageData && pageData.dataset.isAdmin === 'true';

  /* Tháng hiện tại */
  var el = document.getElementById('dealMonth');
  if (el) el.textContent = 'Tháng ' + (new Date().getMonth() + 1);

  /* Bật nút sửa cho admin */
  if (isAdmin) {
    var btns = document.querySelectorAll('.btn-admin-edit');
    for (var i = 0; i < btns.length; i++) btns[i].style.display = 'flex';
    loadAllCars();
  }

  /* Ngày mặc định + dropdown tháng */
  setDefaultDates();

  /* Realtime preview giá */
  var pctInput = document.getElementById('newPct');
  if (pctInput) pctInput.addEventListener('input', updatePricePreview);

  /* Tìm kiếm trong panel */
  var searchEl = document.getElementById('carPickerSearch');
  if (searchEl) searchEl.addEventListener('input', function() { renderCarPicker(this.value); });

  /* Click ngoài panel để đóng */
  var overlay = document.getElementById('carPickerPanel');
  if (overlay) overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closeCarPickerPanel();
  });
}

/* ── Load xe từ API ──────────────────────────────── */
function loadAllCars() {
  fetch('/api/v1/cars', { credentials: 'include' })
    .then(function(r) { return r.json(); })
    .then(function(d) { allCars = d.cars || []; })
    .catch(function()  { allCars = []; });
}

/* ── Ngày mặc định + dropdown tháng ─────────────── */
function setDefaultDates() {
  var today   = new Date();
  var lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  var fmt = function(d) { return d.toISOString().split('T')[0]; };

  var s = document.getElementById('newStart');
  var e = document.getElementById('newEnd');
  if (s) s.value = fmt(today);
  if (e) e.value = fmt(lastDay);

  /* Dropdown: 12 tháng tiếp theo */
  var sel = document.getElementById('newThang');
  if (!sel) return;
  var months = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
                'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
  var cm = today.getMonth();
  var cy = today.getFullYear();
  sel.innerHTML = '';
  for (var i = 0; i < 12; i++) {
    var m = (cm + i) % 12;
    var y = cy + Math.floor((cm + i) / 12);
    var opt = document.createElement('option');
    opt.value = months[m] + ' ' + y;
    opt.textContent = months[m] + ' ' + y;
    if (i === 0) opt.selected = true;
    sel.appendChild(opt);
  }
}

/* ── Panel chọn xe ───────────────────────────────── */
function openCarPickerPanel() {
  var panel = document.getElementById('carPickerPanel');
  if (!panel) return;
  panel.style.display = 'flex';
  renderCarPicker('');
  var s = document.getElementById('carPickerSearch');
  if (s) { s.value = ''; setTimeout(function() { s.focus(); }, 100); }
  if (window.lucide) lucide.createIcons();
}

function closeCarPickerPanel() {
  var panel = document.getElementById('carPickerPanel');
  if (panel) panel.style.display = 'none';
}

function renderCarPicker(keyword) {
  var grid = document.getElementById('carPickerGrid');
  if (!grid) return;

  var q = keyword.toLowerCase();
  var list = allCars.filter(function(xe) {
    return (xe.hang + ' ' + xe.dong + ' ' + xe.nam).toLowerCase().indexOf(q) !== -1;
  });

  if (list.length === 0) {
    grid.innerHTML = '<p style="color:#888;text-align:center;grid-column:1/-1;padding:32px;">Không tìm thấy xe nào</p>';
    return;
  }

  var html = '';
  for (var i = 0; i < list.length; i++) {
    var xe = list[i];
    var sel = selectedCar && selectedCar.id === xe.id;
    html += '<div onclick="selectCarFromPicker(' + xe.id + ')" id="pickerItem-' + xe.id + '" '
          + 'style="position:relative;cursor:pointer;border-radius:12px;padding:12px;background:#fff;'
          + 'border:2px solid ' + (sel ? 'var(--accent-primary)' : '#e2e2da') + ';'
          + 'transition:.15s;onmouseover=this.style.borderColor=\'var(--accent-primary)\'">'

          + '<div style="width:100%;aspect-ratio:16/9;border-radius:8px;overflow:hidden;background:#e8e8e0;margin-bottom:10px;">';

    if (xe.anh) {
      html += '<img src="' + xe.anh + '" style="width:100%;height:100%;object-fit:cover;">';
    } else {
      html += '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;'
            + 'background:linear-gradient(135deg,#6366f1,#4f46e5);">'
            + '<i data-lucide="car" style="width:28px;height:28px;color:#fff;opacity:.7;"></i></div>';
    }

    html += '</div>'
          + '<div style="font-size:13px;font-weight:700;margin-bottom:2px;">' + xe.hang + ' ' + xe.dong + '</div>'
          + '<div style="font-size:11px;color:#888;margin-bottom:4px;">' + xe.nam + ' · '
          + (xe.km ? xe.km.toLocaleString('vi-VN') + ' km' : '—') + '</div>'
          + '<div style="font-size:13px;font-weight:800;color:var(--accent-primary);">'
          + xe.gia.toLocaleString('vi-VN') + ' triệu</div>'
          + (sel ? '<div style="position:absolute;top:8px;right:8px;background:var(--accent-primary);'
          + 'color:#fff;border-radius:6px;padding:2px 8px;font-size:11px;font-weight:700;">✓ Đã chọn</div>' : '')
          + '</div>';
  }
  grid.innerHTML = html;
  if (window.lucide) lucide.createIcons();
}

function selectCarFromPicker(xeId) {
  selectedCar = null;
  for (var i = 0; i < allCars.length; i++) {
    if (allCars[i].id === xeId) { selectedCar = allCars[i]; break; }
  }
  if (!selectedCar) return;

  var info = document.getElementById('selectedCarInfo');
  var name = document.getElementById('selectedCarName');
  var gia  = document.getElementById('selectedCarGia');
  var anh  = document.getElementById('selectedCarAnh');
  var btn  = document.getElementById('btnPickCar');

  if (info) info.style.display = 'flex';
  if (name) name.textContent = selectedCar.hang + ' ' + selectedCar.dong + ' (' + selectedCar.nam + ')';
  if (gia)  gia.textContent  = selectedCar.gia.toLocaleString('vi-VN') + ' triệu';
  if (anh) {
    if (selectedCar.anh) { anh.src = selectedCar.anh; anh.style.display = 'block'; }
    else { anh.style.display = 'none'; }
  }
  if (btn) btn.innerHTML = '<i data-lucide="check" style="width:14px;height:14px;"></i> '
    + selectedCar.hang + ' ' + selectedCar.dong;

  updatePricePreview();
  closeCarPickerPanel();
  if (window.lucide) lucide.createIcons();
}

/* ── Preview giá ─────────────────────────────────── */
function updatePricePreview() {
  var box = document.getElementById('pricePreview');
  if (!box) return;
  if (!selectedCar) { box.style.display = 'none'; return; }

  var pct = parseFloat(document.getElementById('newPct').value);
  if (!pct || pct < 1 || pct > 99) { box.style.display = 'none'; return; }

  var giaKM    = Math.round(selectedCar.gia * (1 - pct / 100));
  var tietKiem = Math.round(selectedCar.gia * pct / 100);

  var elKM = document.getElementById('previewGiaKM');
  var elGoc = document.getElementById('previewGiaGoc');
  var elTK  = document.getElementById('previewTietKiem');

  if (elKM)  elKM.textContent  = giaKM.toLocaleString('vi-VN') + ' triệu';
  if (elGoc) elGoc.textContent = selectedCar.gia.toLocaleString('vi-VN') + ' triệu';
  if (elTK)  elTK.textContent  = 'Tiết kiệm ' + tietKiem.toLocaleString('vi-VN') + ' tr';

  box.style.display = 'flex';
}

/* ── Tạo ưu đãi mới ──────────────────────────────── */
function createUuDai() {
  if (!selectedCar) { alert('Vui lòng chọn xe trước'); return; }

  var pct   = parseFloat(document.getElementById('newPct').value);
  var start = document.getElementById('newStart').value;
  var end   = document.getElementById('newEnd').value;
  var thang = document.getElementById('newThang').value;

  if (!pct || pct < 1 || pct > 99) { alert('% giảm giá phải từ 1 đến 99'); return; }
  if (!start || !end)               { alert('Vui lòng chọn ngày'); return; }
  if (end <= start)                 { alert('Ngày kết thúc phải sau ngày bắt đầu'); return; }

  var url = '/api/v1/uu-dai/' + selectedCar.id
    + '?phan_tram_giam=' + pct
    + '&ngay_bat_dau='   + start
    + '&ngay_ket_thuc='  + end
    + '&mo_ta='          + encodeURIComponent(thang);

  fetch(url, { method: 'POST', credentials: 'include' })
    .then(function(r) {
      if (!r.ok) return r.json().then(function(e) { throw new Error(e.detail); });
      return r.json();
    })
    .then(function() { window.location.reload(); })
    .catch(function(err) { alert('Lỗi: ' + err.message); });
}

/* ── Sửa / xóa ưu đãi inline ────────────────────── */
function toggleEditForm(xeId) {
  var f = document.getElementById('editForm-' + xeId);
  if (f) f.style.display = f.style.display === 'none' ? 'block' : 'none';
}

function saveUuDai(xeId, giaGoc) {
  var pct   = parseFloat(document.getElementById('pct-'   + xeId).value);
  var start = document.getElementById('start-' + xeId).value;
  var end   = document.getElementById('end-'   + xeId).value;
  var desc  = document.getElementById('desc-'  + xeId).value;

  if (!pct || !start || !end) { alert('Vui lòng điền đầy đủ'); return; }
  if (end <= start)           { alert('Ngày kết thúc phải sau ngày bắt đầu'); return; }

  var url = '/api/v1/uu-dai/' + xeId
    + '?phan_tram_giam=' + pct
    + '&ngay_bat_dau='   + start
    + '&ngay_ket_thuc='  + end
    + '&mo_ta='          + encodeURIComponent(desc);

  fetch(url, { method: 'POST', credentials: 'include' })
    .then(function(r) {
      if (!r.ok) return r.json().then(function(e) { throw new Error(e.detail); });
      return r.json();
    })
    .then(function() {
      var giaKM    = Math.round(giaGoc * (1 - pct / 100));
      var tietKiem = Math.round(giaGoc * pct / 100);
      var get = function(id) { return document.getElementById(id); };
      if (get('giaKM-'    + xeId)) get('giaKM-'    + xeId).textContent = giaKM.toLocaleString('vi-VN') + ' triệu';
      if (get('giaGoc-'   + xeId)) get('giaGoc-'   + xeId).textContent = giaGoc.toLocaleString('vi-VN') + ' triệu';
      if (get('tietKiem-' + xeId)) get('tietKiem-' + xeId).textContent = 'Tiết kiệm ' + tietKiem.toLocaleString('vi-VN') + ' tr';
      if (get('badge-'    + xeId)) get('badge-'    + xeId).textContent = '-' + Math.round(pct) + '%';
      toggleEditForm(xeId);
      alert('Đã lưu!');
    })
    .catch(function(err) { alert('Lỗi: ' + err.message); });
}

function deleteUuDai(xeId) {
  if (!confirm('Xác nhận xóa ưu đãi?')) return;
  fetch('/api/v1/uu-dai/' + xeId, { method: 'DELETE', credentials: 'include' })
    .then(function(r) {
      if (!r.ok) return r.json().then(function(e) { throw new Error(e.detail); });
      return r.json();
    })
    .then(function() {
      var c = document.getElementById('card-' + xeId);
      if (c) c.parentNode.removeChild(c);
    })
    .catch(function(err) { alert('Lỗi: ' + err.message); });
}
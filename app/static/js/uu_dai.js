/* ══════════════════════════════════════════════════
   UU_DAI.JS — Trang ưu đãi tháng
   ══════════════════════════════════════════════════ */

var isAdmin     = false;
var allCars     = [];      // danh sách xe từ API
var selectedCar = null;    // xe đang được chọn để tạo ưu đãi

// ── Boot ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function () {
  var pageData = document.getElementById('pageData');
  isAdmin = pageData && pageData.dataset.isAdmin === 'true';

  // Tháng hiện tại
  var dealMonth = document.getElementById('dealMonth');
  if (dealMonth) dealMonth.textContent = 'Tháng ' + (new Date().getMonth() + 1);

  // Bật nút sửa cho admin
  if (isAdmin) {
    var editBtns = document.querySelectorAll('.btn-admin-edit');
    for (var i = 0; i < editBtns.length; i++) {
      editBtns[i].style.display = 'flex';
    }
    loadAllCars();
  }

  setDefaultDates();

  // Tính giá preview realtime khi nhập %
  var pctInput = document.getElementById('newPct');
  if (pctInput) pctInput.addEventListener('input', updatePricePreview);

  // Tìm kiếm trong panel xe
  var searchInput = document.getElementById('carPickerSearch');
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      renderCarPicker(this.value);
    });
  }

  // Đóng panel khi click ra ngoài overlay
  var overlay = document.getElementById('carPickerPanel');
  if (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeCarPickerPanel();
    });
  }

  if (window.lucide) lucide.createIcons();
});

// ── Load xe từ API ────────────────────────────────────────────────────────────

function loadAllCars() {
  fetch('/api/v1/cars', { credentials: 'include' })
    .then(function (r) { return r.json(); })
    .then(function (data) { allCars = data.cars || []; })
    .catch(function () { allCars = []; });
}

// ── Set ngày mặc định ─────────────────────────────────────────────────────────

function setDefaultDates() {
  var today   = new Date();
  var lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  var fmt     = function (d) { return d.toISOString().split('T')[0]; };

  var newStart = document.getElementById('newStart');
  var newEnd   = document.getElementById('newEnd');
  if (newStart) newStart.value = fmt(today);
  if (newEnd)   newEnd.value   = fmt(lastDay);

  // Populate dropdown tháng/năm — 12 tháng tới
  var select = document.getElementById('newThang');
  if (!select) return;
  var months = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
                'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
  var curMonth = today.getMonth();  // 0-based
  var curYear  = today.getFullYear();
  select.innerHTML = '';
  for (var i = 0; i < 12; i++) {
    var m   = (curMonth + i) % 12;
    var y   = curYear + Math.floor((curMonth + i) / 12);
    var opt = document.createElement('option');
    opt.value       = months[m] + ' ' + y;
    opt.textContent = months[m] + ' ' + y;
    if (i === 0) opt.selected = true;
    select.appendChild(opt);
  }
}

// ── Panel chọn xe ─────────────────────────────────────────────────────────────

function openCarPickerPanel() {
  var panel = document.getElementById('carPickerPanel');
  if (!panel) return;
  panel.style.display = 'flex';
  renderCarPicker('');
  var searchInput = document.getElementById('carPickerSearch');
  if (searchInput) { searchInput.value = ''; searchInput.focus(); }
  if (window.lucide) lucide.createIcons();
}

function closeCarPickerPanel() {
  var panel = document.getElementById('carPickerPanel');
  if (panel) panel.style.display = 'none';
}

function renderCarPicker(keyword) {
  var grid = document.getElementById('carPickerGrid');
  if (!grid) return;

  var q        = keyword.toLowerCase();
  var filtered = allCars.filter(function (xe) {
    return (xe.hang + ' ' + xe.dong + ' ' + xe.nam).toLowerCase().indexOf(q) !== -1;
  });

  if (filtered.length === 0) {
    grid.innerHTML = '<p style="color:#888;text-align:center;grid-column:1/-1;padding:32px;">Không tìm thấy xe nào</p>';
    return;
  }

  var html = '';
  for (var i = 0; i < filtered.length; i++) {
    var xe         = filtered[i];
    var isSelected = selectedCar && selectedCar.id === xe.id;

    html += '<div class="car-picker-item' + (isSelected ? ' selected' : '') + '" '
          +      'id="pickerItem-' + xe.id + '" '
          +      'onclick="selectCarFromPicker(' + xe.id + ')" '
          +      'style="position:relative;cursor:pointer;border-radius:12px;'
          +             'border:2px solid ' + (isSelected ? 'var(--accent-primary)' : '#e2e2da') + ';'
          +             'padding:12px;background:#fff;transition:.15s;">'

          // Ảnh
          + '<div style="width:100%;aspect-ratio:16/9;border-radius:8px;overflow:hidden;'
          +      'background:#e8e8e0;margin-bottom:10px;">';

    if (xe.anh) {
      html += '<img src="' + xe.anh + '" alt="' + xe.hang + ' ' + xe.dong + '" '
            +      'style="width:100%;height:100%;object-fit:cover;">';
    } else {
      html += '<div style="width:100%;height:100%;display:flex;align-items:center;'
            +      'justify-content:center;background:linear-gradient(135deg,#6366f1,#4f46e5);">'
            +   '<i data-lucide="car" style="width:28px;height:28px;color:#fff;opacity:.7;"></i>'
            + '</div>';
    }

    html += '</div>'

          // Tên
          + '<div style="font-size:13px;font-weight:700;margin-bottom:2px;">'
          +   xe.hang + ' ' + xe.dong
          + '</div>'
          // Năm & km
          + '<div style="font-size:11px;color:#888;margin-bottom:6px;">'
          +   xe.nam + ' · ' + (xe.km ? xe.km.toLocaleString('vi-VN') + ' km' : '—')
          + '</div>'
          // Giá
          + '<div style="font-size:14px;font-weight:800;color:var(--accent-primary);">'
          +   xe.gia.toLocaleString('vi-VN') + ' triệu'
          + '</div>'

          // Badge đã chọn
          + (isSelected
              ? '<div style="position:absolute;top:8px;right:8px;background:var(--accent-primary);'
              +      'color:#fff;border-radius:6px;padding:2px 8px;font-size:11px;font-weight:700;">'
              +   '✓ Đã chọn</div>'
              : '')

          + '</div>';
  }

  grid.innerHTML = html;
  if (window.lucide) lucide.createIcons();
}

// ── Chọn xe từ panel ─────────────────────────────────────────────────────────

function selectCarFromPicker(xeId) {
  selectedCar = null;
  for (var i = 0; i < allCars.length; i++) {
    if (allCars[i].id === xeId) { selectedCar = allCars[i]; break; }
  }
  if (!selectedCar) return;

  // Cập nhật preview xe đã chọn ở form
  var info = document.getElementById('selectedCarInfo');
  var name = document.getElementById('selectedCarName');
  var gia  = document.getElementById('selectedCarGia');
  var anh  = document.getElementById('selectedCarAnh');

  if (info) info.style.display = 'flex';
  if (name) name.textContent   = selectedCar.hang + ' ' + selectedCar.dong + ' (' + selectedCar.nam + ')';
  if (gia)  gia.textContent    = selectedCar.gia.toLocaleString('vi-VN') + ' triệu';
  if (anh) {
    if (selectedCar.anh) { anh.src = selectedCar.anh; anh.style.display = 'block'; }
    else                 { anh.style.display = 'none'; }
  }

  // Nút chọn xe đổi text
  var pickBtn = document.getElementById('btnPickCar');
  if (pickBtn) pickBtn.textContent = '✓ ' + selectedCar.hang + ' ' + selectedCar.dong;

  updatePricePreview();
  closeCarPickerPanel();
}

// ── Preview giá theo % giảm ───────────────────────────────────────────────────

function updatePricePreview() {
  var preview = document.getElementById('pricePreview');
  if (!preview) return;

  if (!selectedCar) { preview.style.display = 'none'; return; }

  var pct = parseFloat(document.getElementById('newPct').value);
  if (!pct || pct < 1 || pct > 99) { preview.style.display = 'none'; return; }

  var giaKM    = Math.round(selectedCar.gia * (1 - pct / 100));
  var tietKiem = Math.round(selectedCar.gia * pct / 100);

  var elKM  = document.getElementById('previewGiaKM');
  var elGoc = document.getElementById('previewGiaGoc');
  var elTK  = document.getElementById('previewTietKiem');

  if (elKM)  elKM.textContent  = giaKM.toLocaleString('vi-VN') + ' triệu';
  if (elGoc) elGoc.textContent = selectedCar.gia.toLocaleString('vi-VN') + ' triệu';
  if (elTK)  elTK.textContent  = 'Tiết kiệm ' + tietKiem.toLocaleString('vi-VN') + ' tr';

  preview.style.display = 'flex';
}

// ── Tạo ưu đãi mới ───────────────────────────────────────────────────────────

function createUuDai() {
  if (!selectedCar) { alert('Vui lòng chọn xe trước'); return; }

  var pct   = parseFloat(document.getElementById('newPct').value);
  var start = document.getElementById('newStart').value;
  var end   = document.getElementById('newEnd').value;
  var thang = document.getElementById('newThang').value;

  if (!pct || pct < 1 || pct > 99) { alert('% giảm giá phải từ 1 đến 99'); return; }
  if (!start || !end)               { alert('Vui lòng chọn ngày bắt đầu và kết thúc'); return; }
  if (end <= start)                 { alert('Ngày kết thúc phải sau ngày bắt đầu'); return; }

  var url = '/api/v1/uu-dai/' + selectedCar.id
    + '?phan_tram_giam=' + pct
    + '&ngay_bat_dau='   + start
    + '&ngay_ket_thuc='  + end
    + '&mo_ta='          + encodeURIComponent(thang);

  fetch(url, { method: 'POST', credentials: 'include' })
    .then(function (r) {
      if (!r.ok) { return r.json().then(function (e) { throw new Error(e.detail); }); }
      return r.json();
    })
    .then(function () { window.location.reload(); })
    .catch(function (err) { alert('Lỗi: ' + err.message); });
}

// ── Sửa ưu đãi inline ────────────────────────────────────────────────────────

function toggleEditForm(xeId) {
  var form = document.getElementById('editForm-' + xeId);
  if (!form) return;
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function saveUuDai(xeId, giaGoc) {
  var pct   = parseFloat(document.getElementById('pct-'   + xeId).value);
  var start = document.getElementById('start-' + xeId).value;
  var end   = document.getElementById('end-'   + xeId).value;
  var desc  = document.getElementById('desc-'  + xeId).value;

  if (!pct || !start || !end) { alert('Vui lòng điền đầy đủ thông tin'); return; }
  if (end <= start)           { alert('Ngày kết thúc phải sau ngày bắt đầu'); return; }

  var url = '/api/v1/uu-dai/' + xeId
    + '?phan_tram_giam=' + pct
    + '&ngay_bat_dau='   + start
    + '&ngay_ket_thuc='  + end
    + '&mo_ta='          + encodeURIComponent(desc);

  fetch(url, { method: 'POST', credentials: 'include' })
    .then(function (r) {
      if (!r.ok) { return r.json().then(function (e) { throw new Error(e.detail); }); }
      return r.json();
    })
    .then(function () {
      var giaKM    = Math.round(giaGoc * (1 - pct / 100));
      var tietKiem = Math.round(giaGoc * pct / 100);

      var elGiaKM    = document.getElementById('giaKM-'    + xeId);
      var elGiaGoc   = document.getElementById('giaGoc-'   + xeId);
      var elTietKiem = document.getElementById('tietKiem-' + xeId);
      var elBadge    = document.getElementById('badge-'    + xeId);

      if (elGiaKM)    elGiaKM.textContent    = giaKM.toLocaleString('vi-VN')  + ' triệu';
      if (elGiaGoc)   elGiaGoc.textContent   = giaGoc.toLocaleString('vi-VN') + ' triệu';
      if (elTietKiem) elTietKiem.textContent = 'Tiết kiệm ' + tietKiem.toLocaleString('vi-VN') + ' tr';
      if (elBadge)    elBadge.textContent    = '-' + Math.round(pct) + '%';

      toggleEditForm(xeId);
      alert('Đã lưu ưu đãi!');
    })
    .catch(function (err) { alert('Lỗi: ' + err.message); });
}

function deleteUuDai(xeId) {
  if (!confirm('Xác nhận xóa ưu đãi này?')) return;

  fetch('/api/v1/uu-dai/' + xeId, { method: 'DELETE', credentials: 'include' })
    .then(function (r) {
      if (!r.ok) { return r.json().then(function (e) { throw new Error(e.detail); }); }
      return r.json();
    })
    .then(function () {
      var card = document.getElementById('card-' + xeId);
      if (card) card.parentNode.removeChild(card);
    })
    .catch(function (err) { alert('Lỗi: ' + err.message); });
}
console.log("✅ mua_xe.js loaded successfully");

// ==================== LOAD & RENDER ====================
async function loadCars() {
  try {
    const res = await fetch('/api/v1/cars');
    if (res.ok) {
      const data = await res.json();
      allCars = Array.isArray(data) ? data : (data.cars || []);
      renderCars(allCars);
    }
  } catch (e) {
    console.error("Lỗi load xe:", e);
  }
}

function renderCars(cars) {
  var grid = document.getElementById('carGrid');
  if (!grid) return;
  grid.innerHTML = '';

  if (!cars || cars.length === 0) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:60px 20px;color:#888;">Không tìm thấy xe phù hợp.</p>';
    return;
  }

  cars.forEach(function(car) {
    var card = document.createElement('div');
    card.className = 'car-card';
    card.dataset.carId = car.id;          // để xóa DOM sau khi delete
    card.style.position = 'relative';    // để nút xóa hiện đúng góc

    // Nút xóa xe - chỉ admin
    var deleteBtn = isAdmin
      ? '<button onclick="openModalXoaXe(' + car.id + ', \'' + (car.hang + ' ' + car.dong).replace(/'/g, '') + '\')" '
        + 'title="Xóa xe" '
        + 'style="position:absolute;top:10px;right:10px;z-index:10;'
        + 'background:rgba(224,48,48,0.88);border:none;border-radius:8px;'
        + 'width:32px;height:32px;display:flex;align-items:center;'
        + 'justify-content:center;cursor:pointer;backdrop-filter:blur(4px);">'
        + '<i data-lucide="trash-2" style="width:15px;height:15px;color:#fff;pointer-events:none;"></i>'
        + '</button>'
      : '';

    // Nút ưu đãi - chỉ admin
    var adminBtn = isAdmin
      ? '<button onclick="openUuDaiModal(' + car.id + ', \'' + (car.hang + ' ' + car.dong).replace(/'/g, '') + '\', ' + car.gia + ', \'' + (car.anh || '') + '\')" '
        + 'style="width:100%;margin-top:8px;padding:8px;background:#fffbf0;color:#92400e;'
        + 'border:1.5px dashed #f0d080;border-radius:8px;font-size:12px;font-weight:600;'
        + 'cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">'
        + '<i data-lucide="tag" style="width:13px;height:13px;"></i> Thêm ưu đãi'
        + '</button>'
      : '';

    card.innerHTML = ''
      + deleteBtn
      + '<div class="car-image">'
      +   '<img src="' + (car.anh || '/static/images/placeholder-car.jpg') + '" '
      +        'alt="' + car.hang + ' ' + car.dong + '" '
      +        'onerror="this.src=\'/static/images/placeholder-car.jpg\'">'
      + '</div>'
      + '<div class="car-body">'
      +   '<h3 class="car-title">' + car.hang + ' ' + car.dong + '</h3>'
      +   '<p class="car-price">' + Number(car.gia).toLocaleString('vi-VN') + ' triệu</p>'
      +   '<div class="car-specs">'
      +     '<span>' + car.nam + '</span>'
      +     '<span>' + Number(car.km || 0).toLocaleString('vi-VN') + ' km</span>'
      +     '<span>' + car.loai + '</span>'
      +   '</div>'
      +   '<button class="btn btn-primary" onclick="viewCar(' + car.id + ')">Xem chi tiết</button>'
      +   adminBtn
      + '</div>';

    grid.appendChild(card);
  });

  if (window.lucide) lucide.createIcons();
}

function handleSearch(e) {
  e.preventDefault();
  const brand = document.getElementById('brandSelect').value;
  const priceRange = document.getElementById('priceSelect').value;
  const year = document.getElementById('yearSelect').value;
  const type = document.getElementById('typeSelect').value;

  let filtered = allCars;

  if (brand) filtered = filtered.filter(car => car.hang === brand);
  if (year) {
    if (year === 'before2018') filtered = filtered.filter(car => parseInt(car.nam) < 2018);
    else filtered = filtered.filter(car => parseInt(car.nam) == year);
  }
  if (type) filtered = filtered.filter(car => car.loai === type);
  if (priceRange) {
    const [min, max] = priceRange.split('-').map(Number);
    filtered = filtered.filter(car => {
      const price = parseInt(car.gia);
      if (max) return price >= min && price <= max;
      return price >= min;
    });
  }

  renderCars(filtered);
}

function viewCar(id) {
  window.location.href = `/xe/${id}`;
}

function loadMoreCars() {
  alert("Chức năng xem thêm xe sẽ được phát triển sau.");
}

// ==================== MODAL THÊM XE ====================
function showAddCarModal() {
  console.log("🔥 Mở modal thêm xe");
  document.getElementById('addCarModal').style.display = 'flex';
  document.getElementById('imagePreview').innerHTML = '';
}

function closeAddCarModal() {
  document.getElementById('addCarModal').style.display = 'none';
}

// Preview ảnh
function setupImagePreview() {
  const input = document.getElementById('carImages');
  const preview = document.getElementById('imagePreview');

  if (!input) return;

  input.addEventListener('change', function() {
    preview.innerHTML = '';
    const files = this.files;

    if (files.length > 3) {
      alert("Chỉ được chọn tối đa 3 ảnh!");
      this.value = '';
      return;
    }

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = function(e) {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.style.cssText = 'width:80px;height:80px;object-fit:cover;border-radius:6px;border:1px solid #ddd;';
        preview.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  });
}

// Xử lý submit form + upload ảnh
async function handleAddCar(e) {
  e.preventDefault();

  const formData = new FormData();

  formData.append('hang', document.getElementById('carHang').value.trim());
  formData.append('dong', document.getElementById('carDong').value.trim());
  formData.append('nam', document.getElementById('carNam').value);
  formData.append('gia', document.getElementById('carGia').value);
  formData.append('km', document.getElementById('carKm').value || 0);
  formData.append('loai', document.getElementById('carLoai').value);

  const imageInput = document.getElementById('carImages');
  if (imageInput && imageInput.files.length > 0) {
    for (let file of imageInput.files) {
      formData.append('images', file);
    }
  }

  try {
    const res = await fetch('api/v1/cars', {
      method: 'POST',
      body: formData
    });

    const result = await res.json();

    if (res.ok) {
      alert('✅ Thêm xe thành công! ID: ' + result.car_id);
      closeAddCarModal();
      document.getElementById('addCarForm').reset();
      document.getElementById('imagePreview').innerHTML = '';
      loadCars();
    } else {
      alert(result.detail || 'Thêm xe thất bại');
    }
  } catch (err) {
    console.error(err);
    alert('❌ Lỗi kết nối server');
  }
}

// ==================== XÓA XE ====================
var _xoaXeId  = null;
var _xoaXeTen = null;

function openModalXoaXe(carId, carTen) {
  _xoaXeId  = carId;
  _xoaXeTen = carTen;
  document.getElementById('xoaXeInfo').textContent = carTen;
  document.getElementById('modalXoaXe').style.display = 'flex';
  if (window.lucide) lucide.createIcons();
}

function closeModalXoaXe() {
  document.getElementById('modalXoaXe').style.display = 'none';
  _xoaXeId  = null;
  _xoaXeTen = null;
}

async function confirmXoaXe() {
  if (!_xoaXeId) return;

  var btn = document.getElementById('btnConfirmXoa');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = 'Đang xóa...';
  }

  try {
    var res = await fetch('/api/v1/cars/' + _xoaXeId, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (res.ok) {
      // Xóa card khỏi DOM với animation
      var card = document.querySelector('[data-car-id="' + _xoaXeId + '"]');
      if (card) {
        card.style.transition = 'opacity 0.3s, transform 0.3s';
        card.style.opacity    = '0';
        card.style.transform  = 'scale(0.95)';
        setTimeout(function() { card.remove(); }, 300);
      }
      // Xóa khỏi allCars để filter sau vẫn đúng
      allCars = allCars.filter(function(c) { return c.id !== _xoaXeId; });
      closeModalXoaXe();
      alert('✅ Đã xóa xe thành công');
    } else {
      var data = await res.json().catch(function() { return {}; });
      alert('❌ ' + (data.detail || 'Xóa xe thất bại'));
    }
  } catch (err) {
    console.error('Delete car error:', err);
    alert('❌ Lỗi kết nối, vui lòng thử lại');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="trash-2" style="width:15px;height:15px;"></i> Xóa xe';
      if (window.lucide) lucide.createIcons();
    }
  }
}

// ==================== ƯU ĐÃI ====================
function openUuDaiModal(xeId, tenXe, giaGoc, anhXe) {
  activeXeId   = xeId;
  activeGiaGoc = giaGoc;

  document.getElementById('modalXeTen').textContent    = tenXe;
  document.getElementById('modalXeGiaGoc').textContent = 'Giá gốc: ' + Number(giaGoc).toLocaleString('vi-VN') + ' triệu';

  var anh = document.getElementById('modalXeAnh');
  if (anhXe) { anh.src = anhXe; anh.style.display = 'block'; }
  else        { anh.style.display = 'none'; }

  document.getElementById('modalPct').value = '';
  document.getElementById('modalPricePreview').style.display = 'none';

  var today   = new Date();
  var lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  var fmt = function(d) { return d.toISOString().split('T')[0]; };
  document.getElementById('modalStart').value = fmt(today);
  document.getElementById('modalEnd').value   = fmt(lastDay);

  var months = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
                'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
  var sel = document.getElementById('modalThang');
  var cm = today.getMonth(), cy = today.getFullYear();
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

  document.getElementById('modalUuDai').style.display = 'flex';
  if (window.lucide) lucide.createIcons();
}

function previewModalGia() {
  var pct = parseFloat(document.getElementById('modalPct').value);
  var box = document.getElementById('modalPricePreview');
  if (!pct || pct < 1 || pct > 99 || !activeGiaGoc) { box.style.display = 'none'; return; }

  var giaKM    = Math.round(activeGiaGoc * (1 - pct / 100));
  var tietKiem = Math.round(activeGiaGoc * pct / 100);

  document.getElementById('modalGiaKM').textContent      = giaKM.toLocaleString('vi-VN') + ' triệu';
  document.getElementById('modalGiaGocLabel').textContent = activeGiaGoc.toLocaleString('vi-VN') + ' triệu';
  document.getElementById('modalTietKiem').textContent   = 'Tiết kiệm ' + tietKiem.toLocaleString('vi-VN') + ' tr';
  box.style.display = 'flex';
}

function submitUuDai() {
  var pct   = parseFloat(document.getElementById('modalPct').value);
  var start = document.getElementById('modalStart').value;
  var end   = document.getElementById('modalEnd').value;
  var thang = document.getElementById('modalThang').value;

  if (!activeXeId)                  { alert('Lỗi: chưa chọn xe'); return; }
  if (!pct || pct < 1 || pct > 99) { alert('% giảm giá phải từ 1 đến 99'); return; }
  if (!start || !end)               { alert('Vui lòng chọn ngày'); return; }
  if (end <= start)                 { alert('Ngày kết thúc phải sau ngày bắt đầu'); return; }

  var url = '/api/v1/uu-dai/' + activeXeId
    + '?phan_tram_giam=' + pct
    + '&ngay_bat_dau='   + start
    + '&ngay_ket_thuc='  + end
    + '&mo_ta='          + encodeURIComponent(thang);

  fetch(url, { method: 'POST', credentials: 'include' })
    .then(function(r) {
      if (!r.ok) return r.json().then(function(e) { throw new Error(e.detail); });
      return r.json();
    })
    .then(function() {
      document.getElementById('modalUuDai').style.display = 'none';
      alert('Đã tạo ưu đãi thành công!');
    })
    .catch(function(err) { alert('Lỗi: ' + err.message); });
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', function() {
  var pageData = document.getElementById('pageData');
  isAdmin = pageData && pageData.dataset.isAdmin === 'true';

  var addBtn = document.getElementById('btnAddCar');
  if (addBtn) addBtn.addEventListener('click', showAddCarModal);

  setupImagePreview();
  loadCars();
});
/* ══════════════════════════════════════════════════
   UU_DAI.JS — Trang ưu đãi tháng
   ══════════════════════════════════════════════════ */

var isAdmin = false;

document.addEventListener('DOMContentLoaded', function () {
  // Đọc trạng thái admin từ data bridge
  var pageData = document.getElementById('pageData');
  isAdmin = pageData && pageData.dataset.isAdmin === 'true';

  // Hiển thị tháng hiện tại
  var dealMonth = document.getElementById('dealMonth');
  if (dealMonth) {
    dealMonth.textContent = 'Tháng ' + (new Date().getMonth() + 1);
  }

  // Bật nút "Sửa ưu đãi" cho admin
  if (isAdmin) {
    var editBtns = document.querySelectorAll('.btn-admin-edit');
    for (var i = 0; i < editBtns.length; i++) {
      editBtns[i].style.display = 'flex';
    }
  }

  // Set ngày mặc định cho form tạo ưu đãi mới
  var today = new Date().toISOString().split('T')[0];
  var newStart = document.getElementById('newStart');
  var newEnd   = document.getElementById('newEnd');
  if (newStart) newStart.value = today;
  if (newEnd) {
    // Mặc định kết thúc cuối tháng hiện tại
    var lastDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    newEnd.value = lastDay.toISOString().split('T')[0];
  }

  if (window.lucide) lucide.createIcons();
});


// ── Tạo ưu đãi mới ───────────────────────────────────────────────────────────

function createUuDai() {
  var xeId  = document.getElementById('newXeId').value;
  var pct   = document.getElementById('newPct').value;
  var start = document.getElementById('newStart').value;
  var end   = document.getElementById('newEnd').value;
  var desc  = document.getElementById('newDesc').value;

  if (!xeId) { alert('Vui lòng chọn xe'); return; }
  if (!pct || pct < 1 || pct > 99) { alert('% giảm giá phải từ 1 đến 99'); return; }
  if (!start || !end) { alert('Vui lòng chọn ngày bắt đầu và kết thúc'); return; }
  if (end <= start) { alert('Ngày kết thúc phải sau ngày bắt đầu'); return; }

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
      window.location.reload();
    })
    .catch(function (err) { alert('Lỗi: ' + err.message); });
}


// ── Toggle form sửa inline ────────────────────────────────────────────────────

function toggleEditForm(xeId) {
  var form = document.getElementById('editForm-' + xeId);
  if (!form) return;
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
}


// ── Lưu ưu đãi đã chỉnh ──────────────────────────────────────────────────────

function saveUuDai(xeId, giaGoc) {
  var pct   = parseFloat(document.getElementById('pct-'   + xeId).value);
  var start = document.getElementById('start-' + xeId).value;
  var end   = document.getElementById('end-'   + xeId).value;
  var desc  = document.getElementById('desc-'  + xeId).value;

  if (!pct || !start || !end) {
    alert('Vui lòng điền đầy đủ % giảm, ngày bắt đầu và kết thúc');
    return;
  }
  if (end <= start) {
    alert('Ngày kết thúc phải sau ngày bắt đầu');
    return;
  }

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
      // Cập nhật giá trực tiếp trên card — không reload
      var giaKM    = Math.round(giaGoc * (1 - pct / 100));
      var tietKiem = Math.round(giaGoc * pct / 100);

      var elGiaKM    = document.getElementById('giaKM-'    + xeId);
      var elGiaGoc   = document.getElementById('giaGoc-'   + xeId);
      var elTietKiem = document.getElementById('tietKiem-' + xeId);
      var elBadge    = document.getElementById('badge-'    + xeId);

      if (elGiaKM)    elGiaKM.textContent    = giaKM.toLocaleString('vi-VN')    + ' triệu';
      if (elGiaGoc)   elGiaGoc.textContent   = giaGoc.toLocaleString('vi-VN')   + ' triệu';
      if (elTietKiem) elTietKiem.textContent = 'Tiết kiệm ' + tietKiem.toLocaleString('vi-VN') + ' tr';
      if (elBadge)    elBadge.textContent    = '-' + Math.round(pct) + '%';

      toggleEditForm(xeId);
      alert('Đã lưu ưu đãi!');
    })
    .catch(function (err) { alert('Lỗi: ' + err.message); });
}


// ── Xóa ưu đãi ───────────────────────────────────────────────────────────────

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
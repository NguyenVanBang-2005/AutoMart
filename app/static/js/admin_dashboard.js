(function() {
  'use strict';

  var API_BASE = window.location.origin + '/api/v1';
  var _activeId = null;
  var _activeLhId = null;

  // ── Lucide init ──
  lucide.createIcons();

  // ── Modal helpers ──
  function openModal(id) {
    var el = document.getElementById(id);
    if (el) { el.classList.add('lt-open'); lucide.createIcons(); }
  }
  function closeModal(id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove('lt-open');
  }
  function closeOnOverlay(e, id) {
    if (e.target === document.getElementById(id)) closeModal(id);
  }

  // ── Filter lái thử ──
  function filterLaiThu(tt) {
    document.querySelectorAll('[id^="f-"]').forEach(function(b) {
      b.classList.remove('lt-factive');
    });
    var active = document.getElementById('f-' + tt);
    if (active) active.classList.add('lt-factive');
    document.querySelectorAll('.lt-row').forEach(function(r) {
      r.style.display = (tt === 'all' || r.dataset.trangThai === tt) ? '' : 'none';
    });
  }

  // ── Filter liên hệ ──
  function filterLienHe(state) {
    document.querySelectorAll('[id^="lh-"]').forEach(function(b) {
      b.classList.remove('lt-factive');
    });
    var active = document.getElementById('lh-' + state);
    if (active) active.classList.add('lt-factive');
    document.querySelectorAll('.lh-row').forEach(function(r) {
      r.style.display = (state === 'all' || r.dataset.daDoc === state) ? '' : 'none';
    });
  }

  // ── Chi tiết lái thử ──
  function openDetail(id, hoTen, sdt, hangXe, showroom, ngay, gio, cccdUrl, gplxUrl, trangThai, lyDo) {
    _activeId = id;
    document.getElementById('detailId').textContent = '#' + id;
    document.getElementById('detailHoTen').textContent = hoTen;
    document.getElementById('detailSdt').textContent = sdt;
    document.getElementById('detailHangXe').textContent = hangXe;
    document.getElementById('detailShowroom').textContent = showroom;
    document.getElementById('detailNgay').textContent = ngay;
    document.getElementById('detailGio').textContent = gio;

    var badges = {
      cho_duyet: '<span class="lt-badge lt-badge-wait"><i data-lucide="clock" style="width:12px;height:12px;"></i> Chờ duyệt</span>',
      da_duyet: '<span class="lt-badge lt-badge-ok"><i data-lucide="check-circle" style="width:12px;height:12px;"></i> Đã duyệt</span>',
      tu_choi: '<span class="lt-badge lt-badge-no"><i data-lucide="x-circle" style="width:12px;height:12px;"></i> Từ chối</span>'
    };
    document.getElementById('detailBadge').innerHTML = badges[trangThai] || '';

    var lyDoWrap = document.getElementById('detailLyDo');
    if (trangThai === 'tu_choi' && lyDo) {
      document.getElementById('detailLyDoText').textContent = lyDo;
      lyDoWrap.style.display = 'flex';
    } else {
      lyDoWrap.style.display = 'none';
    }

    setImg('detailCccdImg', 'detailCccdLink', 'detailCccdEmpty', cccdUrl);
    setImg('detailGplxImg', 'detailGplxLink', 'detailGplxEmpty', gplxUrl);

    var footer = document.getElementById('detailFooter');
    var html = '<div style="flex:1"></div>';
    if (trangThai !== 'da_duyet') {
      html += '<button class="lt-btn-green" onclick="window._adm.closeModal(\'modalDetail\');window._adm.confirmApprove(' + id + ',' + JSON.stringify(hoTen) + ')"><i data-lucide="check" style="width:14px;height:14px;"></i> Duyệt</button>';
    }
    if (trangThai !== 'tu_choi') {
      html += '<button class="lt-btn-red" onclick="window._adm.closeModal(\'modalDetail\');window._adm.openRejectModal(' + id + ',' + JSON.stringify(hoTen) + ')"><i data-lucide="x-circle" style="width:14px;height:14px;"></i> Từ chối</button>';
    }
    footer.innerHTML = html;
    openModal('modalDetail');
  }

  function setImg(imgId, linkId, emptyId, url) {
    var img = document.getElementById(imgId);
    var link = document.getElementById(linkId);
    var empty = document.getElementById(emptyId);
    if (url) {
      img.src = url; link.href = url;
      img.style.display = 'block'; empty.style.display = 'none';
    } else {
      img.style.display = 'none'; empty.style.display = 'flex';
    }
  }

  // ── Duyệt ──
  function confirmApprove(id, hoTen) {
    _activeId = id;
    document.getElementById('approveMsg').innerHTML =
      'Xác nhận <strong>duyệt</strong> lịch của <strong>' + hoTen + '</strong>?<br><span style="font-size:13px;color:#94a3b8;">Có thể hoàn tác bằng cách từ chối sau.</span>';
    openModal('modalApprove');
  }

  function submitApprove() {
    var btn = document.getElementById('btnApprove');
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader" style="width:14px;height:14px;"></i> Đang xử lý...';
    lucide.createIcons();
    var fd = new FormData();
    fd.append('trang_thai', 'da_duyet');
    fetch(API_BASE + '/admin/lai-thu/' + _activeId, { method: 'PATCH', credentials: 'include', body: fd })
      .then(function(res) {
        if (!res.ok) { alert('Lỗi cập nhật'); return; }
        closeModal('modalApprove');
        location.reload();
      })
      .catch(function() { alert('Lỗi kết nối'); })
      .finally(function() {
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="check" style="width:14px;height:14px;"></i> Xác nhận duyệt';
        lucide.createIcons();
      });
  }

  // ── Từ chối ──
  function openRejectModal(id, hoTen) {
    _activeId = id;
    document.getElementById('rejectSubtitle').textContent = 'Khách hàng: ' + hoTen;
    document.getElementById('rejectReason').value = '';
    document.getElementById('rejectError').style.display = 'none';
    openModal('modalReject');
    setTimeout(function() { document.getElementById('rejectReason').focus(); }, 120);
  }

  function setRejectReason(text) {
    document.getElementById('rejectReason').value = text;
    document.getElementById('rejectReason').focus();
  }

  function submitReject() {
    var reason = document.getElementById('rejectReason').value.trim();
    var errEl = document.getElementById('rejectError');
    if (!reason) {
      errEl.textContent = 'Vui lòng nhập lý do từ chối.';
      errEl.style.display = 'block';
      return;
    }
    errEl.style.display = 'none';
    var btn = document.getElementById('btnReject');
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader" style="width:14px;height:14px;"></i> Đang xử lý...';
    lucide.createIcons();
    var fd = new FormData();
    fd.append('trang_thai', 'tu_choi');
    fd.append('ly_do_tu_choi', reason);
    fetch(API_BASE + '/admin/lai-thu/' + _activeId, { method: 'PATCH', credentials: 'include', body: fd })
      .then(function(res) { return res.json().then(function(data) { return { ok: res.ok, data: data }; }); })
      .then(function(result) {
        if (!result.ok) {
          errEl.textContent = result.data.detail || 'Lỗi';
          errEl.style.display = 'block';
          return;
        }
        closeModal('modalReject');
        location.reload();
      })
      .catch(function() {
        errEl.textContent = 'Lỗi kết nối';
        errEl.style.display = 'block';
      })
      .finally(function() {
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="x-circle" style="width:14px;height:14px;"></i> Xác nhận từ chối';
        lucide.createIcons();
      });
  }

  // ── Liên hệ: mở modal ──
  function openLienHeDetail(id, hoTen, sdt, email, noiDung, daDoc, time) {
    _activeLhId = id;
    document.getElementById('lhModalId').textContent = '#' + id;
    document.getElementById('lhModalHoTen').textContent = hoTen;
    document.getElementById('lhModalSdt').textContent = sdt;
    document.getElementById('lhModalEmail').textContent = email || '(Không có)';
    document.getElementById('lhModalNoidung').textContent = noiDung;
    document.getElementById('lhModalTime').textContent = time;
    document.getElementById('lhModalBadge').innerHTML = daDoc
      ? '<span class="lh-badge-read"><i data-lucide="check-circle" style="width:12px;height:12px;"></i> Đã đọc</span>'
      : '<span class="lh-badge-unread"><i data-lucide="mail" style="width:12px;height:12px;"></i> Chưa đọc</span>';
    document.getElementById('lhModalMarkBtn').style.display = daDoc ? 'none' : 'flex';
    openModal('modalLienHe');
    if (!daDoc) autoMarkDaDoc(id);
  }

  // ── Auto-mark đã đọc (không reload) ──
  function autoMarkDaDoc(id) {
    fetch(API_BASE + '/admin/lien-he/' + id + '/da-doc', { method: 'PATCH', credentials: 'include' })
      .then(function(res) {
        if (!res.ok) return;
        var row = document.querySelector('.lh-row[data-lh-id="' + id + '"]');
        if (row) {
          row.dataset.daDoc = 'da_doc';
          row.style.background = 'transparent';
          var badge = row.querySelector('.lh-status-badge');
          if (badge) badge.innerHTML = '<span class="lh-badge-read"><i data-lucide="check-circle" style="width:12px;height:12px;"></i> Đã đọc</span>';
          var markBtn = row.querySelector('.lh-mark-btn');
          if (markBtn) markBtn.remove();
        }
        var newBadge = document.getElementById('lhNewBadge');
        if (newBadge) {
          var n = parseInt(newBadge.textContent) - 1;
          if (n <= 0) newBadge.remove();
          else newBadge.textContent = n + ' mới';
        }
        var statVal = document.getElementById('statLienHeChuaDoc');
        if (statVal) {
          var c = parseInt(statVal.textContent) - 1;
          statVal.textContent = Math.max(0, c);
        }
        document.getElementById('lhModalMarkBtn').style.display = 'none';
        document.getElementById('lhModalBadge').innerHTML = '<span class="lh-badge-read"><i data-lucide="check-circle" style="width:12px;height:12px;"></i> Đã đọc</span>';
        lucide.createIcons();
      })
      .catch(function() { /* silent */ });
  }

  function markDaDoc(id, btn) {
    btn.disabled = true;
    fetch(API_BASE + '/admin/lien-he/' + id + '/da-doc', { method: 'PATCH', credentials: 'include' })
      .then(function(res) {
        if (!res.ok) { alert('Lỗi'); return; }
        location.reload();
      })
      .catch(function() { alert('Lỗi kết nối'); btn.disabled = false; });
  }

  function markDaDocFromModal() {
    var btn = document.getElementById('lhModalMarkBtn');
    btn.disabled = true;
    fetch(API_BASE + '/admin/lien-he/' + _activeLhId + '/da-doc', { method: 'PATCH', credentials: 'include' })
      .then(function(res) {
        if (!res.ok) { alert('Lỗi'); return; }
        closeModal('modalLienHe');
        location.reload();
      })
      .catch(function() { alert('Lỗi kết nối'); btn.disabled = false; });
  }

  // ── Expose to global (inline onclick handlers need these) ──
  window._adm = {
    closeModal: closeModal,
    confirmApprove: confirmApprove,
    openRejectModal: openRejectModal
  };
  window.openModal = openModal;
  window.closeModal = closeModal;
  window.closeOnOverlay = closeOnOverlay;
  window.filterLaiThu = filterLaiThu;
  window.filterLienHe = filterLienHe;
  window.openDetail = openDetail;
  window.confirmApprove = confirmApprove;
  window.submitApprove = submitApprove;
  window.openRejectModal = openRejectModal;
  window.setRejectReason = setRejectReason;
  window.submitReject = submitReject;
  window.openLienHeDetail = openLienHeDetail;
  window.markDaDoc = markDaDoc;
  window.markDaDocFromModal = markDaDocFromModal;

})();
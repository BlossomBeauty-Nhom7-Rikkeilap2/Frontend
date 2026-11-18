// ==========================================================================
// BLOSSOM BEAUTY STORE - ADMIN APPROVALS LOGIC (FR-09/10)
// ==========================================================================

let currentTab = 'queue'; // 'queue' | 'history'
let currentReviewPostId = null;
let pendingActionType = null; // 'revision' | 'reject'

document.addEventListener('DOMContentLoaded', () => {
  loadData();
  bindEvents();
});

function bindEvents() {
  document.getElementById('searchInput').addEventListener('input', renderTable);

  document.getElementById('confirmReasonBtn').addEventListener('click', handleConfirmReason);

  // User Dropdown
  const userBtn = document.getElementById('userBtn');
  if (userBtn) {
    userBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = document.getElementById('menu');
      if (menu) menu.classList.toggle('open');
    });
  }

  window.addEventListener('blossom_posts_updated', loadData);
}

window.switchTab = function(tab) {
  currentTab = tab;
  document.getElementById('tabQueueBtn').classList.toggle('active', tab === 'queue');
  document.getElementById('tabHistoryBtn').classList.toggle('active', tab === 'history');
  renderTable();
};

function loadData() {
  updateMetrics();
  renderTable();
}

function updateMetrics() {
  const posts = PostsStore.getPosts();
  const pending = posts.filter(p => p.status === 'review').length;
  const approved = posts.filter(p => p.status === 'ready' || p.status === 'done').length;
  const revision = posts.filter(p => p.status === 'edit').length;
  const rejected = posts.filter(p => p.status === 'rejected').length;

  document.getElementById('statPendingCount').textContent = pending;
  document.getElementById('statApprovedCount').textContent = approved;
  document.getElementById('statRevisionCount').textContent = revision;
  document.getElementById('statRejectedCount').textContent = rejected;

  document.getElementById('queueBadge').textContent = pending;
  document.getElementById('historyBadge').textContent = posts.length - pending;
}

function getFilteredPosts() {
  let posts = PostsStore.getPosts();
  const search = document.getElementById('searchInput').value.toLowerCase().trim();

  if (currentTab === 'queue') {
    posts = posts.filter(p => p.status === 'review');
  } else {
    posts = posts.filter(p => p.status !== 'review');
  }

  if (search) {
    posts = posts.filter(p =>
      (p.title && p.title.toLowerCase().includes(search)) ||
      (p.author && p.author.toLowerCase().includes(search)) ||
      (p.caption && p.caption.toLowerCase().includes(search))
    );
  }

  return posts;
}

function renderTable() {
  const tbody = document.getElementById('approvalsTbody');
  const posts = getFilteredPosts();

  if (!posts.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 48px; color: var(--muted);">
          ${currentTab === 'queue' ? '🎉 Hiện không có bài viết nào đang chờ duyệt! Tất cả nội dung đã được xử lý.' : 'Chưa có lịch sử phê duyệt.'}
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = posts.map(p => {
    const defaultImg = 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=300&q=80';
    const imgUrl = p.mediaUrl || defaultImg;
    const platforms = p.platforms ? p.platforms.join(' · ') : p.platform;
    const dateStr = formatDateTime(p.date);

    return `
      <tr>
        <td>
          <div class="post-media-cell">
            <img src="${escapeHtml(imgUrl)}" class="post-media-img" alt="thumb" onerror="this.src='${defaultImg}'">
            <div class="post-info-text">
              <b>${escapeHtml(p.title)}</b>
              <p>${escapeHtml(p.caption || '')}</p>
            </div>
          </div>
        </td>
        <td>
          <b>${escapeHtml(p.author)}</b>
          <div style="font-size: 11.5px; color: var(--muted);">${p.authorRole || 'Marketing Staff'}</div>
        </td>
        <td><span class="platform-pill">${escapeHtml(platforms)}</span></td>
        <td>
          <div style="font-weight: 500;">${dateStr}</div>
        </td>
        <td>
          <small style="color: #666; font-style: italic;">${p.submitNote ? `"${escapeHtml(p.submitNote)}"` : 'Không có ghi chú'}</small>
        </td>
        <td style="text-align: right;">
          ${p.status === 'review' ? `
            <button class="btn btn-primary btn-sm" onclick="openReviewModal(${p.id})">
              Xem & Phê duyệt
            </button>
          ` : `
            <span class="badge ${p.status}">${getStatusLabel(p.status)}</span>
            <button class="btn btn-outline btn-sm" style="margin-left: 6px;" onclick="openReviewModal(${p.id})">Xem lại</button>
          `}
        </td>
      </tr>
    `;
  }).join('');
}

window.openReviewModal = function(id) {
  const p = PostsStore.getPostById(id);
  if (!p) return;
  currentReviewPostId = p.id;

  const defaultImg = 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80';
  const imgUrl = p.mediaUrl || defaultImg;
  const isPending = p.status === 'review';

  document.getElementById('modalPostTitle').textContent = `Xem xét nội dung bài viết #${p.id}`;
  document.getElementById('modalPostContent').innerHTML = `
    <div class="approval-modal-grid">
      <!-- LEFT: POST PREVIEW -->
      <div class="review-preview-box">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span class="platform-pill" style="font-size: 12px;">${escapeHtml(p.platforms ? p.platforms.join(' · ') : p.platform)}</span>
          <span class="badge ${p.status}">${getStatusLabel(p.status)}</span>
        </div>
        <img src="${escapeHtml(imgUrl)}" class="review-preview-img" alt="review cover" onerror="this.src='${defaultImg}'">
        <h3 style="font-size: 16px; font-weight: 600; color: var(--text);">${escapeHtml(p.title)}</h3>
        <div class="review-caption">${escapeHtml(p.caption)}</div>
        <div style="font-size: 12.5px; color: var(--muted); display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div>Tác giả: <b style="color: var(--text);">${escapeHtml(p.author)}</b></div>
          <div>Lịch đăng dự kiến: <b style="color: var(--text);">${formatDateTime(p.date)}</b></div>
        </div>
        ${p.submitNote ? `
          <div style="background: #fff; border: 1px dashed var(--orange); border-radius: 6px; padding: 8px 12px; font-size: 12.5px;">
            <b>Ghi chú từ nhân viên:</b> ${escapeHtml(p.submitNote)}
          </div>
        ` : ''}
        ${p.revisionReason ? `
          <div style="background: var(--purple-bg); border-left: 3px solid var(--purple); border-radius: 4px; padding: 8px 12px; font-size: 12.5px; color: var(--purple);">
            <b>Lý do / Phản hồi của Manager:</b> ${escapeHtml(p.revisionReason)}
          </div>
        ` : ''}
      </div>

      <!-- RIGHT: MANAGER DECISION OR AUDIT LOGS -->
      <div class="action-decision-box">
        ${isPending ? `
          <div class="decision-section">
            <h4>Quyết định của Quản lý (Manager Decision)</h4>
            <p style="font-size: 12.5px; color: var(--muted); margin-bottom: 14px;">Chọn hành động phù hợp cho bài viết này:</p>
            <div class="decision-btn-group">
              <button class="decision-btn approve" onclick="handleApprove(${p.id})">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" stroke-width="2"><path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
                <div>
                  <div style="font-size: 14px;">Phê duyệt bài viết (Approve)</div>
                  <small style="font-weight: 400; opacity: 0.85;">Duyệt và tự động đồng bộ vào Lịch xuất bản</small>
                </div>
              </button>

              <button class="decision-btn revision" onclick="openReasonModal('revision', ${p.id})">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" stroke-width="2"><path d="M12 20h9M16 4l4 4L8 20H4v-4z"/></svg>
                <div>
                  <div style="font-size: 14px;">Yêu cầu chỉnh sửa (Revision)</div>
                  <small style="font-weight: 400; opacity: 0.85;">Bắt buộc nhập góp ý để nhân viên hoàn thiện lại</small>
                </div>
              </button>

              <button class="decision-btn reject" onclick="openReasonModal('reject', ${p.id})">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6"/></svg>
                <div>
                  <div style="font-size: 14px;">Từ chối bài viết (Reject)</div>
                  <small style="font-weight: 400; opacity: 0.85;">Bắt buộc nhập lý do từ chối không xuất bản</small>
                </div>
              </button>
            </div>
          </div>
        ` : `
          <div class="decision-section">
            <h4>Trạng thái bài viết: <span class="badge ${p.status}">${getStatusLabel(p.status)}</span></h4>
            <p style="font-size: 13px; color: var(--muted); margin-top: 6px;">Bài viết đã được xử lý xong trong quy trình phê duyệt.</p>
          </div>
        `}

        <!-- AUDIT LOG TIMELINE -->
        <div class="decision-section" style="flex: 1; max-height: 260px; overflow-y: auto;">
          <h4>Lịch sử xử lý bài viết (Audit Trail)</h4>
          <div style="display: flex; flex-direction: column; gap: 10px; font-size: 12.5px;">
            ${(p.auditLogs || []).map(log => `
              <div style="display: flex; align-items: flex-start; gap: 8px;">
                <div style="width: 8px; height: 8px; border-radius: 50%; background: var(--pink); margin-top: 5px; flex-shrink: 0;"></div>
                <div>
                  <div><b>${escapeHtml(log.user)}</b> · <span style="color: var(--pink); font-weight: 600;">${escapeHtml(log.action)}</span> · <small style="color: var(--muted);">${formatDateTime(log.time)}</small></div>
                  <div style="color: #666;">${escapeHtml(log.note || '')}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('reviewModal').classList.add('active');
};

window.closeReviewModal = function() {
  document.getElementById('reviewModal').classList.remove('active');
};

// Handle Approve
window.handleApprove = function(id) {
  const note = prompt('Ghi chú phê duyệt (tùy chọn):', 'Nội dung chỉn chu, hình ảnh đẹp. Đã duyệt lên lịch!');
  if (note !== null) {
    PostsStore.approvePost(id, note);
    closeReviewModal();
    showToast('Phê duyệt bài viết thành công! Đã tự động đồng bộ vào Lịch đăng.', 'success');
    loadData();
  }
};

// Handle Revision & Reject Modal
window.openReasonModal = function(actionType, id) {
  pendingActionType = actionType;
  currentReviewPostId = id;
  const isRevision = actionType === 'revision';

  document.getElementById('reasonModalTitle').textContent = isRevision ? 'Góp ý yêu cầu chỉnh sửa (Bắt buộc)' : 'Lý do từ chối bài viết (Bắt buộc)';
  document.getElementById('reasonModalDesc').textContent = isRevision
    ? 'Vui lòng mô tả cụ thể điểm chưa ưng ý (ảnh mờ, sai tone màu, thiếu hashtag...) để nhân viên chỉnh sửa:'
    : 'Vui lòng nhập rõ lý do hủy hoặc từ chối bài viết này:';

  const confirmBtn = document.getElementById('confirmReasonBtn');
  confirmBtn.className = isRevision ? 'btn btn-warning' : 'btn btn-danger';
  confirmBtn.textContent = isRevision ? 'Gửi yêu cầu sửa' : 'Xác nhận từ chối';

  document.getElementById('reasonInput').value = '';
  document.getElementById('reasonError').style.display = 'none';

  document.getElementById('reasonModal').classList.add('active');
};

window.closeReasonModal = function() {
  document.getElementById('reasonModal').classList.remove('active');
  pendingActionType = null;
};

function handleConfirmReason() {
  const reason = document.getElementById('reasonInput').value.trim();
  if (!reason) {
    document.getElementById('reasonError').style.display = 'block';
    return;
  }

  if (pendingActionType === 'revision') {
    PostsStore.requestRevision(currentReviewPostId, reason);
    showToast('Đã gửi yêu cầu chỉnh sửa kèm phản hồi đến nhân viên!', 'warning');
  } else if (pendingActionType === 'reject') {
    PostsStore.rejectPost(currentReviewPostId, reason);
    showToast('Đã từ chối bài viết thành công!', 'error');
  }

  closeReasonModal();
  closeReviewModal();
  loadData();
}

function getStatusLabel(st) {
  const map = {
    draft: 'Bản nháp',
    review: 'Chờ duyệt',
    edit: 'Cần chỉnh sửa',
    ready: 'Sẵn sàng đăng',
    done: 'Đã xuất bản',
    rejected: 'Bị từ chối'
  };
  return map[st] || st;
}

function formatDateTime(iso) {
  if (!iso) return 'Chưa lên lịch';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  return `${time} · ${date}`;
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${escapeHtml(message)}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

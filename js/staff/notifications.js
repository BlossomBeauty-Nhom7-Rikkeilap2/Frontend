// ==========================================================================
// BLOSSOM BEAUTY STORE - NOTIFICATIONS PAGE LOGIC (FR-12 & Task T06A668)
// ==========================================================================

let activeFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  initNotificationsPage();
  renderNotificationsList();
});

function initNotificationsPage() {
  // Filter tabs
  document.querySelectorAll('#notifFilterTabs .notif-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#notifFilterTabs .notif-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      renderNotificationsList();
    });
  });

  // Mark all read
  const markAllBtn = document.getElementById('btnMarkAllRead');
  if (markAllBtn) {
    markAllBtn.addEventListener('click', () => {
      NotificationsStore.markAllAsRead();
      showToast('Đã đánh dấu tất cả thông báo là đã đọc!', 'success');
      renderNotificationsList();
    });
  }

  // Clear read
  const clearReadBtn = document.getElementById('btnClearRead');
  if (clearReadBtn) {
    clearReadBtn.addEventListener('click', () => {
      let list = NotificationsStore.getNotifications();
      const readCount = list.filter(n => n.is_read).length;
      if (readCount === 0) {
        showToast('Không có thông báo đã đọc nào để xóa.', 'warning');
        return;
      }
      if (confirm(`Bạn có chắc muốn xóa ${readCount} thông báo đã đọc?`)) {
        list = list.filter(n => !n.is_read);
        NotificationsStore.saveNotifications(list);
        showToast(`Đã xóa ${readCount} thông báo đã đọc!`, 'success');
        renderNotificationsList();
      }
    });
  }

  window.addEventListener('blossom_notifications_updated', () => {
    renderNotificationsList();
  });
}

function getFilteredNotifications() {
  let list = NotificationsStore.getNotifications();
  const unreadCount = list.filter(n => !n.is_read).length;
  const unreadBadge = document.getElementById('unreadCountBadge');
  if (unreadBadge) unreadBadge.textContent = unreadCount;

  if (activeFilter === 'unread') {
    list = list.filter(n => !n.is_read);
  } else if (activeFilter !== 'all') {
    list = list.filter(n => n.type === activeFilter);
  }

  return list;
}

function renderNotificationsList() {
  const container = document.getElementById('notifListContainer');
  if (!container) return;

  const notifs = getFilteredNotifications();

  if (!notifs.length) {
    container.innerHTML = `
      <div style="background: #fff; border: 1px solid var(--pink-line); border-radius: var(--radius-lg); padding: 50px 20px; text-align: center;">
        <div style="font-size: 40px; margin-bottom: 12px;">🔔</div>
        <h4 style="font-size: 16px; color: var(--text); margin-bottom: 6px;">Không có thông báo nào</h4>
        <p style="color: var(--muted); font-size: 13.5px;">Tất cả thông báo phù hợp bộ lọc đã được hiển thị hoặc xử lý xong.</p>
      </div>
    `;
    return;
  }

  const typeConfig = {
    approved:  { icon: '🎉', label: 'Đã phê duyệt', class: 'approved', tone: 'green' },
    revision:  { icon: '✍️', label: 'Yêu cầu sửa', class: 'revision', tone: 'purple' },
    reminder:  { icon: '⏰', label: 'Nhắc nhở lịch', class: 'reminder', tone: 'orange' },
    submitted: { icon: '📤', label: 'Gửi duyệt', class: 'submitted', tone: 'pink' },
    published: { icon: '✅', label: 'Đã xuất bản', class: 'published', tone: 'blue' }
  };

  container.innerHTML = notifs.map(n => {
    const cfg = typeConfig[n.type] || { icon: '🔔', label: 'Thông báo', class: 'reminder', tone: 'orange' };
    const dateFormatted = formatNotificationDate(n.time);

    return `
      <div class="notif-card ${n.is_read ? '' : 'unread'}" id="notif-card-${n.id}">
        <div class="notif-card-icon notif-icon-circle ${cfg.class}">
          ${cfg.icon}
        </div>
        <div class="notif-card-content">
          <div class="notif-card-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <h4>${escapeHtml(n.title)}</h4>
              <span class="badge ${cfg.tone === 'blue' ? 'ready' : cfg.class}" style="font-size: 11px;">${cfg.label}</span>
              ${!n.is_read ? `<span class="badge review" style="font-size: 10px; padding: 2px 6px;">Mới</span>` : ''}
            </div>
            <span class="notif-card-time">${dateFormatted}</span>
          </div>

          <div class="notif-card-body">
            ${escapeHtml(n.message)}
          </div>

          <div class="notif-card-footer">
            <span class="notif-card-author">Gửi bởi: <b>${escapeHtml(n.author || 'Hệ thống')}</b></span>

            <div class="notif-card-buttons">
              ${n.postId ? `
                <button type="button" class="btn btn-primary btn-sm" onclick="handleViewPostDetail(${n.postId}, ${n.id})">
                  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  <span>Xem chi tiết bài viết</span>
                </button>
              ` : ''}

              <button type="button" class="btn btn-outline btn-sm" onclick="toggleReadStatus(${n.id})">
                ${n.is_read ? 'Đánh dấu chưa đọc' : '✓ Đã đọc'}
              </button>

              <button type="button" class="btn btn-outline btn-sm" style="color: var(--muted);" title="Xóa" onclick="deleteNotif(${n.id})">
                &times;
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

window.handleViewPostDetail = function(postId, notifId) {
  if (notifId) {
    NotificationsStore.markAsRead(notifId);
    renderNotificationsList();
  }
  if (window.openPostDetailModal) {
    window.openPostDetailModal(postId);
  }
};

window.toggleReadStatus = function(id) {
  const list = NotificationsStore.getNotifications();
  const item = list.find(n => n.id === Number(id));
  if (item) {
    item.is_read = !item.is_read;
    NotificationsStore.saveNotifications(list);
    showToast(item.is_read ? 'Đã đánh dấu thông báo là đã đọc.' : 'Đã đánh dấu là chưa đọc.', 'success');
    renderNotificationsList();
  }
};

window.deleteNotif = function(id) {
  NotificationsStore.deleteNotification(id);
  showToast('Đã xóa thông báo.', 'success');
  renderNotificationsList();
};

function formatNotificationDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  return `${d.toLocaleDateString('vi-VN')} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function showToast(msg, type = 'success') {
  if (window.UI && window.UI.toast) {
    window.UI.toast(type, type === 'success' ? 'Thành công' : 'Thông báo', msg, 3000);
    return;
  }
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${escapeHtml(msg)}</span>`;
  container.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    setTimeout(() => t.remove(), 300);
  }, 3000);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

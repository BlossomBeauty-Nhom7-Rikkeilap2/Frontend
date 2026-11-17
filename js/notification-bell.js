/**
 * Blossom Beauty Store - Notification Bell Component (FR-12 & Task T06A668)
 * Quản lý chuông thông báo, menu thả xuống (dropdown flyout) trên Topbar
 */

(function (global) {
  "use strict";

  document.addEventListener('DOMContentLoaded', () => {
    initBellDropdown();
  });

  function initBellDropdown() {
    const bellLink = document.querySelector('.bell');
    if (!bellLink) return;

    // Create dropdown container
    let dropdown = document.getElementById('bellDropdown');
    if (!dropdown) {
      dropdown = document.createElement('div');
      dropdown.id = 'bellDropdown';
      dropdown.className = 'bell-dropdown';
      bellLink.parentElement.style.position = 'relative';
      bellLink.parentElement.appendChild(dropdown);
    }

    // Toggle dropdown on click bell
    bellLink.addEventListener('click', (e) => {
      // If we are not on notifications.html, toggle dropdown
      if (!location.pathname.endsWith('notifications.html')) {
        e.preventDefault();
        e.stopPropagation();
        dropdown.classList.toggle('show');
        if (dropdown.classList.contains('show')) {
          renderBellDropdown(dropdown);
        }
      }
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && !bellLink.contains(e.target)) {
        dropdown.classList.remove('show');
      }
    });

    window.addEventListener('blossom_notifications_updated', () => {
      if (dropdown.classList.contains('show')) {
        renderBellDropdown(dropdown);
      }
      if (global.NotificationsStore) {
        global.NotificationsStore.syncBellUI();
      }
    });
  }

  function renderBellDropdown(dropdown) {
    if (!global.NotificationsStore) return;

    const notifs = global.NotificationsStore.getNotifications().slice(0, 5);
    const unreadCount = global.NotificationsStore.getUnreadCount();

    const isStaff = (global.Auth && global.Auth.getRole() === 'STAFF') || location.pathname.includes('/staff/');
    const allNotifsUrl = isStaff ? 'notifications.html' : 'notifications.html';

    dropdown.innerHTML = `
      <div class="bell-dropdown-header">
        <div style="display: flex; align-items: center; gap: 8px;">
          <b>Thông báo</b>
          ${unreadCount > 0 ? `<span class="badge review" style="font-size: 11px; padding: 2px 7px;">${unreadCount} mới</span>` : ''}
        </div>
        ${unreadCount > 0 ? `<button type="button" class="mark-all-read" onclick="markAllNotifsRead(event)">Đánh dấu đã đọc</button>` : ''}
      </div>
      <div class="bell-dropdown-list">
        ${notifs.length ? notifs.map(n => {
          const typeIcons = {
            approved: '🎉',
            revision: '✍️',
            reminder: '⏰',
            submitted: '📤',
            published: '✅'
          };
          const iconChar = typeIcons[n.type] || '🔔';

          return `
            <div class="bell-notif-item ${n.is_read ? '' : 'unread'}" onclick="handleNotifItemClick(${n.id}, ${n.postId || 'null'})">
              <div class="notif-icon-circle ${n.type}">
                ${iconChar}
              </div>
              <div class="bell-notif-info">
                <h5>${escapeHtml(n.title)}</h5>
                <p>${escapeHtml(n.message)}</p>
                <small>${formatTimeAgo(n.time)}</small>
              </div>
              ${!n.is_read ? `<div class="unread-dot-badge" title="Chưa đọc"></div>` : ''}
            </div>
          `;
        }).join('') : `
          <div style="padding: 30px; text-align: center; color: var(--muted); font-size: 13px;">
            Không có thông báo mới nào
          </div>
        `}
      </div>
      <div class="bell-dropdown-footer">
        <a href="${allNotifsUrl}">Xem tất cả thông báo →</a>
      </div>
    `;
  }

  global.markAllNotifsRead = function(e) {
    if (e) e.stopPropagation();
    if (global.NotificationsStore) {
      global.NotificationsStore.markAllAsRead();
    }
  };

  global.handleNotifItemClick = function(notifId, postId) {
    if (global.NotificationsStore) {
      global.NotificationsStore.markAsRead(notifId);
    }
    const dropdown = document.getElementById('bellDropdown');
    if (dropdown) dropdown.classList.remove('show');

    if (postId && global.openPostDetailModal) {
      global.openPostDetailModal(postId);
    }
  };

  function formatTimeAgo(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return d.toLocaleDateString('vi-VN');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

})(window);

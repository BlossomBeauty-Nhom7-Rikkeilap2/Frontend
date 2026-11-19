/**
 * Blossom Beauty Store - Notifications Store (FR-12 & Task T06A668)
 * Quản lý danh sách thông báo, trạng thái is_read, và kết nối với chuông Notification Bell
 */

const NOTIF_STORAGE_KEY = 'blossom_notifications_data';

const DEFAULT_NOTIFICATIONS = [
  {
    id: 1,
    type: 'approved',
    postId: 4,
    title: 'Bài viết đã được phê duyệt! 🎉',
    message: 'Bài viết "Siêu Hội Black Friday - Giảm đến 50% toàn bộ Serum cao cấp" đã được Manager Minh Anh phê duyệt và đồng bộ vào lịch xuất bản lúc 19:00 ngày 21/11/2026.',
    time: '2026-11-17T09:30:00',
    is_read: false,
    recipientRole: 'STAFF',
    author: 'Đoàn Thị Minh Anh (Manager)'
  },
  {
    id: 2,
    type: 'revision',
    postId: 2,
    title: 'Yêu cầu chỉnh sửa bài viết ✍️',
    message: 'Manager yêu cầu sửa bài "Review Son kem lì Velvet Matte Blossom Bloom #04 Ruby Rose": Cần làm rõ thông tin mã màu son ở 3 giây đầu clip và chèn nhạc nền nhẹ nhàng hơn theo tone thương hiệu nhé Đạt.',
    time: '2026-11-17T08:15:00',
    is_read: false,
    recipientRole: 'STAFF',
    author: 'Đoàn Thị Minh Anh (Manager)'
  },
  {
    id: 3,
    type: 'reminder',
    postId: 5,
    title: 'Nhắc nhở: Sắp đến giờ xuất bản bài viết ⏰',
    message: 'Bài viết "Ra mắt bộ cọ trang điểm Blossom Rose Gold Luxury 12 món" được lên lịch đăng trên Facebook & Instagram sau 30 phút nữa (08:30). Vui lòng kiểm tra media sẵn sàng.',
    time: '2026-11-16T16:00:00',
    is_read: false,
    recipientRole: 'STAFF',
    author: 'Hệ thống Blossom Auto-Scheduler'
  },
  {
    id: 4,
    type: 'submitted',
    postId: 1,
    title: 'Đã nộp bài duyệt thành công 📤',
    message: 'Bạn đã gửi bài "Bộ sưu tập chăm sóc da thu đông dưỡng ẩm chuyên sâu" cho Manager. Đang nằm trong hàng đợi chờ phê duyệt.',
    time: '2026-11-15T10:15:00',
    is_read: true,
    recipientRole: 'STAFF',
    author: 'Nguyễn Phát Đạt'
  },
  {
    id: 5,
    type: 'published',
    postId: 7,
    title: 'Bài viết đã được xuất bản công khai ✅',
    message: 'Bài viết "Ưu đãi tháng 11 - Rạng rỡ đón đông cùng Blossom Beauty" đã đăng thành công lên trang Facebook chính thức.',
    time: '2026-11-13T09:00:00',
    is_read: true,
    recipientRole: 'STAFF',
    author: 'Hệ thống Blossom Auto-Publisher'
  },
  {
    id: 6,
    type: 'submitted',
    postId: 6,
    title: 'Staff vừa nộp bài viết mới cần duyệt 📋',
    message: 'Nhân viên Nguyễn Phát Đạt vừa gửi duyệt bài "Top 5 màu son trendy nhất mùa tiệc tùng lễ hội cuối năm 2026" cho kênh TikTok.',
    time: '2026-11-15T08:30:00',
    is_read: false,
    recipientRole: 'MANAGER',
    author: 'Nguyễn Phát Đạt'
  }
];

const NotificationsStore = {
  getNotifications() {
    try {
      const data = localStorage.getItem(NOTIF_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('NotificationsStore read error:', e);
    }
    this.saveNotifications(DEFAULT_NOTIFICATIONS);
    return DEFAULT_NOTIFICATIONS;
  },

  saveNotifications(list) {
    try {
      localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(list));
      window.dispatchEvent(new Event('blossom_notifications_updated'));
      this.syncBellUI();
    } catch (e) {
      console.error('NotificationsStore save error:', e);
    }
  },

  getUnreadCount() {
    const list = this.getNotifications();
    return list.filter(n => !n.is_read).length;
  },

  markAsRead(id) {
    const list = this.getNotifications();
    const item = list.find(n => n.id === Number(id));
    if (item && !item.is_read) {
      item.is_read = true;
      this.saveNotifications(list);
    }
    return item;
  },

  markAllAsRead() {
    const list = this.getNotifications();
    list.forEach(n => { n.is_read = true; });
    this.saveNotifications(list);
  },

  deleteNotification(id) {
    let list = this.getNotifications();
    list = list.filter(n => n.id !== Number(id));
    this.saveNotifications(list);
  },

  addNotification(notif) {
    const list = this.getNotifications();
    const newId = list.length ? Math.max(...list.map(n => n.id)) + 1 : 1;
    const newNotif = {
      id: newId,
      time: new Date().toISOString(),
      is_read: false,
      ...notif
    };
    list.unshift(newNotif);
    this.saveNotifications(list);
    return newNotif;
  },

  // Đồng bộ chấm đỏ và số đếm trên chuông topbar
  syncBellUI() {
    const count = this.getUnreadCount();
    const notifDot = document.getElementById('notifDot');
    if (notifDot) {
      notifDot.hidden = count === 0;
    }
    const bellLink = document.querySelector('.bell');
    if (bellLink) {
      let badge = bellLink.querySelector('.bell-badge');
      if (count > 0) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'bell-badge';
          bellLink.appendChild(badge);
        }
        badge.textContent = count > 9 ? '9+' : count;
      } else if (badge) {
        badge.remove();
      }
    }
  }
};

window.NotificationsStore = NotificationsStore;

// Tự động đồng bộ chuông khi nạp trang
document.addEventListener('DOMContentLoaded', () => {
  NotificationsStore.syncBellUI();
});

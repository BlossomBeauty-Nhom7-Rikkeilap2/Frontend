/* ==========================================================
   BLOSSOM BEAUTY STORE – NOTIFICATIONS STORE (FR-12 / T06A668)
   Lưu trữ danh sách thông báo, đánh dấu is_read, đồng bộ Bell Topbar
   ========================================================== */

(function (global) {
    "use strict";

    const STORAGE_KEY = "blossom_notifications_data_v1";

    const INITIAL_NOTIFICATIONS = [
        /* ================= 1. THÔNG BÁO DÀNH CHO MANAGER (8 LOẠI) ================= */
        {
            id: 101,
            type: "submitted",
            postId: 130,
            title: "Có bài viết mới chờ duyệt",
            message: "Nhân viên Nguyễn Thùy Dương vừa gửi bài viết 'Serum hoa anh đào – bí quyết căng bóng' lên phê duyệt.",
            time: "2026-11-22T09:30:00",
            time_relative: "15 phút trước",
            is_read: false,
            recipientRole: "MANAGER",
            author: "Nguyễn Thùy Dương"
        },
        {
            id: 102,
            type: "submitted",
            postId: 126,
            title: "Nhân viên đã gửi lại bài viết",
            message: "Nhân viên Doãn Thị Minh Anh đã chỉnh sửa và gửi duyệt lại bài 'Một chút yêu thương cho làn da'.",
            time: "2026-11-22T08:45:00",
            time_relative: "1 giờ trước",
            is_read: false,
            recipientRole: "MANAGER",
            author: "Doãn Thị Minh Anh"
        },
        {
            id: 103,
            type: "calendar_proposed",
            eventId: 202,
            title: "Có lịch đăng mới cần xác nhận",
            message: "Nhân viên Nguyễn Thùy Dương vừa đề xuất lịch đăng mới cho bài 'Makeup look nhẹ nhàng' (09:15 ngày 25/11/2026).",
            time: "2026-11-22T08:15:00",
            time_relative: "2 giờ trước",
            is_read: false,
            recipientRole: "MANAGER",
            author: "Nguyễn Thùy Dương"
        },
        {
            id: 104,
            type: "calendar_updated",
            eventId: 204,
            title: "Nhân viên đã cập nhật lịch đăng",
            message: "Nhân viên Nguyễn Thùy Dương đã thay đổi lịch đăng bài 'Tips làm đẹp mùa lễ hội' theo yêu cầu (14:00 ngày 28/11/2026).",
            time: "2026-11-21T16:20:00",
            time_relative: "Hôm qua",
            is_read: true,
            recipientRole: "MANAGER",
            author: "Nguyễn Thùy Dương"
        },
        {
            id: 105,
            type: "due_soon",
            postId: 129,
            title: "Bài viết sắp đến hạn hoàn thành",
            message: "Bài viết 'Kem dưỡng trắng da Blossom' của nhân viên Doãn Thị Minh Anh sắp đến hạn hoàn thành (25/11/2026).",
            time: "2026-11-21T14:00:00",
            time_relative: "Hôm qua",
            is_read: true,
            recipientRole: "MANAGER",
            author: "Hệ thống Blossom Auto-Scheduler"
        },
        {
            id: 106,
            type: "overdue",
            postId: 125,
            title: "Bài viết quá hạn",
            message: "Bài viết 'Chọn serum phù hợp với làn da của bạn' do Nguyễn Hà Linh phụ trách đã quá hạn hoàn thành (20/11/2026).",
            time: "2026-11-21T10:30:00",
            time_relative: "Hôm qua",
            is_read: true,
            recipientRole: "MANAGER",
            author: "Hệ thống Blossom Auto-Scheduler"
        },
        {
            id: 107,
            type: "reminder",
            eventId: 201,
            title: "Lịch đăng sắp diễn ra",
            message: "Lịch đăng bài 'Skincare routine' (FB & IG) đã được xác nhận và sắp đến giờ đăng (09:00 hôm nay).",
            time: "2026-11-21T08:30:00",
            time_relative: "1 ngày trước",
            is_read: true,
            recipientRole: "MANAGER",
            author: "Hệ thống Blossom Auto-Scheduler"
        },
        {
            id: 108,
            type: "conflict",
            eventId: 202,
            title: "Có lịch đăng bị trùng",
            message: "Hệ thống phát hiện lịch đăng bài 'Ưu đãi Black Friday' bị trùng thời gian trên kênh Facebook & Instagram.",
            time: "2026-11-20T17:00:00",
            time_relative: "2 ngày trước",
            is_read: true,
            recipientRole: "MANAGER",
            author: "Hệ thống kiểm duyệt xung đột"
        },

        /* ================= 2. THÔNG BÁO DÀNH CHO STAFF (10 LOẠI) ================= */
        {
            id: 201,
            type: "assigned",
            postId: 132,
            title: "Bạn được giao bài viết mới",
            message: "Quản lý đã giao cho bạn phụ trách bài viết 'Bộ quà tặng mùa lễ hội Blossom'. Hạn hoàn thành: 28/11/2026.",
            time: "2026-11-22T09:00:00",
            time_relative: "30 phút trước",
            is_read: false,
            recipientRole: "STAFF",
            recipientUser: "thuyduong",
            author: "Marketing Manager"
        },
        {
            id: 202,
            type: "approved",
            postId: 128,
            title: "Bài viết đã được duyệt",
            message: "Bài viết '5 bước dưỡng da cho buổi sáng rạng rỡ' đã được Manager phê duyệt và xếp lịch phát hành.",
            time: "2026-11-22T08:30:00",
            time_relative: "1 giờ trước",
            is_read: false,
            recipientRole: "STAFF",
            recipientUser: "minhanh",
            author: "Marketing Manager"
        },
        {
            id: 203,
            type: "revision",
            postId: 126,
            title: "Bài viết cần chỉnh sửa",
            message: "Manager yêu cầu chỉnh sửa bài 'Một chút yêu thương cho làn da': Bổ sung thêm hình ảnh cận cảnh sản phẩm, tinh chỉnh hashtag thương hiệu #BlossomBeauty và kiểm tra lại giá niêm yết trong caption.",
            time: "2026-11-22T07:45:00",
            time_relative: "2 giờ trước",
            is_read: false,
            recipientRole: "STAFF",
            recipientUser: "minhanh",
            author: "Marketing Manager"
        },
        {
            id: 204,
            type: "rejected",
            postId: 123,
            title: "Bài viết bị từ chối",
            message: "Lý do: Nội dung caption chưa đủ 100 từ và hình ảnh sản phẩm chưa có logo nhận diện thương hiệu Blossom.",
            time: "2026-11-21T15:30:00",
            time_relative: "Hôm qua",
            is_read: true,
            recipientRole: "STAFF",
            recipientUser: "minhanh",
            author: "Marketing Manager"
        },
        {
            id: 205,
            type: "calendar_confirmed",
            eventId: 201,
            title: "Lịch đăng đã được xác nhận",
            message: "Manager đã xác nhận lịch đăng chính thức cho bài 'Skincare routine' lúc 09:00 ngày 25/11/2026 (FB & IG).",
            time: "2026-11-21T14:15:00",
            time_relative: "Hôm qua",
            is_read: true,
            recipientRole: "STAFF",
            recipientUser: "minhanh",
            author: "Marketing Manager"
        },
        {
            id: 206,
            type: "calendar_revision",
            eventId: 204,
            title: "Lịch đăng cần điều chỉnh",
            message: "Manager yêu cầu thay đổi lịch bài 'Tips làm đẹp mùa lễ hội': Vui lòng dời sang khung 19:00 để tránh trùng giờ cao điểm.",
            time: "2026-11-21T11:00:00",
            time_relative: "Hôm qua",
            is_read: true,
            recipientRole: "STAFF",
            recipientUser: "thuyduong",
            author: "Marketing Manager"
        },
        {
            id: 207,
            type: "calendar_changed",
            eventId: 203,
            title: "Lịch đăng đã được thay đổi",
            message: "Manager đã điều chỉnh thời gian đăng bài 'Review sản phẩm' sang 19:00 ngày 27/11/2026 (Instagram).",
            time: "2026-11-20T16:00:00",
            time_relative: "2 ngày trước",
            is_read: true,
            recipientRole: "STAFF",
            recipientUser: "minhanh",
            author: "Marketing Manager"
        },
        {
            id: 208,
            type: "due_soon",
            postId: 127,
            title: "Sắp đến hạn hoàn thành bài viết",
            message: "Bài viết 'Bí quyết chăm da mùa hanh khô' sắp đến hạn hoàn thành (26/11/2026). Vui lòng hoàn tất nội dung.",
            time: "2026-11-20T14:30:00",
            time_relative: "2 ngày trước",
            is_read: true,
            recipientRole: "STAFF",
            recipientUser: "minhanh",
            author: "Hệ thống Blossom Auto-Scheduler"
        },
        {
            id: 209,
            type: "overdue",
            postId: 125,
            title: "Bài viết đã quá hạn",
            message: "Bài viết 'Chọn serum phù hợp với làn da của bạn' đã quá hạn hoàn thành (20/11/2026). Vui lòng gửi duyệt ngay.",
            time: "2026-11-20T09:00:00",
            time_relative: "2 ngày trước",
            is_read: true,
            recipientRole: "STAFF",
            recipientUser: "minhanh",
            author: "Hệ thống Blossom Auto-Scheduler"
        },
        {
            id: 210,
            type: "reminder",
            eventId: 201,
            title: "Sắp đến giờ đăng bài",
            message: "Lịch đăng bài 'Skincare routine' (FB & IG) sẽ diễn ra sau 30 phút nữa. Vui lòng kiểm tra media sẵn sàng.",
            time: "2026-11-19T08:30:00",
            time_relative: "3 ngày trước",
            is_read: true,
            recipientRole: "STAFF",
            recipientUser: "minhanh",
            author: "Hệ thống Blossom Auto-Scheduler"
        }
    ];

    const NotificationsStore = {
        getNotifications: function () {
            try {
                const data = localStorage.getItem(STORAGE_KEY);
                if (data) {
                    const parsed = JSON.parse(data);
                    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                }
            } catch (e) {}

            this.saveNotifications(INITIAL_NOTIFICATIONS);
            return INITIAL_NOTIFICATIONS;
        },

        saveNotifications: function (list) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
                window.dispatchEvent(new Event("blossom_notifications_updated"));
                this.syncBellUI();
            } catch (e) {
                console.error("NotificationsStore save error:", e);
            }
        },

        // Thông báo này có dành cho người đang đăng nhập không?
        // Phân quyền độc lập tuyệt đối: Thông báo Manager riêng, Staff riêng, không gộp chung
        isVisible: function (n) {
            const role = (global.Auth && global.Auth.getRole()) || "MANAGER";
            if (n.recipientRole && n.recipientRole !== role) return false;
            if (role === "STAFF" && global.Scope) {
                const curUser = global.Auth.getUser();
                if (n.recipientUser) return global.Scope.sameUser(n.recipientUser, curUser);
                if (n.postId && !global.Scope.canViewPostId(n.postId)) return false;
            }
            return true;
        },

        getVisibleNotifications: function () {
            const self = this;
            return this.getNotifications().filter(function (n) { return self.isVisible(n); });
        },

        getUnreadCount: function () {
            return this.getVisibleNotifications().filter(function (n) { return !n.is_read; }).length;
        },

        markAsRead: function (id) {
            const list = this.getNotifications();
            const item = list.find(function (n) { return n.id === Number(id); });
            if (item && !item.is_read) {
                item.is_read = true;
                this.saveNotifications(list);
            }
            return item;
        },

        markAllAsRead: function () {
            const self = this;
            const list = this.getNotifications();
            list.forEach(function (n) { if (self.isVisible(n)) n.is_read = true; });
            this.saveNotifications(list);
        },

        addNotification: function (notif) {
            const list = this.getNotifications();
            const newId = list.length ? Math.max.apply(Math, list.map(function (n) { return n.id; })) + 1 : 1;
            const newNotif = Object.assign({
                id: newId,
                time: new Date().toISOString(),
                time_relative: "Vừa xong",
                is_read: false
            }, notif);
            list.unshift(newNotif);
            this.saveNotifications(list);
            return newNotif;
        },

        syncBellUI: function () {
            const count = this.getUnreadCount();
            const notifDot = document.getElementById("notifDot");
            if (notifDot) {
                notifDot.hidden = (count === 0);
            }

            const bellLink = document.querySelector(".bell");
            if (bellLink) {
                let badge = bellLink.querySelector(".bell-badge");
                if (count > 0) {
                    if (!badge) {
                        badge = document.createElement("span");
                        badge.className = "bell-badge";
                        bellLink.appendChild(badge);
                    }
                    badge.textContent = count > 9 ? "9+" : count;
                } else if (badge) {
                    badge.remove();
                }
            }
        }
    };

    global.NotificationsStore = NotificationsStore;

    document.addEventListener("DOMContentLoaded", function () {
        // Nhắc lịch đăng: kiểm tra khi mở trang và lặp lại mỗi phút
        if (global.Scope && typeof global.Scope.runReminders === "function") {
            global.Scope.runReminders();
            setInterval(function () { global.Scope.runReminders(); }, 60000);
        }
        NotificationsStore.syncBellUI();
    });

    window.addEventListener("blossom_notifications_updated", function () {
        NotificationsStore.syncBellUI();
    });
})(window);

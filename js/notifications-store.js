/* ==========================================================
   BLOSSOM BEAUTY STORE – NOTIFICATIONS STORE (FR-12 / T06A668)
   Lưu trữ danh sách thông báo, đánh dấu is_read, đồng bộ Bell Topbar
   ========================================================== */

(function (global) {
    "use strict";

    const STORAGE_KEY = "blossom_notifications_data_v2";

    const INITIAL_NOTIFICATIONS = [
        /* ===== 1. THÔNG BÁO DÀNH RIÊNG CHO MANAGER (8 loại) ===== */
        {
            id: 1,
            type: "submitted",
            postId: 130,
            title: "Có bài viết mới chờ duyệt",
            message: "Nguyễn Thùy Dương vừa gửi duyệt bài 'Serum hoa anh đào – bí quyết căng bóng' (BL-0130).",
            time: "2026-11-22T09:10:00",
            time_relative: "15 phút trước",
            is_read: false,
            recipientRole: "MANAGER",
            author: "Nguyễn Thùy Dương"
        },
        {
            id: 2,
            type: "submitted",
            postId: 126,
            title: "Nhân viên đã gửi lại bài viết",
            message: "Doãn Thị Minh Anh đã chỉnh sửa và gửi duyệt lại bài 'Một chút yêu thương cho làn da' (BL-0126).",
            time: "2026-11-22T08:40:00",
            time_relative: "45 phút trước",
            is_read: false,
            recipientRole: "MANAGER",
            author: "Doãn Thị Minh Anh"
        },
        {
            id: 3,
            type: "submitted",
            title: "Có lịch đăng mới cần xác nhận",
            message: "Trần Quốc Mạnh vừa đề xuất lịch đăng bài cho chiến dịch Tháng 11 lúc 09:00 trên Facebook & Instagram.",
            time: "2026-11-22T08:00:00",
            time_relative: "1 giờ trước",
            is_read: false,
            recipientRole: "MANAGER",
            author: "Trần Quốc Mạnh"
        },
        {
            id: 4,
            type: "submitted",
            title: "Nhân viên đã cập nhật lịch đăng",
            message: "Nguyễn Thùy Dương đã cập nhật lại thời gian đăng bài theo yêu cầu điều chỉnh – đang chờ xác nhận.",
            time: "2026-11-21T16:30:00",
            time_relative: "Hôm qua",
            is_read: true,
            recipientRole: "MANAGER",
            author: "Nguyễn Thùy Dương"
        },
        {
            id: 5,
            type: "deadline",
            postId: 129,
            title: "Bài viết sắp đến hạn hoàn thành",
            message: "Bài viết 'Sữa rửa mặt dịu nhẹ pH 5.5' (BL-0129) sắp đến hạn hoàn thành (due_date).",
            time: "2026-11-21T14:00:00",
            time_relative: "Hôm qua",
            is_read: true,
            recipientRole: "MANAGER",
            author: "Hệ thống Blossom"
        },
        {
            id: 6,
            type: "overdue",
            postId: 125,
            title: "Bài viết quá hạn",
            message: "Bài viết 'Chọn serum phù hợp với làn da của bạn' (BL-0125) chưa hoàn thành dù đã quá hạn.",
            time: "2026-11-20T18:00:00",
            time_relative: "2 ngày trước",
            is_read: true,
            recipientRole: "MANAGER",
            author: "Hệ thống Blossom"
        },
        {
            id: 7,
            type: "reminder",
            postId: 128,
            title: "Lịch đăng sắp diễn ra",
            message: "Lịch đăng đã xác nhận của bài '5 bước dưỡng da cho buổi sáng rạng rỡ' sắp đến giờ xuất bản.",
            time: "2026-11-20T08:30:00",
            time_relative: "2 ngày trước",
            is_read: true,
            recipientRole: "MANAGER",
            author: "Hệ thống Blossom"
        },
        {
            id: 8,
            type: "conflict",
            title: "Có lịch đăng bị trùng",
            message: "Hệ thống phát hiện 2 lịch đăng trên cùng nền tảng cách nhau dưới 30 phút. Vui lòng kiểm tra Lịch đăng bài.",
            time: "2026-11-19T10:15:00",
            time_relative: "3 ngày trước",
            is_read: true,
            recipientRole: "MANAGER",
            author: "Hệ thống Blossom"
        },

        /* ===== 2. THÔNG BÁO DÀNH RIÊNG CHO STAFF (10 loại) ===== */
        {
            id: 101,
            type: "assigned",
            postId: 126,
            isSeed: true,
            title: "Bạn được giao bài viết mới",
            message: "Manager Đoàn Thị Minh Anh vừa giao cho bạn bài viết 'Một chút yêu thương cho làn da' (BL-0126).",
            time: "2026-11-22T09:00:00",
            time_relative: "20 phút trước",
            is_read: false,
            recipientRole: "STAFF",
            author: "Đoàn Thị Minh Anh (Manager)"
        },
        {
            id: 102,
            type: "approved",
            postId: 128,
            isSeed: true,
            title: "Bài viết đã được duyệt",
            message: "Bài viết '5 bước dưỡng da cho buổi sáng rạng rỡ' (BL-0128) đã được Manager phê duyệt.",
            time: "2026-11-22T08:30:00",
            time_relative: "50 phút trước",
            is_read: false,
            recipientRole: "STAFF",
            author: "Đoàn Thị Minh Anh (Manager)"
        },
        {
            id: 103,
            type: "revision",
            postId: 126,
            isSeed: true,
            title: "Bài viết cần chỉnh sửa",
            message: "Bài viết 'Một chút yêu thương cho làn da' cần chỉnh sửa: Bổ sung thêm hashtag #BlossomCare và chỉnh ảnh bìa.",
            time: "2026-11-21T17:20:00",
            time_relative: "Hôm qua",
            is_read: false,
            recipientRole: "STAFF",
            author: "Đoàn Thị Minh Anh (Manager)"
        },
        {
            id: 104,
            type: "rejected",
            postId: 124,
            isSeed: true,
            title: "Bài viết bị từ chối",
            message: "Lý do: Nội dung caption chưa đủ tiêu chuẩn và hình ảnh sản phẩm chưa có logo nhận diện Blossom.",
            time: "2026-11-21T11:00:00",
            time_relative: "Hôm qua",
            is_read: true,
            recipientRole: "STAFF",
            author: "Đoàn Thị Minh Anh (Manager)"
        },
        {
            id: 105,
            type: "approved",
            isSeed: true,
            title: "Lịch đăng đã được xác nhận",
            message: "Manager đã xác nhận lịch đăng chính thức cho bài '5 bước dưỡng da cho buổi sáng rạng rỡ'.",
            time: "2026-11-20T15:00:00",
            time_relative: "2 ngày trước",
            is_read: true,
            recipientRole: "STAFF",
            author: "Đoàn Thị Minh Anh (Manager)"
        },
        {
            id: 106,
            type: "revision",
            isSeed: true,
            title: "Lịch đăng cần điều chỉnh",
            message: "Manager yêu cầu điều chỉnh thời gian đăng bài để tránh trùng khung giờ vàng của chiến dịch.",
            time: "2026-11-20T11:00:00",
            time_relative: "2 ngày trước",
            is_read: true,
            recipientRole: "STAFF",
            author: "Đoàn Thị Minh Anh (Manager)"
        },
        {
            id: 107,
            type: "revision",
            isSeed: true,
            title: "Lịch đăng đã được thay đổi",
            message: "Manager đã điều chỉnh giờ đăng bài viết của bạn sang khung 19:00 cùng ngày.",
            time: "2026-11-19T16:40:00",
            time_relative: "3 ngày trước",
            is_read: true,
            recipientRole: "STAFF",
            author: "Đoàn Thị Minh Anh (Manager)"
        },
        {
            id: 108,
            type: "deadline",
            postId: 125,
            isSeed: true,
            title: "Sắp đến hạn hoàn thành bài viết",
            message: "Bài viết được giao của bạn sắp đến hạn hoàn thành (due_date). Vui lòng gửi duyệt sớm.",
            time: "2026-11-19T09:00:00",
            time_relative: "3 ngày trước",
            is_read: true,
            recipientRole: "STAFF",
            author: "Hệ thống Blossom"
        },
        {
            id: 109,
            type: "overdue",
            postId: 125,
            isSeed: true,
            title: "Bài viết đã quá hạn",
            message: "Bài viết của bạn đã quá hạn hoàn thành (due_date). Vui lòng hoàn thiện và gửi duyệt ngay.",
            time: "2026-11-18T18:00:00",
            time_relative: "4 ngày trước",
            is_read: true,
            recipientRole: "STAFF",
            author: "Hệ thống Blossom"
        },
        {
            id: 110,
            type: "reminder",
            postId: 128,
            isSeed: true,
            title: "Sắp đến giờ đăng bài",
            message: "Lịch đăng đã xác nhận của bạn sắp diễn ra trong 30 phút nữa. Hãy kiểm tra lại media và caption.",
            time: "2026-11-18T08:30:00",
            time_relative: "4 ngày trước",
            is_read: true,
            recipientRole: "STAFF",
            author: "Hệ thống Blossom"
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

        // Tách riêng hoàn toàn thông báo của Manager và Staff (KHÔNG gộp chung):
        // - Manager chỉ thấy thông báo có recipientRole === "MANAGER"
        // - Staff chỉ thấy thông báo có recipientRole === "STAFF" gửi cho chính mình (hoặc bài viết của mình)
        isVisible: function (n) {
            const role = (global.Auth && global.Auth.getRole()) || "MANAGER";
            if (!n || n.recipientRole !== role) return false;
            if (role === "STAFF" && global.Scope) {
                if (n.isSeed) return true;
                const me = global.Auth && global.Auth.getUser();
                if (n.recipientUser) return global.Scope.sameUser(n.recipientUser, me);
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
                if (global.BlossomAPI && global.BlossomAPI.getToken() && Number(id)) {
                    global.BlossomAPI.request("/notifications/" + id + "/read", { method: "PATCH" }).catch(function () {});
                }
            }
            return item;
        },

        markAllAsRead: function () {
            const self = this;
            const list = this.getNotifications();
            list.forEach(function (n) { if (self.isVisible(n)) n.is_read = true; });
            this.saveNotifications(list);
            if (global.BlossomAPI && global.BlossomAPI.getToken()) {
                global.BlossomAPI.request("/notifications/read-all", { method: "PATCH" }).catch(function () {});
            }
        },

        deleteNotification: function (id) {
            let list = this.getNotifications();
            list = list.filter(function (n) { return n.id !== Number(id); });
            this.saveNotifications(list);
            if (global.BlossomAPI && global.BlossomAPI.getToken() && Number(id)) {
                global.BlossomAPI.request("/notifications/" + id, { method: "DELETE" }).catch(function () {});
            }
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
        },

        syncFromBackend: async function () {
            if (!global.BlossomAPI || !global.BlossomAPI.getToken()) return;
            try {
                const list = await global.BlossomAPI.request("/notifications");
                if (Array.isArray(list) && list.length) {
                    const current = this.getNotifications();
                    const map = {};
                    current.forEach(function (n) { map[n.id] = n; });

                    list.forEach(function (beN) {
                        map[beN.notification_id] = {
                            id: beN.notification_id,
                            type: beN.type ? beN.type.toLowerCase() : "submitted",
                            title: beN.title,
                            message: beN.content || beN.message || "",
                            time: beN.created_at,
                            time_relative: "Gần đây",
                            is_read: beN.is_read,
                            postId: beN.post_id
                        };
                    });
                    this.saveNotifications(Object.values(map));
                }
            } catch (e) {
                console.warn("[NotificationsStore] syncFromBackend error:", e.message);
            }
        },

        initWebSocket: function () {
            if (!global.BlossomAPI || !global.BlossomAPI.getToken()) return;
            const token = global.BlossomAPI.getToken();
            const wsProtocol = location.protocol === "https:" ? "wss:" : "ws:";
            const wsUrl = wsProtocol + "//localhost:8000/api/ws/notifications?token=" + encodeURIComponent(token);

            try {
                const socket = new WebSocket(wsUrl);

                socket.onopen = function () {
                    console.log("[WebSocket] Kết nối WebSocket thông báo thành công.");
                };

                socket.onmessage = function (event) {
                    try {
                        const data = JSON.parse(event.data);
                        if (data && data.title) {
                            NotificationsStore.addNotification({
                                title: data.title,
                                message: data.message || "",
                                type: data.type || "submitted",
                                postId: data.post_id || null,
                                author: data.author || "Hệ thống Blossom"
                            });
                            if (global.UI && typeof global.UI.toast === "function") {
                                global.UI.toast("info", data.title, data.message || "");
                            }
                        }
                    } catch (e) {
                        console.warn("[WebSocket] Lỗi phân tích tin nhắn:", e);
                    }
                };

                socket.onerror = function (err) {
                    console.warn("[WebSocket] Lỗi kết nối WebSocket:", err);
                };

                socket.onclose = function () {
                    console.log("[WebSocket] Đã đóng kết nối. Thử lại sau 15 giây.");
                    setTimeout(function () {
                        NotificationsStore.initWebSocket();
                    }, 15000);
                };
            } catch (e) {
                console.warn("[WebSocket] Không thể khởi tạo kết nối:", e.message);
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
        if (global.BlossomAPI && global.BlossomAPI.getToken()) {
            NotificationsStore.syncFromBackend();
            NotificationsStore.initWebSocket();
        }
    });

    window.addEventListener("blossom_notifications_updated", function () {
        NotificationsStore.syncBellUI();
    });
})(window);

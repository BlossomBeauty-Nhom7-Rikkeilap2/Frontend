/* ==========================================================
   BLOSSOM BEAUTY STORE – NOTIFICATIONS STORE (FR-12 / T06A668)
   Lưu trữ danh sách thông báo, đánh dấu is_read, đồng bộ Bell Topbar
   ========================================================== */

(function (global) {
    "use strict";

    const STORAGE_KEY = "blossom_notifications_data_v2";
    const REAL_NOTIF_FLAG = "blossom_notifs_real_v1";

    const NotificationsStore = {
        getNotifications: function () {
            try {
                if (!localStorage.getItem(REAL_NOTIF_FLAG)) {
                    localStorage.removeItem(STORAGE_KEY);
                    localStorage.setItem(REAL_NOTIF_FLAG, "1");
                }
                const data = localStorage.getItem(STORAGE_KEY);
                if (data) {
                    const parsed = JSON.parse(data);
                    if (Array.isArray(parsed)) return parsed;
                }
            } catch (e) {}

            return [];
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
                if (Array.isArray(list)) {
                    const currentRole = (global.Auth && global.Auth.getRole()) || "MANAGER";
                    const currentUser = (global.Auth && global.Auth.getUser()) || null;
                    const typeMap = {
                        APPROVAL_REQUEST: "submitted",
                        POST_APPROVED: "approved",
                        POST_REJECTED: "rejected",
                        SCHEDULE_REMINDER: "reminder",
                        OVERDUE_ALERT: "overdue"
                    };

                    const realNotifs = list.map(function (beN) {
                        const rawType = (beN.notification_type || beN.type || "").toUpperCase();
                        return {
                            id: beN.notification_id,
                            type: typeMap[rawType] || (rawType ? rawType.toLowerCase() : "submitted"),
                            title: beN.title,
                            message: beN.message || beN.content || "",
                            time: beN.created_at,
                            time_relative: "Gần đây",
                            is_read: beN.is_read,
                            postId: beN.post_id,
                            recipientRole: currentRole,
                            recipientUser: currentUser ? currentUser.username : undefined
                        };
                    });
                    this.saveNotifications(realNotifs);
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
                            const currentRole = (global.Auth && global.Auth.getRole()) || "MANAGER";
                            const currentUser = (global.Auth && global.Auth.getUser()) || null;
                            const wsTypeMap = {
                                APPROVAL_REQUEST: "submitted",
                                POST_APPROVED: "approved",
                                POST_REJECTED: "rejected",
                                SCHEDULE_REMINDER: "reminder",
                                OVERDUE_ALERT: "overdue"
                            };
                            const rawWsType = String(data.type || "").toUpperCase();
                            NotificationsStore.addNotification({
                                title: data.title,
                                message: data.message || "",
                                type: wsTypeMap[rawWsType] || "submitted",
                                postId: data.post_id || null,
                                author: data.author || "Hệ thống Blossom",
                                recipientRole: currentRole,
                                recipientUser: currentUser ? currentUser.username : undefined
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

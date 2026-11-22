/* =========================================================
   STAFF – Trang Dashboard nhân viên (logic riêng của trang)
   Sidebar / Header / dropdown / đăng xuất / Ctrl+K: js/layout.js
   Component: js/components.js (UI.*)
   Đồng bộ trực tiếp với blossom_posts_fr06_07_v1
   ========================================================= */

(function () {
    "use strict";

    const STORAGE_KEY = Scope.POSTS_KEY;

    // Map Blossom standard status to components UI status (draft | review | edit | ready | done)
    function mapStatus(s) {
        switch (s) {
            case "DRAFT": return "draft";
            case "PENDING_APPROVAL": return "review";
            case "REVISION_REQUESTED":
            case "REJECTED": return "edit";
            case "SCHEDULED":
            case "APPROVED": return "ready";
            case "PUBLISHED": return "done";
            default: return "draft";
        }
    }

    function renderDashboard() {
        const user = Auth.getUser();
        // Chỉ lấy bài viết do chính nhân viên này phụ trách (không còn "bài mẫu" của người khác)
        const myPosts = Scope.visiblePosts();

        const countStatus = function (st) {
            return myPosts.filter(function (p) { return mapStatus(p.status) === st; }).length;
        };

        const total = myPosts.length;
        const done = countStatus("done");
        const review = countStatus("review");
        // "Cần chỉnh sửa" đếm đúng trạng thái REVISION_REQUESTED
        const edit = myPosts.filter(function (p) { return p.status === "REVISION_REQUESTED"; }).length;
        const ready = countStatus("ready");

        // 1. WELCOME + PROGRESS
        const now = new Date();
        const weekday = now.toLocaleDateString("vi-VN", { weekday: "long" });
        const greetingEl = document.getElementById("greeting");
        const todayTextEl = document.getElementById("todayText");
        const monthChipEl = document.getElementById("monthChip");

        if (greetingEl) greetingEl.textContent = "Xin chào, " + Auth.shortName(user) + "!";
        if (todayTextEl) {
            todayTextEl.textContent = weekday + ", " + now.toLocaleDateString("vi-VN") + " · Cùng hoàn thành những nội dung thật chỉn chu hôm nay.";
        }
        if (monthChipEl) {
            monthChipEl.textContent = "Tháng " + (now.getMonth() + 1) + " / " + now.getFullYear();
        }

        const percent = total ? Math.round((done / total) * 100) : 0;
        const progPercentEl = document.getElementById("progressPercent");
        const progCountEl = document.getElementById("progressCount");
        const progFillEl = document.getElementById("progressFill");

        if (progPercentEl) progPercentEl.textContent = percent + "%";
        if (progCountEl) progCountEl.textContent = done + " / " + total + " bài viết đã xuất bản";
        if (progFillEl) {
            requestAnimationFrame(function () {
                progFillEl.style.width = percent + "%";
            });
        }

        // 2. STATS CARDS
        const statsEl = document.getElementById("stats");
        if (statsEl) {
            const stats = [
                {
                    icon: "doc",
                    tone: "pink",
                    label: "Bài viết của tôi",
                    value: UI.pad(total),
                    note: "Tổng bài bạn phụ trách",
                    href: "posts.html"
                },
                {
                    icon: "clock",
                    tone: "orange",
                    label: "Chờ duyệt",
                    value: UI.pad(review),
                    note: "Đang chờ Manager phê duyệt",
                    href: "posts.html?statuses=PENDING_APPROVAL"
                },
                {
                    icon: "edit",
                    tone: "purple",
                    label: "Cần chỉnh sửa",
                    value: UI.pad(edit),
                    note: "Cần hoàn thiện lại",
                    href: "posts.html?statuses=REVISION_REQUESTED"
                },
                {
                    icon: "check",
                    tone: "green",
                    label: "Đã xuất bản",
                    value: UI.pad(done),
                    note: "Đã chia sẻ đến khách hàng",
                    href: "posts.html?statuses=PUBLISHED"
                }
            ];
            statsEl.innerHTML = stats.map(function (st) {
                return '<a class="stat-link" href="' + st.href + '" title="Xem danh sách bài viết tương ứng">' + UI.statCard(st) + '</a>';
            }).join("");
        }

        // 3. TASKS (Công việc cần theo dõi)
        // Ưu tiên: cần sửa > chờ duyệt > nháp > sẵn sàng; bỏ bài đã xuất bản
        const priorityOrder = { edit: 0, review: 1, draft: 2, ready: 3, done: 4 };
        const pendingTasks = myPosts
            .filter(function (p) { return mapStatus(p.status) !== "done"; })
            .sort(function (a, b) {
                return (priorityOrder[mapStatus(a.status)] || 0) - (priorityOrder[mapStatus(b.status)] || 0);
            })
            .slice(0, 5);

        window.__staffTasks = pendingTasks;
        renderTasks(pendingTasks);

        // 4. SCHEDULE (Lịch đăng sắp tới)
        const upcoming = myPosts
            .filter(function (p) {
                const ms = mapStatus(p.status);
                return ms === "ready" || ms === "review";
            })
            .sort(function (a, b) {
                return (a.planned_date || "").localeCompare(b.planned_date || "");
            })
            .slice(0, 4);

        const scheduleEl = document.getElementById("scheduleList");
        if (scheduleEl) {
            if (upcoming.length) {
                scheduleEl.innerHTML = upcoming.map(function (p) {
                    const d = p.planned_date ? new Date(p.planned_date + "T09:00:00") : now;
                    const plat = p.platform_label || (Array.isArray(p.platforms) ? p.platforms.join(" & ") : "Mạng xã hội");
                    return '<div class="schedule-item">' +
                        '<div class="date-box"><b>' + UI.pad(d.getDate()) + '</b><small>TH ' + (d.getMonth() + 1) + '</small></div>' +
                        '<div class="schedule-info"><b>' + UI.esc(p.title) + '</b>' +
                        '<small>09:00 · ' + UI.esc(plat) + '</small></div>' +
                    '</div>';
                }).join("");
            } else {
                scheduleEl.innerHTML = '<p class="empty-message">Chưa có bài nào được lên lịch.</p>';
            }
        }
    }

    function renderTasks(list) {
        const el = document.getElementById("taskList");
        if (!el) return;
        if (!list.length) {
            el.innerHTML = '<p class="empty-message">Không có công việc nào cần xử lý lúc này.</p>';
            return;
        }
        el.innerHTML = list.map(function (t) {
            const plat = t.platform_label || (Array.isArray(t.platforms) ? t.platforms.join(" & ") : "Mạng xã hội");
            const dateStr = t.planned_label || t.planned_date || "Hôm nay";
            const ms = mapStatus(t.status);
            return '<a href="posts.html" class="task" title="Xem bài viết trong danh sách">' +
                '<div><b>' + UI.esc(t.title) + '</b><small>' + UI.esc(plat) + ' · ' + UI.esc(dateStr) + '</small></div>' +
                UI.statusBadge(ms) +
            '</a>';
        }).join("");
    }

    // Bind Topbar Search
    function bindSearch() {
        const searchInput = document.getElementById("searchInput");
        if (searchInput) {
            searchInput.addEventListener("input", function () {
                const k = searchInput.value.toLowerCase().trim();
                const tasks = window.__staffTasks || [];
                if (!k) {
                    renderTasks(tasks);
                    return;
                }
                const filtered = tasks.filter(function (p) {
                    const stObj = UI.POST_STATUS[mapStatus(p.status)] || {};
                    return [p.title, p.platform_label, stObj.label || ""].some(function (v) {
                        return (v || "").toLowerCase().includes(k);
                    });
                });
                renderTasks(filtered);
            });
        }

        // Listen for storage changes
        window.addEventListener("blossom_posts_updated", renderDashboard);
        window.addEventListener("storage", function (e) {
            if (e.key === STORAGE_KEY) renderDashboard();
        });
    }

    renderDashboard();
    bindSearch();
})();
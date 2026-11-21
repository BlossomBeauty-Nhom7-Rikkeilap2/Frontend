/* =========================================================
   ADMIN DASHBOARD – THEO DÕI TIẾN ĐỘ NHÂN VIÊN
   - Dùng chung kho dữ liệu bài viết (blossom_posts_v3) với Bài viết & Lịch đăng bài
   - Công thức tiến độ: Tiến độ (%) = (Số bài đã đăng PUBLISHED / Tổng số bài được giao) × 100%
   - Hiển thị due_date (Hạn hoàn thành nội dung) tách biệt với scheduled_at trên Calendar
   ========================================================= */
(function () {
    "use strict";

    const POST_LIST_KEY = "blossom_posts_v3";
    const TODAY_ISO = "2026-11-04";

    const STAFF_DIRECTORY = [
        { name: "Doãn Thị Minh Anh", role: "Nhân viên nội dung", initials: "MA" },
        { name: "Nguyễn Hà Linh",    role: "Nhân viên nội dung", initials: "HL" },
        { name: "Trần Ngọc Mai",     role: "Nhân viên nội dung", initials: "NM" },
        { name: "Lê Thu Hương",      role: "Nhân viên nội dung", initials: "TH" },
        { name: "Phạm Khánh Linh",   role: "Nhân viên nội dung", initials: "KL" }
    ];

    const FALLBACK_POSTS = [
        {
            post_id: 128, code: "BL-0128", title: "5 bước dưỡng da cho buổi sáng rạng rỡ",
            author: "Nguyễn Hà Linh", campaign: "Nâng niu làn da · Tháng 11",
            status: "PUBLISHED", due_date: "2026-11-03", planned_date: "2026-11-04", deleted_at: null
        },
        {
            post_id: 127, code: "BL-0127", title: "Bí quyết chăm da mùa hanh khô",
            author: "Doãn Thị Minh Anh", campaign: "Nâng niu làn da · Tháng 11",
            status: "PENDING_APPROVAL", due_date: "2026-11-04", planned_date: "2026-11-05", deleted_at: null
        },
        {
            post_id: 126, code: "BL-0126", title: "Một chút yêu thương cho làn da",
            author: "Lê Thu Hương", campaign: "Chăm da dịu nhẹ mỗi ngày",
            status: "REVISION_REQUESTED", due_date: "2026-11-05", planned_date: "2026-11-06", deleted_at: null
        },
        {
            post_id: 125, code: "BL-0125", title: "Chọn serum phù hợp với làn da của bạn",
            author: "Doãn Thị Minh Anh", campaign: "Nâng niu làn da · Tháng 11",
            status: "DRAFT", due_date: "2026-11-06", planned_date: "2026-11-07", deleted_at: null
        },
        {
            post_id: 124, code: "BL-0124", title: "Chống nắng mỗi ngày, nâng niu làn da",
            author: "Phạm Khánh Linh", campaign: "Chăm da dịu nhẹ mỗi ngày",
            status: "SCHEDULED", due_date: "2026-11-07", planned_date: "2026-11-08", deleted_at: null
        },
        {
            post_id: 123, code: "BL-0123", title: "Routine tối giản cho ngày bận rộn",
            author: "Doãn Thị Minh Anh", campaign: "Nâng niu làn da · Tháng 11",
            status: "PUBLISHED", due_date: "2026-11-02", planned_date: "2026-11-03", deleted_at: null
        },
        {
            post_id: 122, code: "BL-0122", title: "Review Son Dưỡng Thuần Chay Hương Đào Blossom",
            author: "Trần Ngọc Mai", campaign: "Rạng rỡ mùa lễ hội · Tháng 12",
            status: "DRAFT", due_date: "2026-11-09", planned_date: "2026-11-10", deleted_at: null
        },
        {
            post_id: 121, code: "BL-0121", title: "Tẩy trang đúng cách giúp ngăn ngừa mụn ẩn",
            author: "Lê Thu Hương", campaign: "Chăm da dịu nhẹ mỗi ngày",
            status: "APPROVED", due_date: "2026-11-11", planned_date: "2026-11-12", deleted_at: null
        },
        {
            post_id: 120, code: "BL-0120", title: "Ưu đãi Tuần Lễ Hoa Anh Đào - Tặng Kèm Mặt Nạ Ngủ",
            author: "Phạm Khánh Linh", campaign: "Rạng rỡ mùa lễ hội · Tháng 12",
            status: "PUBLISHED", due_date: "2026-10-30", planned_date: "2026-11-01", deleted_at: null
        }
    ];

    const STATUS_BADGE = {
        PUBLISHED:          { text: "Đã đăng",       cls: "badge--green"  },
        PENDING_APPROVAL:   { text: "Chờ duyệt",     cls: "badge--orange" },
        REVISION_REQUESTED: { text: "Cần chỉnh sửa", cls: "badge--pink"   },
        REJECTED:           { text: "Cần chỉnh sửa", cls: "badge--red"    },
        DRAFT:              { text: "Đang xử lý",    cls: "badge--purple" },
        APPROVED:           { text: "Đã duyệt",      cls: "badge--green"  },
        SCHEDULED:          { text: "Đã lên lịch",   cls: "badge--green"  }
    };

    let activeTab = "members"; // members | board

    function loadAllPosts() {
        let list = [];
        try {
            const raw = JSON.parse(localStorage.getItem(POST_LIST_KEY));
            if (Array.isArray(raw) && raw.length) list = raw;
        } catch (_) {}
        if (!list.length) list = FALLBACK_POSTS.slice();

        return list
            .filter(function (p) { return !p.deleted_at; })
            .map(function (p, idx) {
                const due = p.due_date || p.planned_date || "2026-11-07";
                const campaign = p.campaign || (idx % 3 === 0 ? "Nâng niu làn da · Tháng 11" : (idx % 3 === 1 ? "Chăm da dịu nhẹ mỗi ngày" : "Rạng rỡ mùa lễ hội · Tháng 12"));
                return Object.assign({}, p, {
                    assigned_to: p.assigned_to || p.author || "Doãn Thị Minh Anh",
                    due_date: due,
                    campaign: campaign
                });
            });
    }

    function formatDateVN(iso) {
        if (!iso || iso.indexOf("-") === -1) return iso || "";
        return iso.split("-").reverse().join("/");
    }

    function getFilteredPosts() {
        const authorVal = (document.getElementById("dashAuthorFilter") || {}).value || "ALL";
        const campaignVal = (document.getElementById("dashCampaignFilter") || {}).value || "ALL";
        const periodVal = (document.getElementById("dashPeriodFilter") || {}).value || "ALL";

        return loadAllPosts().filter(function (p) {
            if (authorVal !== "ALL" && p.assigned_to !== authorVal) return false;
            if (campaignVal !== "ALL" && p.campaign !== campaignVal) return false;
            if (periodVal !== "ALL" && String(p.due_date || "").slice(0, 7) !== periodVal) return false;
            return true;
        });
    }

    function renderStats(posts) {
        const total = posts.length;
        const published = posts.filter(function (p) { return p.status === "PUBLISHED"; }).length;
        const pending = posts.filter(function (p) { return p.status === "PENDING_APPROVAL"; }).length;
        const revision = posts.filter(function (p) { return p.status === "REVISION_REQUESTED" || p.status === "REJECTED"; }).length;
        const overdue = posts.filter(function (p) { return p.status !== "PUBLISHED" && p.due_date < TODAY_ISO; }).length;
        const onTime = total > 0 ? Math.round(((total - overdue) / total) * 100) : 100;

        // Công thức: Tiến độ (%) = (Số bài đã đăng / Tổng số bài được giao) × 100%
        const progressPct = total > 0 ? Math.round((published / total) * 100) : 0;

        const statsData = [
            { icon: "doc",   tone: "pink",   label: "Hoàn thành kế hoạch", value: progressPct + "%", note: published + " / " + total + " bài đã đăng" },
            { icon: "tick",  tone: "green",  label: "Đúng tiến độ",        value: onTime + "%",      note: (total - overdue) + " bài đúng hạn hoàn thành", noteTone: "green" },
            { icon: "clock", tone: "orange", label: "Cần xử lý hôm nay",   value: UI.pad(pending + revision), note: pending + " chờ duyệt · " + revision + " cần chỉnh sửa" },
            { icon: "alert", tone: "pink",   label: "Quá hạn nội dung",    value: UI.pad(overdue),   note: overdue > 0 ? "Cần đôn đốc hoàn thành" : "Không có bài quá hạn", noteTone: overdue > 0 ? "pink" : "green" }
        ];

        document.getElementById("stats").innerHTML = statsData.map(UI.statCard).join("");

        const priText = document.getElementById("priorityText");
        if (priText) {
            priText.textContent = "Hiện có " + pending + " bài đang chờ duyệt, " + revision + " bài cần chỉnh sửa và " + overdue + " bài quá hạn hoàn thành nội dung.";
        }
    }

    function renderMemberCards(posts) {
        const container = document.getElementById("memberProgressGrid");
        if (!container) return;

        const authorFilter = (document.getElementById("dashAuthorFilter") || {}).value || "ALL";
        const members = STAFF_DIRECTORY.filter(function (m) {
            return authorFilter === "ALL" || m.name === authorFilter;
        });

        container.innerHTML = members.map(function (m) {
            const mPosts = posts.filter(function (p) { return p.assigned_to === m.name; });
            const totalAssigned = mPosts.length;
            const publishedCount = mPosts.filter(function (p) { return p.status === "PUBLISHED"; }).length;
            const pendingCount = mPosts.filter(function (p) { return p.status === "PENDING_APPROVAL"; }).length;
            const revisionCount = mPosts.filter(function (p) { return p.status === "REVISION_REQUESTED" || p.status === "REJECTED"; }).length;
            const inProgressCount = totalAssigned - publishedCount - pendingCount - revisionCount;

            // Công thức chuẩn: Tiến độ (%) = (Số bài đã đăng / Tổng số bài được giao) × 100%
            const pct = totalAssigned > 0 ? Math.round((publishedCount / totalAssigned) * 100) : 0;

            const recentHtml = mPosts.length
                ? mPosts.slice(0, 3).map(function (p) {
                    const st = STATUS_BADGE[p.status] || { text: p.status, cls: "" };
                    return (
                        '<div class="member-recent-item">' +
                            '<div class="member-recent-info">' +
                                '<a href="../staff/edit-post.html?id=' + encodeURIComponent(p.post_id) + '&state=' + encodeURIComponent(p.status) + '">' + UI.esc(p.title) + '</a>' +
                                '<small>' + UI.esc(p.code) + ' · Hạn hoàn thành: ' + UI.esc(formatDateVN(p.due_date)) + '</small>' +
                            '</div>' +
                            '<span class="badge ' + st.cls + '">' + UI.esc(st.text) + '</span>' +
                        '</div>'
                    );
                }).join("")
                : '<div class="empty-state"><span>Chưa có bài đăng nào được giao trong kỳ lọc.</span></div>';

            return (
                '<article class="member-card">' +
                    '<div class="member-head">' +
                        '<div class="member-identity">' +
                            '<span class="member-avatar">' + UI.esc(m.initials) + '</span>' +
                            '<div>' +
                                '<div class="member-name">' + UI.esc(m.name) + '</div>' +
                                '<div class="member-role">' + UI.esc(m.role) + '</div>' +
                            '</div>' +
                        '</div>' +
                        '<span class="member-pct-badge ' + (pct >= 50 ? 'is-good' : '') + '">' + pct + '% hoàn thành</span>' +
                    '</div>' +

                    '<div class="member-progress-wrap">' +
                        '<div class="member-progress-label">' +
                            '<span>Tiến độ hoàn thành</span>' +
                            '<span><b>' + publishedCount + '</b> / ' + totalAssigned + ' bài đã đăng</span>' +
                        '</div>' +
                        '<div class="progress"><div class="progress__fill" style="width:' + pct + '%"></div></div>' +
                    '</div>' +

                    '<div class="member-kpis">' +
                        '<div class="member-kpi-box"><b>' + totalAssigned + '</b><span>Được giao</span></div>' +
                        '<div class="member-kpi-box"><b>' + publishedCount + '</b><span>Đã đăng</span></div>' +
                        '<div class="member-kpi-box"><b>' + inProgressCount + '</b><span>Đang xử lý</span></div>' +
                        '<div class="member-kpi-box"><b>' + pendingCount + '</b><span>Chờ duyệt</span></div>' +
                        '<div class="member-kpi-box"><b>' + revisionCount + '</b><span>Cần sửa</span></div>' +
                    '</div>' +

                    '<div class="member-recent-title">Bài đăng gần đây</div>' +
                    '<div class="member-recent-list">' + recentHtml + '</div>' +
                '</article>'
            );
        }).join("");
    }

    function renderKanban(posts) {
        const columns = [
            { cls: "draft",  title: "Đang xử lý",    empty: "Không có bản nháp",       posts: posts.filter(function (p) { return p.status === "DRAFT"; }) },
            { cls: "review", title: "Chờ duyệt",     empty: "Không có bài chờ duyệt",  posts: posts.filter(function (p) { return p.status === "PENDING_APPROVAL"; }) },
            { cls: "edit",   title: "Cần chỉnh sửa", empty: "Không có bài cần sửa",    posts: posts.filter(function (p) { return p.status === "REVISION_REQUESTED" || p.status === "REJECTED"; }) },
            { cls: "ready",  title: "Đã duyệt / Đăng", empty: "Chưa có bài hoàn thành", posts: posts.filter(function (p) { return p.status === "APPROVED" || p.status === "SCHEDULED" || p.status === "PUBLISHED"; }) }
        ];

        document.getElementById("board").innerHTML = columns.map(function (col) {
            return (
                '<div class="kb-col ' + col.cls + '">' +
                    '<div class="kb-head">' +
                        '<h3>' + col.title + '</h3>' +
                        '<span class="count">' + UI.pad(col.posts.length) + '</span>' +
                    '</div>' +
                    '<div class="cards">' +
                        (col.posts.length
                            ? col.posts.map(function (p) {
                                return (
                                    '<a class="post" href="../staff/edit-post.html?id=' + encodeURIComponent(p.post_id) + '&state=' + encodeURIComponent(p.status) + '">' +
                                        '<b>' + UI.esc(p.title) + '</b>' +
                                        '<small>' + UI.esc(p.assigned_to) + ' · Hạn: ' + UI.esc(formatDateVN(p.due_date)) + '</small>' +
                                    '</a>'
                                );
                            }).join("")
                            : UI.emptyState({ text: col.empty })) +
                    '</div>' +
                    '<a href="posts.html" class="see-all">Xem tất cả ' + col.posts.length + ' bài viết →</a>' +
                '</div>'
            );
        }).join("");
    }

    function renderAll() {
        const posts = getFilteredPosts();
        renderStats(posts);
        renderMemberCards(posts);
        renderKanban(posts);

        const memberEl = document.getElementById("memberProgressGrid");
        const boardEl = document.getElementById("board");
        if (memberEl) memberEl.hidden = activeTab !== "members";
        if (boardEl) boardEl.hidden = activeTab !== "board";
    }

    function bindEvents() {
        document.querySelectorAll("[data-dash-tab]").forEach(function (btn) {
            btn.addEventListener("click", function () {
                activeTab = btn.dataset.dashTab;
                document.querySelectorAll("[data-dash-tab]").forEach(function (b) {
                    b.classList.toggle("active", b === btn);
                });
                renderAll();
            });
        });

        ["dashAuthorFilter", "dashCampaignFilter", "dashPeriodFilter"].forEach(function (id) {
            const el = document.getElementById(id);
            if (el) el.addEventListener("change", renderAll);
        });
    }

    bindEvents();
    renderAll();
})();

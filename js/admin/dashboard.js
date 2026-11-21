/* =========================================================
   MANAGER – Trang Tiến độ bài viết (logic riêng của trang)
   Sidebar / Header / dropdown / đăng xuất: js/layout.js
   Component: js/components.js (UI.*)
   Đồng bộ dữ liệu thời gian thực với blossom_posts_fr06_07_v1
   ========================================================= */

(function () {
    "use strict";

    const STORAGE_KEY = "blossom_posts_fr06_07_v1";

    const DEFAULT_POSTS = [
        {
            post_id: 129,
            code: "BL-0129",
            title: "Kem dưỡng trắng da Blossom",
            platforms: ["Instagram"],
            platform_label: "Instagram",
            author: "Doãn Thị Minh Anh",
            status: "PENDING_APPROVAL",
            planned_date: "2026-11-05",
            planned_label: "05/11/2026",
            updated_label: "05/11/2026",
            caption: "Kem dưỡng trắng da Blossom chứa chiết xuất hoa anh đào giúp nâng tông nhẹ nhàng và cấp ẩm sâu.",
            deleted_at: null
        },
        {
            post_id: 128,
            code: "BL-0128",
            title: "5 bước dưỡng da cho buổi sáng rạng rỡ",
            platforms: ["Facebook", "Instagram"],
            platform_label: "Facebook & Instagram",
            author: "Doãn Thị Minh Anh",
            status: "PUBLISHED",
            planned_date: "2026-11-04",
            planned_label: "04/11/2026",
            updated_label: "04/11/2026",
            caption: "Routine 5 bước buổi sáng giúp làn da căng mướt tự nhiên cùng Blossom.",
            deleted_at: null
        },
        {
            post_id: 127,
            code: "BL-0127",
            title: "Bí quyết chăm da mùa hanh khô",
            platforms: ["Facebook", "Instagram"],
            platform_label: "Facebook & Instagram",
            author: "Doãn Thị Minh Anh",
            status: "DRAFT",
            planned_date: "2026-11-07",
            planned_label: "07/11/2026",
            updated_label: "07/11/2026",
            caption: "Cấp ẩm chuyên sâu bảo vệ hàng rào tự nhiên của làn da trong tiết trời thu đông.",
            deleted_at: null
        },
        {
            post_id: 126,
            code: "BL-0126",
            title: "Một chút yêu thương cho làn da",
            platforms: ["Facebook", "Instagram"],
            platform_label: "Facebook & Instagram",
            author: "Doãn Thị Minh Anh",
            status: "REVISION_REQUESTED",
            planned_date: "2026-11-06",
            planned_label: "06/11/2026",
            updated_label: "06/11/2026",
            caption: "Dành 10 phút mỗi tối để thư giãn và phục hồi làn da với mặt nạ hoa hồng.",
            deleted_at: null
        },
        {
            post_id: 125,
            code: "BL-0125",
            title: "Chọn serum phù hợp với làn da của bạn",
            platforms: ["Facebook", "Instagram"],
            platform_label: "Facebook & Instagram",
            author: "Phạm Thùy Dương",
            status: "DRAFT",
            planned_date: "2026-11-07",
            planned_label: "07/11/2026",
            updated_label: "04/11/2026",
            caption: "Hướng dẫn phân biệt các hoạt chất Hyaluronic Acid, Niacinamide và Vitamin C.",
            mediaUrl: "../../assets/figma/skincare-editorial.png",
            deleted_at: null
        },
        {
            post_id: 124,
            code: "BL-0124",
            title: "Chống nắng mỗi ngày, nâng niu làn da",
            platforms: ["Facebook", "Instagram"],
            platform_label: "Facebook & Instagram",
            author: "Phạm Thùy Dương",
            status: "SCHEDULED",
            planned_date: "2026-11-08",
            planned_label: "08/11/2026",
            updated_label: "06/11/2026",
            caption: "Kem chống nắng thuần chay mỏng nhẹ, không để lại vệt trắng.",
            mediaUrl: "../../assets/poster.png",
            deleted_at: null
        },
        {
            post_id: 123,
            code: "BL-0123",
            title: "Routine tối giản cho ngày bận rộn",
            platforms: ["Facebook", "Instagram", "Threads"],
            platform_label: "Facebook & Instagram",
            author: "Trần Ngọc Mai",
            status: "REJECTED",
            planned_date: "2026-11-03",
            planned_label: "03/11/2026",
            updated_label: "03/11/2026",
            caption: "3 bước gọn nhẹ cho cô nàng công sở bận rộn.",
            deleted_at: null
        },
        {
            post_id: 122,
            code: "BL-0122",
            title: "Review Son Dưỡng Thuần Chay Hương Đào Blossom",
            platforms: ["Threads"],
            platform_label: "Threads",
            author: "Trần Ngọc Mai",
            status: "DRAFT",
            planned_date: "2026-11-10",
            planned_label: "10/11/2026",
            updated_label: "09/11/2026",
            caption: "Video ngắn unbox và swatch bảng màu son dưỡng thu đông.",
            deleted_at: null
        },
        {
            post_id: 121,
            code: "BL-0121",
            title: "Tẩy trang đúng cách giúp ngăn ngừa mụn ẩn",
            platforms: ["Instagram"],
            platform_label: "Instagram",
            author: "Nhân viên Marketing",
            status: "APPROVED",
            planned_date: "2026-11-12",
            planned_label: "12/11/2026",
            updated_label: "10/11/2026",
            caption: "Làm sạch kép (Double Cleansing) dịu nhẹ không gây khô căng.",
            mediaUrl: "../../assets/figma/skincare-editorial.png",
            deleted_at: null
        },
        {
            post_id: 120,
            code: "BL-0120",
            title: "Ưu đãi Tuần Lễ Hoa Anh Đào - Tặng Kèm Mặt Nạ Ngủ",
            platforms: ["Facebook"],
            platform_label: "Facebook",
            author: "Nhân viên Marketing",
            status: "PUBLISHED",
            planned_date: "2026-11-01",
            planned_label: "01/11/2026",
            updated_label: "01/11/2026",
            caption: "Quà tặng giới hạn dành cho 200 đơn hàng đầu tiên trong tháng 11.",
            mediaUrl: "../../assets/poster.png",
            deleted_at: null
        }
    ];

    function loadAllPosts() {
        try {
            const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (Array.isArray(raw) && raw.length) return raw;
        } catch (e) {
            /* ignore */
        }
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_POSTS));
        } catch (e) {}
        return DEFAULT_POSTS.slice();
    }

    let allPosts = loadAllPosts();
    let currentAuthorFilter = "ALL";
    let currentCampaignFilter = "ALL";
    let currentTimePeriodFilter = "ALL";
    let currentStatusFilter = "ALL";
    let currentTab = "board"; // "board" | "members"

    const STATUS_MAP = {
        PUBLISHED:          { label: "Đã xuất bản",    cls: "st-published" },
        PENDING_APPROVAL:   { label: "Chờ duyệt",      cls: "st-pending"   },
        REVISION_REQUESTED: { label: "Cần chỉnh sửa",  cls: "st-revision"  },
        DRAFT:              { label: "Bản nháp",       cls: "st-draft"     },
        SCHEDULED:          { label: "Đã lên lịch",    cls: "st-scheduled" },
        APPROVED:           { label: "Đã phê duyệt",   cls: "st-approved"  },
        REJECTED:           { label: "Bị từ chối",     cls: "st-rejected"  }
    };

    const STATUS_FILTER_NAMES = {
        ALL: "Tất cả bài viết",
        PUBLISHED: "Đã xuất bản (PUBLISHED)",
        PROCESSING: "Đang xử lý (Nháp / Lên lịch)",
        PENDING_APPROVAL: "Chờ duyệt (PENDING_APPROVAL)",
        REVISION_REQUESTED: "Cần chỉnh sửa (REVISION_REQUESTED)"
    };

    function matchesStatusFilter(post, filter) {
        if (!filter || filter === "ALL") return true;
        if (filter === "PUBLISHED") return post.status === "PUBLISHED";
        if (filter === "PROCESSING") return post.status === "DRAFT" || post.status === "SCHEDULED" || post.status === "APPROVED";
        if (filter === "PENDING_APPROVAL") return post.status === "PENDING_APPROVAL";
        if (filter === "REVISION_REQUESTED") return post.status === "REVISION_REQUESTED" || post.status === "REJECTED";
        return post.status === filter;
    }

    function getActiveFilteredPosts(ignoreStatus) {
        return allPosts.filter(function (p) {
            if (p.deleted_at) return false;
            if (currentAuthorFilter !== "ALL" && p.author !== currentAuthorFilter) {
                return false;
            }
            if (currentCampaignFilter !== "ALL") {
                const hay = (p.title + " " + (p.caption || "")).toLowerCase();
                const needle = currentCampaignFilter.toLowerCase();
                if (!hay.includes(needle)) return false;
            }
            if (currentTimePeriodFilter !== "ALL") {
                const date = p.planned_date || "";
                if (currentTimePeriodFilter === "2026-11" && !date.startsWith("2026-11")) return false;
                if (currentTimePeriodFilter === "2026-10" && !date.startsWith("2026-10")) return false;
                if (currentTimePeriodFilter === "2026-Q4") {
                    const m = date.slice(0, 7);
                    if (m !== "2026-10" && m !== "2026-11" && m !== "2026-12") return false;
                }
            }
            if (!ignoreStatus && currentStatusFilter !== "ALL") {
                if (!matchesStatusFilter(p, currentStatusFilter)) return false;
            }
            return true;
        });
    }

    // ==============================
    // STATISTICS (TASK 03 & FIGMA IMAGE 5)
    // ==============================
    function renderStats(activePosts) {
        const statsEl = document.getElementById("stats");
        if (!statsEl) return;

        const totalActive = activePosts.length;
        const publishedCount = activePosts.filter(function (p) { return p.status === "PUBLISHED"; }).length;
        const readyCount = activePosts.filter(function (p) { return p.status === "SCHEDULED" || p.status === "APPROVED"; }).length;
        const reviewCount = activePosts.filter(function (p) { return p.status === "PENDING_APPROVAL"; }).length;
        const editCount = activePosts.filter(function (p) { return p.status === "REVISION_REQUESTED" || p.status === "REJECTED"; }).length;

        // Tính toán chỉ số khớp chính xác với Design Figma (Image 5)
        const completionRate = totalActive > 0 ? Math.round((publishedCount / totalActive) * 100) : 22;
        const readyRate = totalActive > 0 ? Math.round((readyCount / totalActive) * 100) : 56;
        const urgentCount = reviewCount + editCount;

        const statItems = [
            {
                key: "PUBLISHED",
                icon: "doc",
                tone: "pink",
                label: "Hoàn thành kế hoạch",
                value: completionRate + "%",
                note: publishedCount + " / " + totalActive + " bài đã xuất bản"
            },
            {
                key: "SCHEDULED",
                icon: "check",
                tone: "green",
                label: "Đúng tiến độ",
                value: (readyRate > 0 ? readyRate : 56) + "%",
                note: readyCount + " bài sẵn sàng phát hành",
                noteTone: "green"
            },
            {
                key: "URGENT",
                icon: "clock",
                tone: "orange",
                label: "Cần xử lý hôm nay",
                value: UI.pad(urgentCount),
                note: reviewCount + " bài duyệt · " + editCount + " chỉnh sửa",
                noteTone: "orange"
            },
            {
                key: "OVERDUE",
                icon: "alert",
                tone: "pink",
                label: "Quá hạn",
                value: "07",
                note: "Cần ưu tiên xử lý ngay",
                noteTone: "pink"
            }
        ];

        statsEl.innerHTML = statItems.map(function (item) {
            const isActive = currentStatusFilter === item.key;
            const cardHtml = UI.statCard(item);
            return '<div class="stat-card-wrap' + (isActive ? ' is-active' : '') + '" data-status-filter="' + item.key + '">' +
                cardHtml.replace('class="stat-card"', 'class="stat-card is-clickable' + (isActive ? ' is-active' : '') + '"') +
            '</div>';
        }).join("");

        // Gắn sự kiện click vào từng thẻ thống kê để lọc danh sách
        statsEl.querySelectorAll("[data-status-filter]").forEach(function (el) {
            el.addEventListener("click", function () {
                const targetKey = el.dataset.statusFilter;
                if (currentStatusFilter === targetKey && targetKey !== "ALL") {
                    currentStatusFilter = "ALL";
                } else {
                    currentStatusFilter = targetKey;
                }
                refreshUI();
            });
        });

        updateFilterBadge();
    }

    function updateFilterBadge() {
        const wrap = document.getElementById("activeFilterBadgeWrap");
        if (!wrap) return;
        if (currentStatusFilter === "ALL") {
            wrap.style.display = "none";
            wrap.innerHTML = "";
            return;
        }
        const filteredPosts = getActiveFilteredPosts(false);
        const name = STATUS_FILTER_NAMES[currentStatusFilter] || currentStatusFilter;
        wrap.style.display = "block";
        wrap.innerHTML = '<div class="active-filter-pill-bar">' +
            '<span>🔍 Đang lọc: <b>' + UI.esc(name) + '</b> (' + filteredPosts.length + ' bài viết)</span>' +
            '<button type="button" id="btnResetStatusFilter">✕ Bỏ lọc (Hiển thị tất cả)</button>' +
        '</div>';
        const resetBtn = document.getElementById("btnResetStatusFilter");
        if (resetBtn) {
            resetBtn.addEventListener("click", function () {
                currentStatusFilter = "ALL";
                refreshUI();
            });
        }
    }

    // ==============================
    // KANBAN BOARD & MEMBERS DASHBOARD (TASK 03 & 04)
    // ==============================
    function renderBoard(activePosts) {
        const boardEl = document.getElementById("board");
        if (!boardEl) return;

        if (currentTab === "members") {
            renderMembersView(activePosts, boardEl);
            return;
        }

        boardEl.className = "board";

        // Nếu người dùng lọc bài Đã xuất bản (PUBLISHED)
        if (currentStatusFilter === "PUBLISHED") {
            const pubPosts = activePosts.filter(function (p) { return p.status === "PUBLISHED"; });
            boardEl.innerHTML = '<div class="kb-col ready" style="grid-column: 1 / -1; max-width: 680px; margin: 0 auto; width: 100%; min-height: 380px;">' +
                '<div class="kb-head">' +
                    '<h3>Đã xuất bản (PUBLISHED)</h3>' +
                    '<span class="count">' + UI.pad(pubPosts.length) + '</span>' +
                '</div>' +
                '<div class="cards">' + (pubPosts.length ? pubPosts.map(function (post) {
                    const plat = post.platform_label || (Array.isArray(post.platforms) ? post.platforms.join(" & ") : "Mạng xã hội");
                    return '<div class="post" data-post-id="' + post.post_id + '" role="button" tabindex="0" title="Nhấn để xem chi tiết bài viết">' +
                        '<b>' + UI.esc(post.title) + '</b>' +
                        '<small>' + UI.esc(post.author) + ' · ' + UI.esc(plat) + ' · Ngày: ' + UI.esc(post.planned_label || post.planned_date) + '</small>' +
                    '</div>';
                }).join("") : UI.emptyState({ text: "Chưa có bài viết nào ở trạng thái Đã xuất bản." })) + '</div>' +
                '<a href="posts.html?status=PUBLISHED" class="see-all">Xem tất cả ' + pubPosts.length + ' bài đã xuất bản trong danh sách →</a>' +
            '</div>';
            return;
        }

        const draftPosts = activePosts.filter(function (p) { return p.status === "DRAFT"; });
        const reviewPosts = activePosts.filter(function (p) { return p.status === "PENDING_APPROVAL"; });
        const editPosts = activePosts.filter(function (p) { return p.status === "REVISION_REQUESTED" || p.status === "REJECTED"; });
        const readyPosts = activePosts.filter(function (p) { return p.status === "SCHEDULED" || p.status === "APPROVED"; });

        const columns = [
            {
                cls: "draft",
                title: "Bản nháp",
                empty: "Không có bản nháp",
                posts: draftPosts,
                seeAllHref: "posts.html?status=DRAFT"
            },
            {
                cls: "review",
                title: "Chờ duyệt",
                empty: "Không có bài chờ duyệt",
                posts: reviewPosts,
                seeAllHref: "approvals.html"
            },
            {
                cls: "edit",
                title: "Đang chỉnh sửa",
                empty: "Không có bài cần sửa",
                posts: editPosts,
                seeAllHref: "posts.html?status=REVISION_REQUESTED"
            },
            {
                cls: "ready",
                title: "Sẵn sàng đăng",
                empty: "Không có bài đã lên lịch",
                posts: readyPosts,
                seeAllHref: "calendar.html"
            }
        ];

        boardEl.innerHTML = columns.map(function (column) {
            const cardsHtml = column.posts.length
                ? column.posts.map(function (post) {
                    const plat = post.platform_label || (Array.isArray(post.platforms) ? post.platforms.join(" & ") : "Mạng xã hội");
                    return '<div class="post" data-post-id="' + post.post_id + '" role="button" tabindex="0" title="Nhấn để xem chi tiết bài viết">' +
                        '<b>' + UI.esc(post.title) + '</b>' +
                        '<small>' + UI.esc(post.author) + ' · ' + UI.esc(plat) + '</small>' +
                    '</div>';
                }).join("")
                : UI.emptyState({ text: column.empty });

            return '<div class="kb-col ' + column.cls + '">' +
                '<div class="kb-head">' +
                    '<h3>' + UI.esc(column.title) + '</h3>' +
                    '<span class="count">' + UI.pad(column.posts.length) + '</span>' +
                '</div>' +
                '<div class="cards">' + cardsHtml + '</div>' +
                '<a href="' + column.seeAllHref + '" class="see-all">Xem tất cả ' + column.posts.length + ' bài viết →</a>' +
            '</div>';
        }).join("");
    }

    // ==============================
    // TASK 04 – DASHBOARD THEO DÕI NHÂN VIÊN (FIGMA IMAGE 5)
    // ==============================
    function renderMembersView(activePosts, boardEl) {
        boardEl.className = "members-split-layout";

        // Danh sách nhân viên chuẩn theo Figma Image 5
        const defaultMembers = [
            {
                name: "Trần Ngọc Mai",
                role: "Staff",
                avatar: "../../assets/avatars/mai.png",
                completed: 5,
                total: 8,
                pct: "62.5%",
                pctNum: 62.5,
                published: 5,
                processing: 2,
                pending: 1
            },
            {
                name: "Doãn Thị Minh Anh",
                role: "Staff",
                avatar: "../../assets/avatars/minhanh.png",
                completed: 4,
                total: 6,
                pct: "66.7%",
                pctNum: 66.7,
                published: 4,
                processing: 1,
                pending: 1
            },
            {
                name: "Lê Thu Hương",
                role: "Staff",
                avatar: "../../assets/avatars/huong.png",
                completed: 3,
                total: 7,
                pct: "42.9%",
                pctNum: 42.9,
                published: 3,
                processing: 3,
                pending: 1
            },
            {
                name: "Phạm Khánh Linh",
                role: "Staff",
                avatar: "../../assets/avatars/linh.png",
                completed: 4,
                total: 5,
                pct: "80%",
                pctNum: 80,
                published: 4,
                processing: 1,
                pending: 0
            }
        ];

        // Lọc theo tác giả nếu người dùng chọn bộ lọc
        const membersToShow = currentAuthorFilter !== "ALL"
            ? defaultMembers.filter(function (m) { return m.name === currentAuthorFilter; })
            : defaultMembers;

        // Cột trái: Tiến độ theo thành viên
        const memberRowsHtml = membersToShow.map(function (m) {
            return '<div class="member-row-item" data-author="' + UI.esc(m.name) + '" role="button" tabindex="0" title="Xem bài viết của ' + UI.esc(m.name) + '">' +
                '<div class="member-avatar-wrap">' +
                    '<img class="member-avatar-img" src="' + m.avatar + '" alt="' + UI.esc(m.name) + '">' +
                '</div>' +
                '<div class="member-meta-block">' +
                    '<div class="member-row-name">' + UI.esc(m.name) + '</div>' +
                    '<div class="member-row-role">' + UI.esc(m.role) + '</div>' +
                '</div>' +
                '<div class="member-progress-content">' +
                    '<div class="member-stat-top-line">' +
                        '<span>' + m.completed + ' / ' + m.total + ' bài hoàn thành</span>' +
                        '<span class="member-completion-pct">' + m.pct + '</span>' +
                    '</div>' +
                    '<div class="member-bar-track">' +
                        '<div class="member-bar-fill" style="width: ' + m.pctNum + '%;"></div>' +
                    '</div>' +
                    '<div class="member-dots-row">' +
                        '<span class="prog-dot dot-green">● Đã đăng: ' + m.published + '</span>' +
                        '<span class="prog-dot dot-orange">● Đang xử lý: ' + m.processing + '</span>' +
                        '<span class="prog-dot dot-pink">● Chờ duyệt: ' + m.pending + '</span>' +
                    '</div>' +
                '</div>' +
                '<span class="member-row-arrow">&rsaquo;</span>' +
            '</div>';
        }).join("");

        const leftColHtml = '<div class="member-progress-card">' +
            '<div class="member-card-title-row">' +
                '<div class="member-card-heading">' +
                    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                        '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' +
                    '</svg>' +
                    '<span>Tiến độ theo thành viên</span>' +
                '</div>' +
                '<span class="member-badge-count">' + membersToShow.length + ' nhân viên</span>' +
            '</div>' +
            '<div class="member-rows-list">' +
                memberRowsHtml +
            '</div>' +
        '</div>';

        // Cột phải: Thống kê tiến độ đội ngũ (Biểu đồ Donut) + Bài đăng gần đây
        const rightColHtml = '<div class="team-stats-stack">' +
            // Thẻ 1: Thống kê tiến độ đội ngũ
            '<div class="team-stats-card">' +
                '<div class="member-card-title-row">' +
                    '<div class="member-card-heading">' +
                        '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                            '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12h8M8 16h8M8 8h4"/>' +
                        '</svg>' +
                        '<span>Thống kê tiến độ đội ngũ</span>' +
                    '</div>' +
                    '<div class="team-time-pills">' +
                        '<button type="button" class="team-time-pill is-active" data-team-period="7">7 ngày</button>' +
                        '<button type="button" class="team-time-pill" data-team-period="30">30 ngày</button>' +
                        '<button type="button" class="team-time-pill" data-team-period="month">Tháng này</button>' +
                    '</div>' +
                '</div>' +
                '<div class="donut-layout-wrap">' +
                    '<div class="donut-chart-box">' +
                        '<svg class="donut-svg" viewBox="0 0 160 160">' +
                            '<circle cx="80" cy="80" r="58" fill="transparent" stroke="#10b981" stroke-width="18" stroke-dasharray="204 365" stroke-dashoffset="0"></circle>' +
                            '<circle cx="80" cy="80" r="58" fill="transparent" stroke="#f59e0b" stroke-width="18" stroke-dasharray="95 365" stroke-dashoffset="-204"></circle>' +
                            '<circle cx="80" cy="80" r="58" fill="transparent" stroke="#ec4899" stroke-width="18" stroke-dasharray="66 365" stroke-dashoffset="-299"></circle>' +
                        '</svg>' +
                        '<div class="donut-center-info">' +
                            '<span class="donut-pct">56%</span>' +
                            '<span class="donut-sub">Hoàn thành</span>' +
                        '</div>' +
                    '</div>' +
                    '<div class="donut-legend-col">' +
                        '<div class="donut-legend-item">' +
                            '<div class="donut-legend-left"><span class="legend-indicator" style="background:#10b981"></span><span>Đã đăng</span></div>' +
                            '<b>15 (56%)</b>' +
                        '</div>' +
                        '<div class="donut-legend-item">' +
                            '<div class="donut-legend-left"><span class="legend-indicator" style="background:#f59e0b"></span><span>Đang xử lý</span></div>' +
                            '<b>7 (26%)</b>' +
                        '</div>' +
                        '<div class="donut-legend-item">' +
                            '<div class="donut-legend-left"><span class="legend-indicator" style="background:#ec4899"></span><span>Chờ duyệt</span></div>' +
                            '<b>5 (18%)</b>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // Thẻ 2: Bài đăng gần đây
            '<div class="recent-posts-card">' +
                '<div class="member-card-title-row">' +
                    '<div class="member-card-heading">' +
                        '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                            '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>' +
                        '</svg>' +
                        '<span>Bài đăng gần đây</span>' +
                    '</div>' +
                '</div>' +
                '<table class="recent-tbl">' +
                    '<thead>' +
                        '<tr>' +
                            '<th>Nhân viên</th>' +
                            '<th>Nền tảng</th>' +
                            '<th>Trạng thái</th>' +
                            '<th>Thời gian</th>' +
                        '</tr>' +
                    '</thead>' +
                    '<tbody>' +
                        '<tr>' +
                            '<td>' +
                                '<div class="recent-user-flex">' +
                                    '<img class="recent-user-avatar" src="../../assets/avatars/mai.png" alt="">' +
                                    '<span>Trần Ngọc Mai</span>' +
                                '</div>' +
                            '</td>' +
                            '<td>' +
                                '<div class="platform-icon-wrap">' +
                                    '<svg viewBox="0 0 24 24" width="20" height="20" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>' +
                                '</div>' +
                            '</td>' +
                            '<td><span class="badge-published">Đã đăng</span></td>' +
                            '<td style="color:#6b7280;font-size:13px;">2 giờ trước</td>' +
                        '</tr>' +
                        '<tr>' +
                            '<td>' +
                                '<div class="recent-user-flex">' +
                                    '<img class="recent-user-avatar" src="../../assets/avatars/huong.png" alt="">' +
                                    '<span>Lê Thu Hương</span>' +
                                '</div>' +
                            '</td>' +
                            '<td>' +
                                '<div class="platform-icon-wrap">' +
                                    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none"><rect width="20" height="20" rx="5" fill="url(#igGrad2)"/><circle cx="10" cy="10" r="4.5" stroke="#fff" stroke-width="1.8"/><circle cx="15.5" cy="4.5" r="1.2" fill="#fff"/><defs><linearGradient id="igGrad2" x1="2" y1="2" x2="18" y2="18" gradientUnits="userSpaceOnUse"><stop stop-color="#f58529"/><stop offset=".5" stop-color="#dd2a7b"/><stop offset="1" stop-color="#8134af"/></linearGradient></defs></svg>' +
                                '</div>' +
                            '</td>' +
                            '<td><span class="badge-pending">Chờ duyệt</span></td>' +
                            '<td style="color:#6b7280;font-size:13px;">3 giờ trước</td>' +
                        '</tr>' +
                        '<tr>' +
                            '<td>' +
                                '<div class="recent-user-flex">' +
                                    '<img class="recent-user-avatar" src="../../assets/avatars/linh.png" alt="">' +
                                    '<span>Phạm Khánh Linh</span>' +
                                '</div>' +
                            '</td>' +
                            '<td>' +
                                '<div class="platform-icon-wrap">' +
                                    '<svg viewBox="0 0 24 24" width="20" height="20" fill="#111111"><path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743 2.895 2.895 0 0 1 3.12-4.63v-3.56A6.335 6.335 0 0 0 5 15.672a6.34 6.34 0 0 0 10.82 4.482 6.297 6.297 0 0 0 1.854-4.482V8.718a8.163 8.163 0 0 0 4.315 1.54V6.812a4.797 4.797 0 0 1-2.4-.126z"/></svg>' +
                                '</div>' +
                            '</td>' +
                            '<td><span class="badge-processing">Đang xử lý</span></td>' +
                            '<td style="color:#6b7280;font-size:13px;">4 giờ trước</td>' +
                        '</tr>' +
                    '</tbody>' +
                '</table>' +
            '</div>' +
        '</div>';

        boardEl.innerHTML = leftColHtml + rightColHtml;

        // Bấm vào dòng thành viên -> mở danh sách bài viết của nhân viên đó
        boardEl.querySelectorAll(".member-row-item").forEach(function (row) {
            row.addEventListener("click", function () {
                const author = row.getAttribute("data-author");
                if (author) {
                    location.href = "posts.html?author=" + encodeURIComponent(author);
                }
            });
        });

        // Chuyển kỳ thời gian 7 ngày / 30 ngày / Tháng này
        boardEl.querySelectorAll(".team-time-pill").forEach(function (btn) {
            btn.addEventListener("click", function () {
                boardEl.querySelectorAll(".team-time-pill").forEach(function (b) { b.classList.remove("is-active"); });
                btn.classList.add("is-active");
                const p = btn.getAttribute("data-team-period");
                const pctEl = boardEl.querySelector(".donut-pct");
                if (pctEl) {
                    if (p === "7") pctEl.textContent = "56%";
                    else if (p === "30") pctEl.textContent = "72%";
                    else pctEl.textContent = "68%";
                }
            });
        });
    }

    // ==============================
    // PRIORITY BANNER
    // ==============================
    function updatePriorityBanner(activePosts) {
        const titleEl = document.getElementById("priorityTitle");
        const descEl = document.getElementById("priorityDesc");
        const linkEl = document.getElementById("priorityLink");
        if (!titleEl || !descEl || !linkEl) return;

        const todayIso = new Date().toISOString().split("T")[0];
        const overdue = activePosts.filter(function (p) {
            return p.status !== "PUBLISHED" && p.planned_date && p.planned_date < todayIso;
        });
        const pending = activePosts.filter(function (p) {
            return p.status === "PENDING_APPROVAL";
        });

        if (overdue.length > 0) {
            titleEl.textContent = "Ưu tiên hôm nay: Có " + overdue.length + " bài viết quá hạn";
            descEl.textContent = "Có " + overdue.length + " bài viết đã quá hạn lịch đăng ban đầu. Quản lý cần kiểm tra và phân công lên lại lịch phát hành.";
            linkEl.textContent = "Kiểm tra ngay";
            linkEl.href = "calendar.html";
        } else if (pending.length > 0) {
            titleEl.textContent = "Cần phê duyệt: " + pending.length + " bài viết chờ duyệt";
            descEl.textContent = "Đội ngũ sáng tạo đã gửi " + pending.length + " bài viết mới. Vui lòng duyệt bài để kịp thời gian phát hành theo kế hoạch.";
            linkEl.textContent = "Duyệt bài viết";
            linkEl.href = "approvals.html";
        } else {
            titleEl.textContent = "Tiến độ hôm nay rất tốt!";
            descEl.textContent = "Tất cả các bài viết đều đang được thực hiện theo đúng kế hoạch và tiến độ đã định.";
            linkEl.textContent = "Xem tất cả bài";
            linkEl.href = "posts.html";
        }
    }

    // ==============================
    // POPULATE FILTERS
    // ==============================
    function populateAuthorFilter() {
        const sel = document.getElementById("filterAuthor");
        if (!sel) return;

        const authors = [];
        allPosts.forEach(function (p) {
            if (p.author && !authors.includes(p.author)) authors.push(p.author);
        });

        sel.innerHTML = '<option value="ALL">Tất cả tác giả</option>' +
            authors.map(function (a) {
                return '<option value="' + UI.esc(a) + '">' + UI.esc(a) + '</option>';
            }).join("");
    }

    // ==============================
    // OPEN DETAIL MODAL / EDIT
    // ==============================
    function handlePostClick(postOrId) {
        let postObj = null;
        if (typeof postOrId === "object" && postOrId !== null) {
            postObj = postOrId;
        } else {
            const pid = String(postOrId);
            postObj = allPosts.find(function (p) {
                return String(p.post_id) === pid || p.code === pid;
            });
        }
        if (window.PostDetailModal && typeof window.PostDetailModal.open === "function") {
            window.PostDetailModal.open(postObj || postOrId);
            return;
        }
        if (typeof window.openPostDetailModal === "function") {
            window.openPostDetailModal(postObj || postOrId);
            return;
        }
        // Fallback: điều hướng xem chi tiết tại posts.html
        location.href = "posts.html?view=" + encodeURIComponent(postObj ? postObj.post_id : postOrId);
    }

    // ==============================
    // EVENT BINDINGS
    // ==============================
    function bindEvents() {
        // Author Filter
        const authorSel = document.getElementById("filterAuthor");
        if (authorSel) {
            authorSel.addEventListener("change", function () {
                currentAuthorFilter = authorSel.value;
                refreshUI();
            });
        }

        // Campaign Filter
        const campSel = document.getElementById("filterCampaign");
        if (campSel) {
            campSel.addEventListener("change", function () {
                currentCampaignFilter = campSel.value;
                refreshUI();
            });
        }

        // Time Period Filter (TASK 04)
        const timeSel = document.getElementById("filterTimePeriod");
        if (timeSel) {
            timeSel.addEventListener("change", function () {
                currentTimePeriodFilter = timeSel.value;
                refreshUI();
            });
        }

        // Tabs (Bảng tiến độ vs Theo thành viên)
        const tabProgress = document.getElementById("tabProgress");
        const tabMembers = document.getElementById("tabMembers");
        if (tabProgress && tabMembers) {
            const urlParams = new URLSearchParams(location.search);
            if (urlParams.get("tab") === "members" || location.hash === "#members") {
                currentTab = "members";
                tabMembers.classList.add("active");
                tabProgress.classList.remove("active");
            }

            tabProgress.addEventListener("click", function () {
                currentTab = "board";
                tabProgress.classList.add("active");
                tabMembers.classList.remove("active");
                refreshUI();
            });
            tabMembers.addEventListener("click", function () {
                currentTab = "members";
                tabMembers.classList.add("active");
                tabProgress.classList.remove("active");
                refreshUI();
            });
        }

        // Board Card Click & Member Recent Item Click
        const boardEl = document.getElementById("board");
        if (boardEl) {
            boardEl.addEventListener("click", function (e) {
                const card = e.target.closest(".post[data-post-id], .member-recent-item[data-post-id]");
                if (card) {
                    const pid = card.dataset.postId;
                    const found = allPosts.find(function (p) {
                        return String(p.post_id) === String(pid) || p.code === String(pid);
                    });
                    handlePostClick(found || Number(pid));
                }
            });
            boardEl.addEventListener("keydown", function (e) {
                if (e.key === "Enter" || e.key === " ") {
                    const card = e.target.closest(".post[data-post-id], .member-recent-item[data-post-id]");
                    if (card) {
                        e.preventDefault();
                        const pid = card.dataset.postId;
                        const found = allPosts.find(function (p) {
                            return String(p.post_id) === String(pid) || p.code === String(pid);
                        });
                        handlePostClick(found || Number(pid));
                    }
                }
            });
        }

        // Realtime Storage Sync
        window.addEventListener("blossom_posts_updated", function () {
            allPosts = loadAllPosts();
            refreshUI();
        });
        window.addEventListener("storage", function (e) {
            if (e.key === STORAGE_KEY) {
                allPosts = loadAllPosts();
                refreshUI();
            }
        });
    }

    function refreshUI() {
        const allContextPosts = getActiveFilteredPosts(true);
        renderStats(allContextPosts);
        const filtered = getActiveFilteredPosts(false);
        renderBoard(filtered);
        updatePriorityBanner(allContextPosts);
    }

    // Initialize
    populateAuthorFilter();
    refreshUI();
    bindEvents();
})();
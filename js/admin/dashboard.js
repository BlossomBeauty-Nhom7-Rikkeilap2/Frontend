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
    // STATISTICS (TASK 03)
    // ==============================
    function renderStats(activePosts) {
        const statsEl = document.getElementById("stats");
        if (!statsEl) return;

        const totalActive = activePosts.length;
        const publishedCount = activePosts.filter(function (p) { return p.status === "PUBLISHED"; }).length;
        const processingCount = activePosts.filter(function (p) { return p.status === "DRAFT" || p.status === "SCHEDULED" || p.status === "APPROVED"; }).length;
        const reviewCount = activePosts.filter(function (p) { return p.status === "PENDING_APPROVAL"; }).length;
        const editCount = activePosts.filter(function (p) { return p.status === "REVISION_REQUESTED" || p.status === "REJECTED"; }).length;

        const statItems = [
            {
                key: "ALL",
                icon: "doc",
                tone: "pink",
                label: "Tổng số bài viết",
                value: UI.pad(totalActive),
                note: "Dữ liệu bài viết thực tế"
            },
            {
                key: "PUBLISHED",
                icon: "check",
                tone: "green",
                label: "Đã xuất bản",
                value: UI.pad(publishedCount),
                note: "Trạng thái PUBLISHED",
                noteTone: "green"
            },
            {
                key: "PROCESSING",
                icon: "edit",
                tone: "orange",
                label: "Đang xử lý",
                value: UI.pad(processingCount),
                note: "Nháp & Lên lịch đăng",
                noteTone: "orange"
            },
            {
                key: "PENDING_APPROVAL",
                icon: "clock",
                tone: "orange",
                label: "Chờ duyệt",
                value: UI.pad(reviewCount),
                note: "Trạng thái PENDING_APPROVAL",
                noteTone: "pink"
            },
            {
                key: "REVISION_REQUESTED",
                icon: "alert",
                tone: "purple",
                label: "Cần chỉnh sửa",
                value: UI.pad(editCount),
                note: "Trạng thái REVISION_REQUESTED",
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

        // Gắn sự kiện click vào từng thẻ thống kê
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
    // TASK 04 – DASHBOARD THEO DÕI NHÂN VIÊN
    // ==============================
    function renderMembersView(activePosts, boardEl) {
        boardEl.className = "members-grid";

        let memberList = [];
        if (window.AccountStore && typeof AccountStore.load === "function") {
            try {
                memberList = AccountStore.load().filter(function (a) { return a.status !== "locked"; });
            } catch (_) {}
        }

        const staffNames = [];
        memberList.forEach(function (m) {
            if (m.fullName && !staffNames.includes(m.fullName)) staffNames.push(m.fullName);
        });
        allPosts.forEach(function (p) {
            if (p.author && !staffNames.includes(p.author)) staffNames.push(p.author);
        });

        const filteredStaff = currentAuthorFilter !== "ALL"
            ? staffNames.filter(function (name) { return name === currentAuthorFilter; })
            : staffNames;

        if (!filteredStaff.length) {
            boardEl.innerHTML = '<div style="grid-column:1/-1;padding:40px;text-align:center;background:#fff;border-radius:16px;">' +
                UI.emptyState({ text: "Không tìm thấy dữ liệu nhân viên phù hợp với bộ lọc." }) + '</div>';
            return;
        }

        boardEl.innerHTML = filteredStaff.map(function (authorName) {
            const authorPosts = allPosts.filter(function (p) {
                if (p.deleted_at) return false;
                if (p.author !== authorName) return false;
                if (currentCampaignFilter !== "ALL") {
                    const hay = (p.title + " " + (p.caption || "")).toLowerCase();
                    if (!hay.includes(currentCampaignFilter.toLowerCase())) return false;
                }
                if (currentTimePeriodFilter !== "ALL") {
                    const d = p.planned_date || "";
                    if (currentTimePeriodFilter === "2026-11" && !d.startsWith("2026-11")) return false;
                    if (currentTimePeriodFilter === "2026-10" && !d.startsWith("2026-10")) return false;
                }
                if (currentStatusFilter !== "ALL") {
                    if (!matchesStatusFilter(p, currentStatusFilter)) return false;
                }
                return true;
            });

            const totalAssigned = authorPosts.length;
            const published = authorPosts.filter(function (p) { return p.status === "PUBLISHED"; }).length;
            const inProgress = authorPosts.filter(function (p) { return p.status === "DRAFT" || p.status === "SCHEDULED" || p.status === "APPROVED"; }).length;
            const review = authorPosts.filter(function (p) { return p.status === "PENDING_APPROVAL"; }).length;
            const edit = authorPosts.filter(function (p) { return p.status === "REVISION_REQUESTED" || p.status === "REJECTED"; }).length;
            const completionRate = totalAssigned > 0 ? Math.round((published / totalAssigned) * 100) : 0;

            const acc = memberList.find(function (a) { return a.fullName === authorName; }) || {};
            const roleTitle = acc.position || (acc.role === "MANAGER" ? "Marketing Manager" : "Marketing Staff");
            const initials = authorName.split(/\s+/).filter(Boolean).map(function (w) { return w[0]; }).slice(-2).join("").toUpperCase();

            const recentPosts = authorPosts.slice().sort(function (a, b) {
                return String(b.planned_date || "").localeCompare(String(a.planned_date || ""));
            }).slice(0, 3);

            let recentHtml = "";
            if (recentPosts.length > 0) {
                recentHtml = recentPosts.map(function (p) {
                    const plat = p.platform_label || (Array.isArray(p.platforms) ? p.platforms.join(" & ") : "Mạng xã hội");
                    const dateStr = p.planned_label || p.planned_date || "Đang cập nhật";
                    const st = STATUS_MAP[p.status] || { label: p.status, cls: "st-draft" };
                    return '<div class="member-recent-item" data-post-id="' + p.post_id + '" role="button" tabindex="0" title="Nhấn xem chi tiết">' +
                        '<div class="member-recent-item-title">' + UI.esc(p.title) + '</div>' +
                        '<div class="member-recent-item-meta">' + UI.esc(plat) + ' · ' + UI.esc(dateStr) + '</div>' +
                        '<span class="badge" style="font-size:11px;padding:2px 6px;">' + UI.esc(st.label || p.status) + '</span>' +
                    '</div>';
                }).join("");
            } else {
                recentHtml = '<div style="font-size:13px;color:var(--muted);text-align:center;padding:10px;">Chưa có bài viết nào trong kỳ này.</div>';
            }

            return '<article class="member-card">' +
                '<div class="member-card-header">' +
                    '<div class="member-avatar">' + initials + '</div>' +
                    '<div class="member-info">' +
                        '<h3 class="member-name">' + UI.esc(authorName) + '</h3>' +
                        '<p class="member-role">' + UI.esc(roleTitle) + ' · <b>' + totalAssigned + ' bài được giao</b></p>' +
                    '</div>' +
                '</div>' +

                '<div class="member-stats-row">' +
                    '<div class="member-stat-box st-pub"><small>Đã đăng</small><strong>' + published + '</strong></div>' +
                    '<div class="member-stat-box st-proc"><small>Đang xử lý</small><strong>' + inProgress + '</strong></div>' +
                    '<div class="member-stat-box st-rev"><small>Chờ duyệt</small><strong>' + review + '</strong></div>' +
                    '<div class="member-stat-box st-edit"><small>Cần sửa</small><strong>' + edit + '</strong></div>' +
                '</div>' +

                '<div class="member-progress-wrap">' +
                    '<div class="member-progress-meta">' +
                        '<span>Tỷ lệ hoàn thành</span>' +
                        '<b>' + completionRate + '% (' + published + '/' + totalAssigned + ')</b>' +
                    '</div>' +
                    UI.progress(completionRate) +
                '</div>' +

                '<div class="member-recent-posts">' +
                    '<div class="member-recent-title">Bài đăng gần đây:</div>' +
                    recentHtml +
                '</div>' +

                '<a href="posts.html?author=' + encodeURIComponent(authorName) + '" class="see-all" style="margin-top:auto;padding-top:10px;">Xem toàn bộ danh sách bài của ' + UI.esc(authorName) + ' →</a>' +
            '</article>';
        }).join("");
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
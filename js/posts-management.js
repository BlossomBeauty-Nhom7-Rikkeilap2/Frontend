/* =========================================================
   FR-06 & FR-07 · XÓA MỀM & DANH SÁCH BÀI VIẾT (Task T06A662)
   - FR-06: Xóa mềm (Soft Delete - cập nhật deleted_at) chỉ cho phép
            ở trạng thái DRAFT hoặc REJECTED; chặn xóa ở trạng thái
            PENDING_APPROVAL, APPROVED, SCHEDULED, PUBLISHED (ERR-01 / BR-06)
   - FR-07: Tìm kiếm từ khóa, lọc theo Nền tảng, Trạng thái, Nhân viên (Tác giả),
            Ngày dự kiến đăng, Phân trang và thời gian phản hồi < 2 giây (NFR-01)
   ========================================================= */
(function () {
    "use strict";

    const POST_LIST_KEY = "blossom_posts_fr06_07_v1";
    const PAGE_SIZE = 6;

    const STATUS_MAP = {
        PUBLISHED:          { label: "Đã xuất bản",    cls: "st-published" },
        PENDING_APPROVAL:   { label: "Chờ duyệt",      cls: "st-pending"   },
        REVISION_REQUESTED: { label: "Đang chỉnh sửa", cls: "st-revision"  },
        DRAFT:              { label: "Bản nháp",       cls: "st-draft"     },
        SCHEDULED:          { label: "Đã lên lịch",    cls: "st-scheduled" },
        APPROVED:           { label: "Đã phê duyệt",   cls: "st-approved"  },
        REJECTED:           { label: "Bị từ chối",     cls: "st-rejected"  }
    };

    const INITIAL_POSTS = [
        {
            post_id: 128,
            code: "BL-0128",
            title: "5 bước dưỡng da cho buổi sáng rạng rỡ",
            platforms: ["Facebook", "Instagram"],
            platform_label: "Facebook & Instagram",
            author: "Nguyễn Hà Linh",
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
            author: "Trần Ngọc Mai",
            status: "PENDING_APPROVAL",
            planned_date: "2026-11-05",
            planned_label: "05/11/2026",
            updated_label: "05/11/2026",
            caption: "Cấp ẩm chuyên sâu bảo vệ hàng rào tự nhiên của làn da trong tiết trời thu đông.",
            deleted_at: null
        },
        {
            post_id: 126,
            code: "BL-0126",
            title: "Một chút yêu thương cho làn da",
            platforms: ["Facebook", "Instagram"],
            platform_label: "Facebook & Instagram",
            author: "Lê Thu Hương",
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
            author: "Nguyễn Hà Linh",
            status: "DRAFT",
            planned_date: "2026-11-07",
            planned_label: "07/11/2026",
            updated_label: "04/11/2026",
            caption: "Hướng dẫn phân biệt các hoạt chất Hyaluronic Acid, Niacinamide và Vitamin C.",
            deleted_at: null
        },
        {
            post_id: 124,
            code: "BL-0124",
            title: "Chống nắng mỗi ngày, nâng niu làn da",
            platforms: ["Facebook", "Instagram"],
            platform_label: "Facebook & Instagram",
            author: "Phạm Khánh Linh",
            status: "SCHEDULED",
            planned_date: "2026-11-08",
            planned_label: "08/11/2026",
            updated_label: "06/11/2026",
            caption: "Kem chống nắng thuần chay mỏng nhẹ, không để lại vệt trắng.",
            deleted_at: null
        },
        {
            post_id: 123,
            code: "BL-0123",
            title: "Routine tối giản cho ngày bận rộn",
            platforms: ["Facebook", "Instagram", "TikTok"],
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
            platforms: ["TikTok"],
            platform_label: "TikTok",
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
            author: "Lê Thu Hương",
            status: "APPROVED",
            planned_date: "2026-11-12",
            planned_label: "12/11/2026",
            updated_label: "10/11/2026",
            caption: "Làm sạch kép (Double Cleansing) dịu nhẹ không gây khô căng.",
            deleted_at: null
        },
        {
            post_id: 120,
            code: "BL-0120",
            title: "Ưu đãi Tuần Lễ Hoa Anh Đào - Tặng Kèm Mặt Nạ Ngủ",
            platforms: ["Facebook"],
            platform_label: "Facebook",
            author: "Phạm Khánh Linh",
            status: "PUBLISHED",
            planned_date: "2026-11-01",
            planned_label: "01/11/2026",
            updated_label: "01/11/2026",
            caption: "Quà tặng giới hạn dành cho 200 đơn hàng đầu tiên trong tháng 11.",
            deleted_at: null
        }
    ];

    let posts = loadPosts();
    let activeTab = "ALL"; // ALL | MINE | DELETED
    let currentPage = 1;
    let pendingDeletePost = null;

    function loadPosts() {
        try {
            const raw = JSON.parse(localStorage.getItem(POST_LIST_KEY));
            if (Array.isArray(raw) && raw.length) return raw;
        } catch (e) {
            /* ignore */
        }
        localStorage.setItem(POST_LIST_KEY, JSON.stringify(INITIAL_POSTS));
        return INITIAL_POSTS.slice();
    }

    function savePosts() {
        localStorage.setItem(POST_LIST_KEY, JSON.stringify(posts));
    }

    function getFilteredPosts() {
        const keyword = (document.getElementById("postSearchInput").value || "").trim().toLowerCase();
        const platformVal = document.getElementById("filterPlatformSelect").value;
        const statusVal = document.getElementById("filterStatusSelect").value;
        const authorVal = document.getElementById("filterAuthorSelect").value;
        const dateVal = document.getElementById("filterDateInput").value;

        return posts.filter(function (p) {
            // 1. Tab filter (Soft delete visibility)
            if (activeTab === "DELETED") {
                if (!p.deleted_at) return false;
            } else {
                if (p.deleted_at) return false;
                if (activeTab === "MINE" && p.author !== "Trần Ngọc Mai" && p.author !== "Nguyễn Hà Linh") {
                    return false;
                }
            }

            // 2. Keyword search (title, code, caption)
            if (keyword) {
                const hay = (p.title + " " + p.code + " " + (p.caption || "") + " " + p.platform_label).toLowerCase();
                if (hay.indexOf(keyword) === -1) return false;
            }

            // 3. Platform filter
            if (platformVal !== "ALL") {
                if (!Array.isArray(p.platforms) || p.platforms.indexOf(platformVal) === -1) return false;
            }

            // 4. Status filter
            if (statusVal !== "ALL") {
                if (p.status !== statusVal) return false;
            }

            // 5. Author filter
            if (authorVal !== "ALL") {
                if (p.author !== authorVal) return false;
            }

            // 6. Date filter
            if (dateVal) {
                if (p.planned_date !== dateVal) return false;
            }

            return true;
        });
    }

    function renderMetrics() {
        const activeList = posts.filter(function (p) { return !p.deleted_at; });
        const draftCount = activeList.filter(function (p) { return p.status === "DRAFT"; }).length;
        const pendingCount = activeList.filter(function (p) { return p.status === "PENDING_APPROVAL"; }).length;
        const pubCount = activeList.filter(function (p) { return p.status === "PUBLISHED"; }).length;

        const mTotal = document.getElementById("metricPostTotal");
        const mDraft = document.getElementById("metricPostDraft");
        const mPending = document.getElementById("metricPostPending");
        const mPub = document.getElementById("metricPostPublished");

        // Giữ con số trực quan theo Figma hoặc cập nhật động khi xóa/lọc
        if (mTotal) mTotal.textContent = String(119 + activeList.length);
        if (mDraft) mDraft.textContent = String(12 + draftCount);
        if (mPending) mPending.textContent = String(17 + pendingCount);
        if (mPub) mPub.textContent = String(94 + pubCount);
    }

    function renderTable() {
        const t0 = performance.now();
        const filtered = getFilteredPosts();
        const total = filtered.length;
        const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        if (currentPage > totalPages) currentPage = totalPages;

        const startIdx = (currentPage - 1) * PAGE_SIZE;
        const pageItems = filtered.slice(startIdx, startIdx + PAGE_SIZE);
        const listEl = document.getElementById("postTableBody");

        const createHref = location.pathname.indexOf("/pages/admin/") !== -1
            ? "../staff/edit-post.html"
            : "edit-post.html";

        if (!pageItems.length) {
            listEl.innerHTML = UI.emptyState({
                text: activeTab === "DELETED"
                    ? "Chưa có bài viết nào trong mục Đã lưu trữ."
                    : "Không tìm thấy bài viết phù hợp."
            });
        } else {
            listEl.innerHTML = pageItems.map(function (p) {
                const st = STATUS_MAP[p.status] || { label: p.status, cls: "st-draft" };
                const canSoftDelete = !p.deleted_at && (p.status === "DRAFT" || p.status === "REJECTED");

                return '<div class="fr07-post-row" data-post-id="' + p.post_id + '">' +
                    '<div class="fr07-post-identity">' +
                        '<img src="../../assets/figma/file-text.svg" alt="" width="18" height="18">' +
                        '<div class="fr07-post-title-block">' +
                            '<span class="fr07-post-title" data-view-id="' + p.post_id + '">' + UI.esc(p.title) + '</span>' +
                            '<span class="fr07-post-meta">' + UI.esc(p.code + " · " + p.platform_label) +
                                (p.deleted_at ? " · Đã lưu trữ (" + UI.esc(p.deleted_at) + ")" : "") +
                            '</span>' +
                        '</div>' +
                    '</div>' +
                    '<span class="fr07-author">' + UI.esc(p.author) + '</span>' +
                    '<div><span class="fr07-status-pill ' + (p.deleted_at ? "st-deleted" : st.cls) + '">' +
                        UI.esc(p.deleted_at ? "Đã lưu trữ" : st.label) +
                    '</span></div>' +
                    '<span class="fr07-date">' + UI.esc(p.planned_label) + '</span>' +
                    '<div class="fr07-row-actions">' +
                        '<a href="' + createHref + '?id=' + encodeURIComponent(p.post_id) + '&state=' + encodeURIComponent(p.status) + '" class="fr07-icon-btn" title="Chỉnh sửa">' +
                            '<img src="../../assets/figma/pencil-15.svg" alt="Sửa" width="15" height="15">' +
                        '</a>' +
                        '<button type="button" class="fr07-icon-btn" data-delete-id="' + p.post_id + '" title="' +
                            (canSoftDelete ? "Xóa bài viết" : "Không thể xóa bài viết này") + '">' +
                            '<img src="../../assets/figma/trash-2-pink.svg" alt="Xóa" width="16" height="16">' +
                        '</button>' +
                    '</div>' +
                '</div>';
            }).join("");
        }

        // Pagination summary
        const summaryEl = document.getElementById("postPaginationSummary");
        if (total === 0) {
            summaryEl.textContent = "Hiển thị 0 bài viết";
        } else {
            const from = startIdx + 1;
            const to = Math.min(startIdx + PAGE_SIZE, total);
            summaryEl.textContent = "Hiển thị " + from + "–" + to + " trên " + total + " bài viết";
        }

        // Pagination buttons
        const pageBtnsEl = document.getElementById("postPaginationBtns");
        let btns = '<button type="button" class="fr07-page-btn" data-page="prev"' + (currentPage <= 1 ? " disabled" : "") + '>‹</button>';
        for (let i = 1; i <= totalPages; i++) {
            btns += '<button type="button" class="fr07-page-btn' + (i === currentPage ? " is-active" : "") + '" data-page="' + i + '">' + i + '</button>';
        }
        btns += '<button type="button" class="fr07-page-btn" data-page="next"' + (currentPage >= totalPages ? " disabled" : "") + '>›</button>';
        pageBtnsEl.innerHTML = btns;

        const elapsedMs = Math.max(0.4, (performance.now() - t0)).toFixed(1);
        const latencyEl = document.getElementById("latencyBadge");

    }

    /* ---------- FR-06: MỞ HỘP THOẠI XÁC NHẬN XÓA MỀM (Node 3:44571) ---------- */
    function handleRequestDelete(postId) {
        const post = posts.find(function (p) { return p.post_id === postId; });
        if (!post) return;

        // Kiểm tra quy tắc BR-06 / ERR-01: Chỉ cho phép xóa mềm bài DRAFT hoặc REJECTED
        if (post.status !== "DRAFT" && post.status !== "REJECTED") {
            const stLabel = (STATUS_MAP[post.status] && STATUS_MAP[post.status].label) || post.status;
            UI.toast(
                "error",
                "Không thể xóa bài viết",
                "Chỉ có thể xóa bài viết ở trạng thái Bản nháp hoặc Bị từ chối."
            );
            return;
        }

        pendingDeletePost = post;
        const stLabelUpper = post.status === "DRAFT" ? "BẢN NHÁP" : "BỊ TỪ CHỐI";
        document.getElementById("delTargetCode").textContent = post.code + " · " + stLabelUpper;
        document.getElementById("delTargetTitle").textContent = post.title;
        document.getElementById("delTargetMeta").textContent = post.author + " · Cập nhật " + (post.updated_label || post.planned_label);

        const modalEl = document.getElementById("fr06DeleteModal");
        modalEl.hidden = false;
        document.body.classList.add("modal-open");
    }

    function closeDeleteModal() {
        pendingDeletePost = null;
        const modalEl = document.getElementById("fr06DeleteModal");
        if (modalEl) modalEl.hidden = true;
        document.body.classList.remove("modal-open");
    }

    async function confirmSoftDelete() {
        if (!pendingDeletePost) return;
        const post = pendingDeletePost;

        // Gọi API DELETE /api/posts/{id} nếu Backend đang chạy
        try {
            await BlossomAPI.request("/posts/" + post.post_id, {
                method: "DELETE"
            });
        } catch (e) {
            /* fallback localStorage */
        }

        const nowStr = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) + " " +
                       new Date().toLocaleDateString("vi-VN");
        post.deleted_at = nowStr;
        savePosts();
        closeDeleteModal();
        renderMetrics();
        renderTable();

        UI.toast(
            "success",
            "Đã xóa bài viết",
            "Bài viết đã được chuyển vào mục Đã lưu trữ."
        );
    }

    /* ---------- XEM CHI TIẾT BÀI VIẾT (FR-07) ---------- */
    function openPostDetailModal(postId) {
        const post = posts.find(function (p) { return p.post_id === postId; });
        if (!post) return;
        const st = STATUS_MAP[post.status] || { label: post.status };

        const bodyHtml =
            '<div style="display:flex;flex-direction:column;gap:12px;font-size:13px;">' +
                '<div style="background:#fff8fa;padding:14px;border-radius:10px;border:1px solid #f2dfe7;">' +
                    '<div style="font-size:11px;color:#cc618a;font-weight:600;">' + UI.esc(post.code + " · " + post.platform_label) + '</div>' +
                    '<div style="font-size:16px;font-weight:600;color:#574b50;margin-top:4px;">' + UI.esc(post.title) + '</div>' +
                    '<div style="font-size:12px;color:#a4989d;margin-top:4px;">Tác giả: <b>' + UI.esc(post.author) + '</b> · Lịch đăng: ' + UI.esc(post.planned_label) + ' · Trạng thái: <b>' + UI.esc(st.label) + '</b></div>' +
                '</div>' +
                '<div>' +
                    '<b style="display:block;margin-bottom:4px;color:#574b50;">Nội dung bài viết:</b>' +
                    '<p style="color:#574b50;line-height:1.6;">' + UI.esc(post.caption || "") + '</p>' +
                '</div>' +
            '</div>';

        const editHref = (location.pathname.indexOf("/pages/admin/") !== -1 ? "../staff/edit-post.html" : "edit-post.html") +
            "?id=" + encodeURIComponent(post.post_id) + "&state=" + encodeURIComponent(post.status);

        UI.modal({
            title: "Chi tiết bài viết",
            body: bodyHtml,
            actions: [
                { label: "Đóng", variant: "ghost", value: false },
                { label: "Chỉnh sửa", variant: "primary", value: "EDIT" }
            ]
        }).then(function (act) {
            if (act === "EDIT") {
                location.href = editHref;
            }
        });
    }

    function bindEvents() {
        // Tabs
        document.querySelectorAll("[data-post-tab]").forEach(function (btn) {
            btn.addEventListener("click", function () {
                activeTab = btn.dataset.postTab;
                document.querySelectorAll("[data-post-tab]").forEach(function (b) {
                    b.classList.toggle("is-active", b === btn);
                });
                currentPage = 1;
                renderTable();
            });
        });

        // Filters
        ["postSearchInput", "filterPlatformSelect", "filterStatusSelect", "filterAuthorSelect", "filterDateInput"].forEach(function (id) {
            const el = document.getElementById(id);
            if (!el) return;
            const evt = el.tagName === "INPUT" && el.type === "text" ? "input" : "change";
            el.addEventListener(evt, function () {
                currentPage = 1;
                renderTable();
            });
        });

        const topSearch = document.getElementById("searchInput");
        if (topSearch) {
            topSearch.addEventListener("input", function () {
                document.getElementById("postSearchInput").value = topSearch.value;
                currentPage = 1;
                renderTable();
            });
        }

        // Row actions (view detail / soft delete)
        document.getElementById("postTableBody").addEventListener("click", function (e) {
            const delBtn = e.target.closest("[data-delete-id]");
            if (delBtn) {
                e.stopPropagation();
                handleRequestDelete(Number(delBtn.dataset.deleteId));
                return;
            }
            const viewEl = e.target.closest("[data-view-id]");
            if (viewEl) {
                openPostDetailModal(Number(viewEl.dataset.viewId));
            }
        });

        // Pagination
        document.getElementById("postPaginationBtns").addEventListener("click", function (e) {
            const btn = e.target.closest("[data-page]");
            if (!btn || btn.disabled) return;
            const p = btn.dataset.page;
            if (p === "prev") currentPage = Math.max(1, currentPage - 1);
            else if (p === "next") currentPage += 1;
            else currentPage = Number(p);
            renderTable();
        });

        // Delete modal controls
        document.getElementById("btnCloseDeleteModal").addEventListener("click", closeDeleteModal);
        document.getElementById("btnCancelDeleteModal").addEventListener("click", closeDeleteModal);
        document.getElementById("btnConfirmDeleteModal").addEventListener("click", confirmSoftDelete);
        document.getElementById("fr06DeleteModal").addEventListener("click", function (e) {
            if (e.target.id === "fr06DeleteModal") closeDeleteModal();
        });
    }

    renderMetrics();
    renderTable();
    bindEvents();
})();

/* =========================================================
   FR-06 & FR-07 · XÓA MỀM & DANH SÁCH BÀI VIẾT (Task T06A662)
   - FR-06: Xóa mềm (Soft Delete - cập nhật deleted_at) chỉ cho phép
            ở trạng thái DRAFT hoặc REJECTED; chặn xóa ở trạng thái
            PENDING_APPROVAL, APPROVED, SCHEDULED, PUBLISHED (ERR-01 / BR-06)
   - FR-07: Tìm kiếm từ khóa, lọc theo Nền tảng, Trạng thái, Nhân viên (Tác giả),
            Ngày dự kiến đăng, Phân trang và thời gian phản hồi < 2 giây (NFR-01)
   - Phân quyền chặt chẽ giữa Staff ("Bài viết của tôi") và Admin ("Quản lý bài viết")
   ========================================================= */
(function () {
    "use strict";

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

    const currentUser = (window.Auth && typeof window.Auth.getUser === "function") ? window.Auth.getUser() : null;
    const isStaffPage = location.pathname.indexOf("/pages/staff/") !== -1;
    // Phân quyền theo VAI TRÒ (không theo thư mục trang): Staff luôn bị giới hạn bài của mình
    const isStaffRole = !!currentUser && currentUser.role === "STAFF";

    // ---- Bộ lọc nhận từ URL (dashboard -> danh sách): ?statuses=A,B&author=&campaign=&range=&label= ----
    const urlParams = new URLSearchParams(location.search);
    let urlFilter = {
        statuses: (urlParams.get("statuses") || urlParams.get("status") || "").split(",").map(function (x) { return x.trim().toUpperCase(); }).filter(Boolean),
        author: urlParams.get("author") || "",
        campaign: urlParams.get("campaign") || "",
        range: (urlParams.get("range") || "").toUpperCase(),
        label: urlParams.get("label") || ""
    };

    // Staff mặc định tab "Bài viết của tôi", Admin mặc định "Tất cả bài viết"
    let activeTab = isStaffRole ? "MINE" : "ALL";
    let posts = loadPosts();
    let currentPage = 1;
    let pendingDeletePost = null;

    function isMyPost(p, u) {
        return Scope.isMine(p, u);
    }

    // Chỉ lấy những bài người đang đăng nhập được phép thấy (Staff: bài của mình; Manager: tất cả)
    function loadPosts() {
        return Scope.loadPosts().filter(function (p) { return Scope.canViewPost(p, currentUser); });
    }

    // Ghi lại: chỉ thay các bài mà người dùng được phép thấy, giữ nguyên bài của người khác
    function savePosts() {
        const all = Scope.loadPosts();
        const mine = {};
        posts.forEach(function (p) { mine[p.post_id] = p; });
        const merged = all.map(function (p) { return mine[p.post_id] || p; });
        Scope.savePosts(merged);
    }

    function clearUrlFilter() {
        urlFilter = { statuses: [], author: "", campaign: "", range: "", label: "" };
        try { history.replaceState(null, "", location.pathname); } catch (e) { /* bỏ qua */ }
        renderFilterBanner();
    }

    function hasUrlFilter() {
        return !!(urlFilter.statuses.length || urlFilter.author || urlFilter.campaign || urlFilter.range);
    }

    function renderFilterBanner() {
        const body = document.getElementById("postTableBody");
        if (!body) return;
        let banner = document.getElementById("postUrlFilterBanner");
        if (!hasUrlFilter()) {
            if (banner) banner.remove();
            return;
        }
        if (!banner) {
            banner = document.createElement("div");
            banner.id = "postUrlFilterBanner";
            banner.className = "fr07-url-filter";
            body.parentElement.insertBefore(banner, body);
        }
        const parts = [];
        if (urlFilter.statuses.length) {
            parts.push(urlFilter.label || urlFilter.statuses.map(function (st) { return (STATUS_MAP[st] && STATUS_MAP[st].label) || st; }).join(" · "));
        }
        if (urlFilter.author) {
            const name = (Scope.STAFF.find(function (x) { return x.username === urlFilter.author; }) || {}).fullName || urlFilter.author;
            parts.push("Nhân viên: " + name);
        }
        if (urlFilter.campaign) parts.push("Chiến dịch: " + urlFilter.campaign);
        if (urlFilter.range) parts.push({ "7D": "7 ngày qua", "30D": "30 ngày qua", "MONTH": "Tháng này" }[urlFilter.range] || urlFilter.range);
        banner.innerHTML = '<span>Đang lọc từ Tổng quan: <b>' + UI.esc(parts.join(" · ")) + '</b></span>' +
            '<button type="button" id="btnClearUrlFilter">Xóa bộ lọc ✕</button>';
        document.getElementById("btnClearUrlFilter").addEventListener("click", function () {
            clearUrlFilter();
            currentPage = 1;
            renderMetrics();
            renderTable();
        });
    }

    function getFilteredPosts() {
        const keyword = (document.getElementById("postSearchInput").value || "").trim().toLowerCase();
        const platformVal = document.getElementById("filterPlatformSelect").value;
        const statusVal = document.getElementById("filterStatusSelect").value;
        const authorVal = document.getElementById("filterAuthorSelect").value;
        const dateVal = document.getElementById("filterDateInput").value;

        return posts.filter(function (p) {
            // 0. Bảo vệ quyền xem (dù đang ở tab nào, Staff cũng không bao giờ thấy bài của người khác)
            if (!Scope.canViewPost(p, currentUser)) return false;

            // 0b. Bộ lọc đến từ thẻ thống kê ở Tổng quan
            if (urlFilter.statuses.length && urlFilter.statuses.indexOf(p.status) === -1) return false;
            if (urlFilter.author && !isStaffRole && Scope.ownerKey(p) !== urlFilter.author) return false;
            if (urlFilter.campaign && p.campaign !== urlFilter.campaign) return false;
            if (urlFilter.range && !Scope.inRange(p, urlFilter.range)) return false;

            // 1. Lọc theo Tab (Xóa mềm hoặc bài viết cá nhân / toàn công ty)
            if (activeTab === "DELETED") {
                if (!p.deleted_at) return false;
                if (isStaffRole && !isMyPost(p, currentUser)) return false;
            } else {
                if (p.deleted_at) return false;
                if (activeTab === "MINE" && !isMyPost(p, currentUser)) {
                    return false;
                }
            }

            // 2. Tìm kiếm từ khóa (tiêu đề, mã bài, caption, kênh)
            if (keyword) {
                const hay = (p.title + " " + p.code + " " + (p.caption || "") + " " + (p.platform_label || "")).toLowerCase();
                if (hay.indexOf(keyword) === -1) return false;
            }

            // 3. Lọc theo nền tảng
            if (platformVal !== "ALL") {
                if (!Array.isArray(p.platforms) || p.platforms.indexOf(platformVal) === -1) return false;
            }

            // 4. Lọc theo trạng thái
            if (statusVal !== "ALL") {
                if (p.status !== statusVal) return false;
            }

            // 5. Lọc theo tác giả
            if (authorVal !== "ALL") {
                if (p.author !== authorVal) return false;
            }

            // 6. Lọc theo ngày đăng
            if (dateVal) {
                if (p.planned_date !== dateVal) return false;
            }

            return true;
        });
    }

    function renderMetrics() {
        // Số liệu luôn tính từ dữ liệu thật mà người dùng được phép thấy
        const activeList = posts.filter(function (p) { return !p.deleted_at && Scope.canViewPost(p, currentUser); });
        const count = function (st) { return activeList.filter(function (p) { return p.status === st; }).length; };

        const set = function (id, value) {
            const el = document.getElementById(id);
            if (el) el.textContent = String(value);
        };
        set("metricPostTotal", activeList.length);
        set("metricPostDraft", count("DRAFT"));
        set("metricPostPending", count("PENDING_APPROVAL"));
        set("metricPostPublished", count("PUBLISHED"));
    }

    function renderTable() {
        const filtered = getFilteredPosts();
        const total = filtered.length;
        const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        if (currentPage > totalPages) currentPage = totalPages;

        const startIdx = (currentPage - 1) * PAGE_SIZE;
        const pageItems = filtered.slice(startIdx, startIdx + PAGE_SIZE);
        const listEl = document.getElementById("postTableBody");

        const editBaseHref = isStaffPage ? "edit-post.html" : "../staff/edit-post.html";

        if (!pageItems.length) {
            listEl.innerHTML = UI.emptyState({
                text: activeTab === "DELETED"
                    ? "Chưa có bài viết nào trong danh sách đã xóa mềm."
                    : (activeTab === "MINE"
                        ? "Bạn chưa có bài viết nào ở mục này. Hãy tạo bài viết mới để bắt đầu!"
                        : "Không tìm thấy bài viết nào khớp với điều kiện tìm kiếm và bộ lọc.")
            });
        } else {
            listEl.innerHTML = pageItems.map(function (p) {
                const st = STATUS_MAP[p.status] || { label: p.status, cls: "st-draft" };
                const isMine = isMyPost(p, currentUser);

                // Quyền chỉnh sửa & xóa mềm theo vai trò
                let actionsHtml = "";

                if (isStaffRole) {
                    if (!isMine) {
                        // Xem bài đồng nghiệp ở tab Tất cả: chỉ đọc
                        actionsHtml = '<button type="button" class="fr07-icon-btn" data-view-id="' + p.post_id + '" title="Xem chi tiết bài viết (Chỉ đọc)">' +
                            '<img src="../../assets/figma/file-text.svg" alt="Xem" width="15" height="15">' +
                        '</button>';
                    } else {
                        // Bài của mình: được sửa khi ở trạng thái DRAFT, REVISION_REQUESTED, REJECTED, APPROVED, SCHEDULED (BR-04 sửa bài đã duyệt sẽ chuyển lại về Chờ duyệt)
                        const canStaffEdit = (p.status === "DRAFT" || p.status === "REVISION_REQUESTED" || p.status === "REJECTED" || p.status === "APPROVED" || p.status === "SCHEDULED");
                        const canStaffDelete = !p.deleted_at && (p.status === "DRAFT" || p.status === "REJECTED");

                        if (canStaffEdit) {
                            actionsHtml += '<a href="' + editBaseHref + '?id=' + encodeURIComponent(p.post_id) + '&state=' + encodeURIComponent(p.status) + '" class="fr07-icon-btn" title="Chỉnh sửa bài viết của bạn">' +
                                '<img src="../../assets/figma/pencil-15.svg" alt="Sửa" width="15" height="15">' +
                            '</a>';
                        } else {
                            actionsHtml += '<button type="button" class="fr07-icon-btn" data-view-id="' + p.post_id + '" title="Bài viết đang chờ duyệt hoặc đã xuất bản (Xem chi tiết)">' +
                                '<img src="../../assets/figma/file-text.svg" alt="Xem" width="15" height="15">' +
                            '</button>';
                        }

                        actionsHtml += '<button type="button" class="fr07-icon-btn' + (canStaffDelete ? "" : " is-disabled") + '" data-delete-id="' + p.post_id + '" title="' +
                            (canStaffDelete ? "Xóa mềm bài viết" : "Chỉ xóa được bài Bản nháp hoặc Bị từ chối") + '">' +
                            '<img src="../../assets/figma/trash-2-16.svg" alt="Xóa" width="15" height="15">' +
                        '</button>';
                    }
                } else {
                    // Quyền Quản trị viên (Admin / Manager): chỉ sửa bài của chính mình; bài người khác chỉ xem chi tiết
                    const canAdminEdit = isMine && !p.deleted_at && p.status !== "PUBLISHED";
                    const canAdminDelete = !p.deleted_at && (p.status === "DRAFT" || p.status === "REJECTED");
                    if (canAdminEdit) {
                        actionsHtml = '<a href="' + editBaseHref + '?id=' + encodeURIComponent(p.post_id) + '&state=' + encodeURIComponent(p.status) + '" class="fr07-icon-btn" title="Chỉnh sửa bài viết của bạn">' +
                            '<img src="../../assets/figma/pencil-15.svg" alt="Sửa" width="15" height="15">' +
                        '</a>';
                    } else {
                        actionsHtml = '<button type="button" class="fr07-icon-btn" data-view-id="' + p.post_id + '" title="Xem chi tiết bài viết (Chỉ đọc)">' +
                            '<img src="../../assets/figma/file-text.svg" alt="Xem" width="15" height="15">' +
                        '</button>';
                    }
                    actionsHtml += '<button type="button" class="fr07-icon-btn' + (canAdminDelete ? "" : " is-disabled") + '" data-delete-id="' + p.post_id + '" title="' +
                        (canAdminDelete ? "Xóa mềm bài viết" : "Chỉ xóa được bài Bản nháp hoặc Bị từ chối") + '">' +
                        '<img src="../../assets/figma/trash-2-16.svg" alt="Xóa" width="15" height="15">' +
                    '</button>';
                }

                return '<div class="fr07-post-row" data-post-id="' + p.post_id + '">' +
                    '<div class="fr07-post-identity">' +
                        '<img src="../../assets/figma/file-text.svg" alt="" width="18" height="18">' +
                        '<div class="fr07-post-title-block">' +
                            '<span class="fr07-post-title" data-view-id="' + p.post_id + '" role="button" tabindex="0">' + UI.esc(p.title) + '</span>' +
                            '<span class="fr07-post-meta">' + UI.esc(p.code + " · " + (p.platform_label || "")) +
                                (p.deleted_at ? " · Đã xóa mềm (" + UI.esc(p.deleted_at) + ")" : "") +
                            '</span>' +
                        '</div>' +
                    '</div>' +
                    '<span class="fr07-author">' + UI.esc(p.author) + '</span>' +
                    '<div><span class="fr07-status-pill ' + (p.deleted_at ? "st-deleted" : st.cls) + '">' +
                        UI.esc(p.deleted_at ? "Đã xóa mềm" : st.label) +
                    '</span></div>' +
                    '<span class="fr07-date">' + UI.esc(p.planned_label || p.planned_date || "Chưa lên lịch") + '</span>' +
                    '<div class="fr07-row-actions">' + actionsHtml + '</div>' +
                '</div>';
            }).join("");
        }

        // Pagination summary
        const summaryEl = document.getElementById("postPaginationSummary");
        if (summaryEl) {
            if (total === 0) {
                summaryEl.textContent = "Hiển thị 0 bài viết";
            } else {
                const from = startIdx + 1;
                const to = Math.min(startIdx + PAGE_SIZE, total);
                summaryEl.textContent = "Hiển thị " + from + "–" + to + " trên " + total + " bài viết";
            }
        }

        // Pagination buttons
        const pageBtnsEl = document.getElementById("postPaginationBtns");
        if (pageBtnsEl) {
            let btns = '<button type="button" class="fr07-page-btn" data-page="prev"' + (currentPage <= 1 ? " disabled" : "") + '>‹</button>';
            for (let i = 1; i <= totalPages; i++) {
                btns += '<button type="button" class="fr07-page-btn' + (i === currentPage ? " is-active" : "") + '" data-page="' + i + '">' + i + '</button>';
            }
            btns += '<button type="button" class="fr07-page-btn" data-page="next"' + (currentPage >= totalPages ? " disabled" : "") + '>›</button>';
            pageBtnsEl.innerHTML = btns;
        }
    }

    /* ---------- FR-06: MỞ HỘP THOẠI XÁC NHẬN XÓA MỀM ---------- */
    function handleRequestDelete(postId) {
        const post = posts.find(function (p) { return p.post_id === postId; });
        if (!post) return;

        // Nếu là Staff, kiểm tra quyền sở hữu
        if (isStaffRole && !isMyPost(post, currentUser)) {
            UI.toast("error", "Không có quyền", "Bạn chỉ được phép xóa bài viết do chính mình tạo.");
            return;
        }

        // Kiểm tra quy tắc BR-06 / ERR-01: Chỉ cho phép xóa mềm bài DRAFT hoặc REJECTED
        if (post.status !== "DRAFT" && post.status !== "REJECTED") {
            const stLabel = (STATUS_MAP[post.status] && STATUS_MAP[post.status].label) || post.status;
            UI.toast(
                "error",
                "Không thể xóa bài viết",
                "Bài '" + post.code + "' đang ở trạng thái '" + stLabel + "'. Hệ thống chỉ cho phép xóa mềm bài ở trạng thái Bản nháp (Draft) hoặc Bị từ chối (Rejected)!"
            );
            return;
        }

        pendingDeletePost = post;
        const stLabelUpper = post.status === "DRAFT" ? "BẢN NHÁP" : "BỊ TỪ CHỐI";
        document.getElementById("delTargetCode").textContent = post.code + " · " + stLabelUpper;
        document.getElementById("delTargetTitle").textContent = post.title;
        document.getElementById("delTargetMeta").textContent = post.author + " · Cập nhật " + (post.updated_label || post.planned_label);

        const modalEl = document.getElementById("fr06DeleteModal");
        if (modalEl) {
            modalEl.hidden = false;
            document.body.classList.add("modal-open");
        }
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

        try {
            if (window.BlossomAPI && typeof window.BlossomAPI.request === "function") {
                await BlossomAPI.request("/posts/" + post.post_id, { method: "DELETE" });
            }
        } catch (e) {
            UI.toast("error", "Không thể xóa bài viết", e.message || "Lỗi kết nối Backend.");
            return;
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
            "Bài viết '" + post.code + " · " + post.title + "' đã được cập nhật deleted_at và gỡ khỏi danh sách hiển thị."
        );
    }

    /* ---------- XEM CHI TIẾT BÀI VIẾT ---------- */
    function openPostDetailModal(postId) {
        if (window.PostDetailModal && typeof window.PostDetailModal.open === "function") {
            window.PostDetailModal.open(postId);
            return;
        }
        if (window.openPostDetailModal && window.openPostDetailModal !== openPostDetailModal) {
            window.openPostDetailModal(postId);
            return;
        }

        const post = posts.find(function (p) { return p.post_id === postId; });
        if (!post || !Scope.canViewPost(post, currentUser)) {
            UI.toast("error", "Không có quyền", "Bạn chỉ được xem bài viết do chính mình phụ trách.");
            return;
        }
        const st = STATUS_MAP[post.status] || { label: post.status };

        const bodyHtml =
            '<div style="display:flex;flex-direction:column;gap:12px;font-size:13px;">' +
                '<div style="background:#fff8fa;padding:14px;border-radius:10px;border:1px solid #f2dfe7;">' +
                    '<div style="font-size:11px;color:#cc618a;font-weight:600;">' + UI.esc(post.code + " · " + (post.platform_label || "")) + '</div>' +
                    '<div style="font-size:16px;font-weight:600;color:#574b50;margin-top:4px;">' + UI.esc(post.title) + '</div>' +
                    '<div style="font-size:12px;color:#a4989d;margin-top:4px;">Tác giả: <b>' + UI.esc(post.author) + '</b> · Lịch đăng: ' + UI.esc(post.planned_label || post.planned_date) + ' · Trạng thái: <b>' + UI.esc(st.label) + '</b></div>' +
                '</div>' +
                '<div>' +
                    '<b style="display:block;margin-bottom:4px;color:#574b50;">Nội dung bài viết (Caption):</b>' +
                    '<p style="color:#574b50;line-height:1.6;">' + UI.esc(post.caption || "") + '</p>' +
                '</div>' +
            '</div>';

        const editHref = (isStaffPage ? "edit-post.html" : "../staff/edit-post.html") +
            "?id=" + encodeURIComponent(post.post_id) + "&state=" + encodeURIComponent(post.status);

        const actions = [{ label: "Đóng", variant: "ghost", value: false }];
        if (isMyPost(post, currentUser) && post.status !== "PUBLISHED") {
            actions.push({ label: "Chỉnh sửa bài viết", variant: "primary", value: "EDIT" });
        }

        UI.modal({
            title: "Chi tiết bài viết",
            body: bodyHtml,
            actions: actions
        }).then(function (act) {
            if (act === "EDIT") {
                location.href = editHref;
            }
        });
    }

    function updateAuthorFilterUI() {
        const authorSel = document.getElementById("filterAuthorSelect");
        if (!authorSel) return;
        const field = authorSel.closest(".fr07-filter-field");

        if (isStaffRole) {
            // Staff chỉ có bài của mình => ẩn hẳn bộ lọc tác giả
            authorSel.value = "ALL";
            if (field) field.hidden = true;
            return;
        }
        if (field) field.hidden = false;
        authorSel.disabled = false;
        authorSel.title = "";
    }

    // Danh sách tác giả lấy từ dữ liệu thật (Manager); Staff không dùng
    function populateAuthorFilter() {
        const authorSel = document.getElementById("filterAuthorSelect");
        if (!authorSel || isStaffRole) return;
        const names = [];
        posts.forEach(function (p) { if (p.author && names.indexOf(p.author) === -1) names.push(p.author); });
        Scope.STAFF.forEach(function (s) { if (names.indexOf(s.fullName) === -1) names.push(s.fullName); });
        names.sort(function (a, b) { return a.localeCompare(b, "vi"); });
        authorSel.innerHTML = '<option value="ALL">Tất cả tác giả</option>' +
            names.map(function (n) { return '<option value="' + UI.esc(n) + '">' + UI.esc(n) + '</option>'; }).join("");
    }

    // Staff: bỏ tab "Tất cả bài viết"; đồng bộ nút tab đang chọn
    function prepareTabs() {
        if (isStaffRole) {
            const allBtn = document.querySelector('[data-post-tab="ALL"]');
            if (allBtn) allBtn.remove();
        }
        document.querySelectorAll("[data-post-tab]").forEach(function (b) {
            b.classList.toggle("is-active", b.dataset.postTab === activeTab);
        });
    }

    // Nếu URL chỉ có 1 trạng thái thì đồng bộ vào ô chọn Trạng thái (người dùng đổi tiếp được)
    function syncUrlFilterToControls() {
        const statusSel = document.getElementById("filterStatusSelect");
        if (statusSel && urlFilter.statuses.length === 1 && statusSel.querySelector('option[value="' + urlFilter.statuses[0] + '"]')) {
            statusSel.value = urlFilter.statuses[0];
            urlFilter.statuses = [];
            urlFilter.label = "";
        }
        if (urlFilter.author && !isStaffRole) {
            const person = Scope.STAFF.find(function (x) { return x.username === urlFilter.author; });
            const authorSel = document.getElementById("filterAuthorSelect");
            if (person && authorSel && authorSel.querySelector('option[value="' + person.fullName + '"]')) {
                authorSel.value = person.fullName;
                urlFilter.author = "";
            }
        }
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
                updateAuthorFilterUI();
                renderTable();
            });
        });

        // Filters
        ["postSearchInput", "filterPlatformSelect", "filterStatusSelect", "filterAuthorSelect", "filterDateInput"].forEach(function (id) {
            const el = document.getElementById(id);
            if (!el) return;
            const evt = el.tagName === "INPUT" && el.type === "text" ? "input" : "change";
            el.addEventListener(evt, function () {
                if (id === "filterStatusSelect" && urlFilter.statuses.length) {
                    urlFilter.statuses = [];
                    urlFilter.label = "";
                    renderFilterBanner();
                }
                currentPage = 1;
                renderTable();
            });
        });

        const topSearch = document.getElementById("searchInput");
        if (topSearch) {
            topSearch.addEventListener("input", function () {
                const innerSearch = document.getElementById("postSearchInput");
                if (innerSearch) innerSearch.value = topSearch.value;
                currentPage = 1;
                renderTable();
            });
        }

        // Row actions (view detail / soft delete)
        const tableBody = document.getElementById("postTableBody");
        if (tableBody) {
            tableBody.addEventListener("click", function (e) {
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
            tableBody.addEventListener("keydown", function (e) {
                if (e.key === "Enter" || e.key === " ") {
                    const viewEl = e.target.closest("[data-view-id]");
                    if (viewEl) {
                        e.preventDefault();
                        openPostDetailModal(Number(viewEl.dataset.viewId));
                    }
                }
            });
        }

        // Pagination
        const pBtns = document.getElementById("postPaginationBtns");
        if (pBtns) {
            pBtns.addEventListener("click", function (e) {
                const btn = e.target.closest("[data-page]");
                if (!btn || btn.disabled) return;
                const p = btn.dataset.page;
                if (p === "prev") currentPage = Math.max(1, currentPage - 1);
                else if (p === "next") currentPage += 1;
                else currentPage = Number(p);
                renderTable();
            });
        }

        // Delete modal controls
        const btnClose = document.getElementById("btnCloseDeleteModal");
        const btnCancel = document.getElementById("btnCancelDeleteModal");
        const btnConfirm = document.getElementById("btnConfirmDeleteModal");
        const delModal = document.getElementById("fr06DeleteModal");

        if (btnClose) btnClose.addEventListener("click", closeDeleteModal);
        if (btnCancel) btnCancel.addEventListener("click", closeDeleteModal);
        if (btnConfirm) btnConfirm.addEventListener("click", confirmSoftDelete);
        if (delModal) {
            delModal.addEventListener("click", function (e) {
                if (e.target.id === "fr06DeleteModal") closeDeleteModal();
            });
        }

        // Đồng bộ dữ liệu liên trang
        window.addEventListener("blossom_posts_updated", function () {
            posts = loadPosts();
            populateAuthorFilter();
            renderMetrics();
            renderTable();
        });
        window.addEventListener("storage", function (e) {
            if (e.key === Scope.POSTS_KEY) {
                posts = loadPosts();
                renderMetrics();
                renderTable();
            }
        });
    }

    posts = loadPosts();
    prepareTabs();
    updateAuthorFilterUI();
    populateAuthorFilter();
    syncUrlFilterToControls();
    renderFilterBanner();
    renderMetrics();
    renderTable();
    bindEvents();

    // Mở chi tiết khi có ?view=ID (đã kiểm tra quyền trong openPostDetailModal)
    const viewId = Number(urlParams.get("view") || 0);
    if (viewId) setTimeout(function () { openPostDetailModal(viewId); }, 200);
})();
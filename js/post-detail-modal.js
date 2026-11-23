/* ==========================================================
   BLOSSOM BEAUTY STORE – POST DETAIL MODAL (FR-12 / T06A668)
   Xem chi tiết bài viết, Sao chép Caption (clipboard), Tải xuống Media (blob)
   Dùng chung cho Posts Management, Calendar, Approvals, Notifications
   ========================================================== */

(function (global) {
    "use strict";

    // Trả về bài viết nếu tồn tại. Việc kiểm tra quyền xem nằm ở openPostDetailModal.
    function getSharedPost(postId) {
        try {
            const found = Scope.getPostById(postId);
            if (found) return found;
        } catch (e) {}

        // Dự phòng: dữ liệu lấy từ sự kiện lịch đăng (giữ nguyên chủ sở hữu của lịch)
        try {
            const calEvents = Scope.loadEvents();
            const ev = calEvents.find(function (e) {
                return Number(e.id) === Number(postId) || String(e.id) === String(postId) || e.code === String(postId);
            });
            if (ev) {
                return {
                    post_id: ev.id,
                    code: ev.code || "BL-0" + ev.id,
                    title: ev.title,
                    platforms: [ev.platform || "Facebook & Instagram"],
                    platform_label: ev.platform || "Facebook & Instagram",
                    author: ev.author || "",
                    owner_username: ev.owner_username,
                    status: ev.status === "SCHEDULED" ? "SCHEDULED" : (ev.status === "PENDING" ? "PENDING_APPROVAL" : "DRAFT"),
                    planned_label: ev.date + " " + ev.time,
                    caption: ""
                };
            }
        } catch (e) {}

        return null;
    }

    const STATUS_MAP = {
        PUBLISHED:          { label: "Đã xuất bản",    cls: "st-published",  color: "#3f9a65", bg: "#e6f5ec" },
        PENDING_APPROVAL:   { label: "Chờ duyệt",      cls: "st-pending",    color: "#d9923a", bg: "#fff0e1" },
        REVISION_REQUESTED: { label: "Đang chỉnh sửa", cls: "st-revision",   color: "#7a6aa8", bg: "#efeaf8" },
        DRAFT:              { label: "Bản nháp",       cls: "st-draft",      color: "#8c8294", bg: "#f0edf3" },
        SCHEDULED:          { label: "Đã lên lịch",    cls: "st-scheduled",  color: "#3f9a65", bg: "#ebf6ef" },
        APPROVED:           { label: "Đã phê duyệt",   cls: "st-approved",   color: "#2563eb", bg: "#eff6ff" },
        REJECTED:           { label: "Bị từ chối",     cls: "st-rejected",   color: "#d64545", bg: "#fdeaea" }
    };

    function copyCaption(text) {
        if (!text) {
            UI.toast("info", "Thông báo", "Bài viết chưa có nội dung caption.");
            return;
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {
                UI.toast("success", "Đã sao chép caption", "Nội dung caption bài viết đã được lưu vào bộ nhớ tạm.");
            }).catch(function () {
                fallbackCopy(text);
            });
        } else {
            fallbackCopy(text);
        }
    }

    function fallbackCopy(text) {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand("copy");
            UI.toast("success", "Đã sao chép caption", "Nội dung caption bài viết đã được lưu vào bộ nhớ tạm.");
        } catch (err) {
            UI.toast("error", "Lỗi", "Không thể sao chép caption tự động. Vui lòng chọn và sao chép thủ công.");
        }
        document.body.removeChild(ta);
    }

    function downloadMedia(url, postCode) {
        if (!url) return;
        if (window.BlossomAPI && typeof window.BlossomAPI.resolveMediaUrl === "function") {
            url = window.BlossomAPI.resolveMediaUrl(url);
        }
        UI.toast("info", "Tải xuống media", "Đang tải tệp media của bài viết " + postCode + " về máy...");

        const safeCode = (postCode || "blossom_post").replace(/[^a-zA-Z0-9_-]/g, "_");
        const filename = safeCode + "_media.png";

        fetch(url)
            .then(function (res) { return res.blob(); })
            .then(function (blob) {
                const blobUrl = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = blobUrl;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(blobUrl);
                document.body.removeChild(a);
                UI.toast("success", "Thành công", "Tệp media đã được tải xuống: " + filename);
            })
            .catch(function () {
                // Fallback nếu fetch blob bị cors
                const a = document.createElement("a");
                a.href = url;
                a.download = filename;
                a.target = "_blank";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                UI.toast("success", "Tải xuống", "Đã bắt đầu tải tệp media.");
            });
    }

    function openPostDetailModal(postId) {
        const post = getSharedPost(postId);
        if (!post) {
            UI.toast("error", "Lỗi", "Không tìm thấy dữ liệu bài viết ID #" + postId);
            return;
        }
        // Phân quyền: Staff không được xem chi tiết bài viết của nhân viên khác
        if (!Scope.canViewPost(post)) {
            UI.toast("error", "Không có quyền truy cập", "Bạn chỉ được xem bài viết do chính mình phụ trách.");
            return;
        }

        const st = STATUS_MAP[post.status] || { label: post.status, color: "#8c8294", bg: "#f0edf3" };
        // Ảnh/video do người dùng đã tải lên (không dùng ảnh mặc định)
        const media = (Scope.getPostMedia(post.post_id)) || null;
        let mediaUrl = (media && media.url) || post.mediaUrl || post.media_url || "";
        if (mediaUrl && window.BlossomAPI && typeof window.BlossomAPI.resolveMediaUrl === "function") {
            mediaUrl = window.BlossomAPI.resolveMediaUrl(mediaUrl);
        }
        const isVideo = !!(media && media.type === "VIDEO");

        const headline = (post.headline || "").trim();
        const caption = (post.caption || "").trim();
        const hashtags = (post.hashtags || "").trim();
        const fullText = [headline, caption, hashtags].filter(Boolean).join("\n\n");
        const hasContent = !!fullText;

        let mediaHtml;
        if (mediaUrl && isVideo) {
            mediaHtml = '<video src="' + UI.esc(mediaUrl) + '" controls class="detail-media-preview-img" style="width:100%;border-radius:10px;background:#000"></video>';
        } else if (mediaUrl) {
            mediaHtml = '<img src="' + UI.esc(mediaUrl) + '" alt="Media Preview" class="detail-media-preview-img">';
        } else {
            mediaHtml = '<div class="detail-media-empty" style="display:grid;place-content:center;gap:4px;text-align:center;min-height:200px;border:1.5px dashed #f0c6d6;border-radius:10px;color:var(--muted);font-size:13px;padding:16px">' +
                '<b>Chưa có ảnh/video</b><span>' + (media && media.name ? "Tệp: " + UI.esc(media.name) + " (không có bản xem trước)" : "Bài viết này chưa đính kèm media.") + '</span></div>';
        }

        const bodyHtml =
            '<div class="post-detail-modal-grid">' +
                '<!-- CỘT 1: MEDIA & DOWNLOAD MEDIA -->' +
                '<div class="detail-media-pane">' +
                    mediaHtml +
                    (mediaUrl ? '<button type="button" class="btn-download-media" id="btnDownloadPostMedia">' +
                        UI.icon("chart") + '<span>Tải xuống Media</span>' +
                    '</button>' +
                    '<small style="font-size:11.5px;color:var(--muted);text-align:center;">Định dạng chuẩn ảnh phân giải cao/video xuất bản đa kênh</small>' : "") +
                '</div>' +

                '<!-- CỘT 2: THÔNG TIN CHI TIẾT & COPY CAPTION -->' +
                '<div class="detail-content-pane">' +
                    '<div class="detail-header-meta">' +
                        '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">' +
                            '<span style="font-size:12px;font-weight:700;color:var(--pink);background:var(--pink-soft);padding:3px 8px;border-radius:4px;">' + UI.esc(post.code || "BL-0" + post.post_id) + '</span>' +
                            '<span style="font-size:12px;font-weight:600;color:#555;background:#eee;padding:3px 8px;border-radius:4px;">' + UI.esc(post.platform_label || "Đa kênh") + '</span>' +
                        '</div>' +
                        '<span style="font-size:12px;font-weight:700;color:' + st.color + ';background:' + st.bg + ';padding:3px 10px;border-radius:100px;">' + UI.esc(st.label) + '</span>' +
                    '</div>' +

                    '<h3 style="font-family:var(--font-display);font-size:22px;color:var(--text-strong);line-height:1.35;margin:0;">' + UI.esc(post.title) + '</h3>' +

                    '<div style="font-size:13px;color:var(--muted);display:flex;gap:16px;flex-wrap:wrap;border-bottom:1px solid #f4dce4;padding-bottom:10px;">' +
                        '<span>Tác giả: <b style="color:var(--text);">' + UI.esc(post.author || "—") + '</b></span>' +
                        '<span>Lịch dự kiến: <b style="color:var(--text);">' + UI.esc(Scope.plannedLabelOf(post) || post.planned_label || "Chưa lên lịch") + '</b></span>' +
                        (post.published_url ? '<span>Link đã đăng: <a href="' + UI.esc(post.published_url) + '" target="_blank" rel="noopener" style="color:var(--pink);font-weight:600;text-decoration:underline;">Xem bài viết</a></span>' : "") +
                    '</div>' +

                    '<div>' +
                        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
                            '<span style="font-size:12.5px;font-weight:600;color:var(--muted);text-transform:uppercase;">Nội dung Caption:</span>' +
                            '<button type="button" class="btn-copy-caption" id="btnCopyPostCaption">' +
                                UI.icon("clipboard") + '<span>Sao chép Caption</span>' +
                            '</button>' +
                        '</div>' +
                        '<div class="caption-box" id="postModalCaptionBox" style="white-space:pre-wrap">' +
                            (hasContent
                                ? (headline ? '<b>' + UI.esc(headline) + '</b>\n\n' : "") + UI.esc(caption) + (hashtags ? '\n\n<span style="color:var(--pink)">' + UI.esc(hashtags) + '</span>' : "")
                                : '<span style="color:var(--muted)">Bài viết chưa có nội dung.</span>') +
                        '</div>' +
                    '</div>' +

                    // Khu vuc xuat ban (APPROVED / SCHEDULED) hoac Thong ke & Dong bo (PUBLISHED)
                    ((post.status === "APPROVED" || post.status === "SCHEDULED") && (Scope.isManager() || Scope.isMine(post))
                        ? '<div style="margin-top:8px;padding:12px;border-radius:10px;background:#fff8fa;border:1px solid #f2dfe7;display:flex;flex-direction:column;gap:8px;">' +
                            '<span style="font-size:12px;font-weight:700;color:#574b50;text-transform:uppercase;">Xuất bản bài viết</span>' +
                            '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
                                '<button type="button" class="btn btn--primary btn--sm" id="btnModalAutoPublish">Tự động đăng bài ngay</button>' +
                                '<button type="button" class="btn btn--secondary btn--sm" id="btnModalManualPublish">Xác nhận đã đăng (Nhập URL)</button>' +
                            '</div>' +
                          '</div>'
                        : "") +

                    (post.status === "PUBLISHED"
                        ? '<div style="margin-top:8px;padding:12px;border-radius:10px;background:#f8fbf9;border:1px solid #d5eadc;display:flex;flex-direction:column;gap:10px;">' +
                            '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">' +
                                '<span style="font-size:12px;font-weight:700;color:#2f7d4e;text-transform:uppercase;">Hiệu quả bài đăng & Đồng bộ</span>' +
                                '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
                                    '<button type="button" class="btn btn--primary btn--sm" id="btnModalSyncSocial">Đồng bộ MXH</button>' +
                                    '<button type="button" class="btn btn--ghost btn--sm" id="btnModalManualStats">Nhập số liệu</button>' +
                                '</div>' +
                            '</div>' +
                            '<div id="postModalStatsBox" style="font-size:12.5px;color:#574b50;">Đang tải số liệu...</div>' +
                          '</div>'
                        : "") +
                '</div>' +
            '</div>';

        const inAdmin = location.pathname.indexOf("/pages/admin/") !== -1;
        const onApprovalsPage = location.pathname.indexOf("approvals.html") !== -1;
        const editUrl = (inAdmin ? "../staff/edit-post.html" : "edit-post.html") + "?id=" + encodeURIComponent(post.post_id);
        const canEditThisPost = !onApprovalsPage &&
            Scope.isMine(post) &&
            post.status !== "PUBLISHED" &&
            post.status !== "PENDING_APPROVAL" &&
            post.status !== "APPROVED" &&
            post.status !== "SCHEDULED";

        const modalActions = [{ label: "Đóng", variant: "ghost", value: false }];
        if (canEditThisPost) {
            modalActions.push({ label: "Chỉnh sửa bài viết", variant: "secondary", value: "EDIT" });
        }

        UI.modal({
            title: "Chi tiết bài viết – " + (post.code || "BL-0" + post.post_id),
            size: "lg",
            body: bodyHtml,
            actions: modalActions
        }).then(function (act) {
            if (act === "EDIT" && canEditThisPost) {
                location.href = editUrl;
            }
        });

        // Gắn sự kiện cho các nút tương tác ngay sau khi modal xuất hiện
        setTimeout(function () {
            const btnCopy = document.getElementById("btnCopyPostCaption");
            if (btnCopy) {
                btnCopy.addEventListener("click", function () {
                    copyCaption(fullText);
                });
            }

            const btnDl = document.getElementById("btnDownloadPostMedia");
            if (btnDl) {
                btnDl.addEventListener("click", function () {
                    downloadMedia(mediaUrl, post.code || "BL-0" + post.post_id);
                });
            }

            bindPublishAndStatsHandlers(post);
        }, 50);
    }

    function updateLocalPostPublished(postId, publishedUrl) {
        try {
            const list = Scope.loadPosts();
            const item = list.find(function (p) { return Number(p.post_id) === Number(postId); });
            if (item) {
                item.status = "PUBLISHED";
                item.published_url = publishedUrl || item.published_url || "";
                item.updated_at = new Date().toISOString();
                Scope.savePosts(list);
            }
            if (Scope.syncFromBackend) Scope.syncFromBackend();
        } catch (_) {}
    }

    function renderStatsBox(stat) {
        const box = document.getElementById("postModalStatsBox");
        if (!box) return;
        if (!stat) {
            box.innerHTML = '<span style="color:var(--muted);">Chưa có số liệu thống kê. Hãy bấm Đồng bộ MXH hoặc Nhập số liệu.</span>';
            return;
        }
        const fmt = function (n) { return Number(n || 0).toLocaleString("vi-VN"); };
        box.innerHTML =
            '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;text-align:center;background:#fff;padding:8px;border-radius:8px;border:1px solid #e5f1e9;">' +
                '<div><div style="font-size:11px;color:var(--muted);">Reach</div><b>' + fmt(stat.reach_count) + '</b></div>' +
                '<div><div style="font-size:11px;color:var(--muted);">Views</div><b>' + fmt(stat.view_count) + '</b></div>' +
                '<div><div style="font-size:11px;color:var(--muted);">Likes</div><b>' + fmt(stat.like_count) + '</b></div>' +
                '<div><div style="font-size:11px;color:var(--muted);">Comments</div><b>' + fmt(stat.comment_count) + '</b></div>' +
                '<div><div style="font-size:11px;color:var(--muted);">Shares</div><b>' + fmt(stat.share_count) + '</b></div>' +
            '</div>' +
            '<div style="margin-top:6px;font-size:11px;color:var(--muted);">Nguồn: <b>' + UI.esc(stat.source_type || "API") + '</b> · Mốc: <b>' + UI.esc(stat.milestone || "24H") + '</b></div>';
    }

    async function loadLatestStats(postId) {
        const box = document.getElementById("postModalStatsBox");
        if (!box) return;
        if (!window.BlossomAPI || !window.BlossomAPI.getToken()) {
            renderStatsBox(null);
            return;
        }
        try {
            const stat = await BlossomAPI.request("/posts/" + postId + "/statistics/latest");
            renderStatsBox(stat);
        } catch (_) {
            renderStatsBox(null);
        }
    }

    function bindPublishAndStatsHandlers(post) {
        const btnAuto = document.getElementById("btnModalAutoPublish");
        if (btnAuto) {
            btnAuto.addEventListener("click", async function () {
                if (!window.BlossomAPI || !window.BlossomAPI.getToken()) {
                    UI.toast("error", "Chưa đăng nhập Backend", "Vui lòng đăng nhập lại để sử dụng tính năng tự động đăng.");
                    return;
                }
                btnAuto.disabled = true;
                btnAuto.textContent = "Đang xuất bản...";
                try {
                    const res = await BlossomAPI.request("/posts/" + post.post_id + "/auto-publish", { method: "POST" });
                    updateLocalPostPublished(post.post_id, res && res.published_url);
                    UI.toast("success", "Xuất bản thành công", (res && res.published_url) ? ("Đã đăng tại: " + res.published_url) : "Bài viết đã chuyển sang PUBLISHED.");
                    const backdrop = document.querySelector(".modal-backdrop");
                    if (backdrop) backdrop.remove();
                    document.body.classList.remove("modal-open");
                    setTimeout(function () { openPostDetailModal(post.post_id); }, 150);
                } catch (err) {
                    UI.toast("error", "Không thể tự động đăng", err.message || "Lỗi kết nối API mạng xã hội.");
                    btnAuto.disabled = false;
                    btnAuto.textContent = "Tự động đăng bài ngay";
                }
            });
        }

        const btnManual = document.getElementById("btnModalManualPublish");
        if (btnManual) {
            btnManual.addEventListener("click", async function () {
                const body =
                    '<div style="display:flex;flex-direction:column;gap:8px;">' +
                        '<label style="font-size:13px;font-weight:600;">Đường dẫn bài đăng thực tế (Facebook / Instagram / Threads):</label>' +
                        '<input type="url" id="manualPublishUrlInput" class="input" placeholder="https://www.facebook.com/..." style="width:100%;padding:8px 10px;border:1px solid #e2cdd5;border-radius:8px;">' +
                    '</div>';
                const act = await UI.modal({
                    title: "Xác nhận đã đăng bài",
                    body: body,
                    actions: [
                        { label: "Hủy", variant: "ghost", value: false },
                        { label: "Xác nhận", variant: "primary", value: "CONFIRM" }
                    ]
                });
                if (act !== "CONFIRM") return;
                const inputEl = document.getElementById("manualPublishUrlInput");
                const urlVal = inputEl ? inputEl.value.trim() : "";
                if (!urlVal) {
                    UI.toast("error", "Thiếu đường dẫn", "Vui lòng nhập URL bài đăng hợp lệ.");
                    return;
                }
                try {
                    const res = await BlossomAPI.request("/posts/" + post.post_id + "/publish", {
                        method: "PATCH",
                        body: { published_url: urlVal }
                    });
                    updateLocalPostPublished(post.post_id, (res && res.published_url) || urlVal);
                    UI.toast("success", "Đã xác nhận xuất bản", "Trạng thái bài viết đã chuyển sang PUBLISHED.");
                    document.querySelectorAll(".modal-backdrop").forEach(function (el) { el.remove(); });
                    document.body.classList.remove("modal-open");
                    setTimeout(function () { openPostDetailModal(post.post_id); }, 150);
                } catch (err) {
                    UI.toast("error", "Xác nhận thất bại", err.message || "Đường dẫn không hợp lệ.");
                }
            });
        }

        if (post.status === "PUBLISHED") {
            loadLatestStats(post.post_id);

            const btnSyncSocial = document.getElementById("btnModalSyncSocial");
            if (btnSyncSocial) {
                btnSyncSocial.addEventListener("click", async function () {
                    const platText = String(post.platform_label || (post.platforms && post.platforms[0]) || "Facebook").toLowerCase();
                    let endpoint = "/social/posts/" + post.post_id + "/sync-facebook";
                    if (platText.indexOf("insta") !== -1) endpoint = "/social/posts/" + post.post_id + "/sync-instagram";
                    else if (platText.indexOf("thread") !== -1) endpoint = "/social/posts/" + post.post_id + "/sync-threads";

                    btnSyncSocial.disabled = true;
                    btnSyncSocial.textContent = "Đang đồng bộ...";
                    try {
                        const stat = await BlossomAPI.request(endpoint, { method: "POST", body: {} });
                        renderStatsBox(stat);
                        UI.toast("success", "Đồng bộ thành công", "Đã cập nhật số liệu mới nhất từ mạng xã hội.");
                    } catch (err) {
                        UI.toast("error", "Không thể đồng bộ trực tiếp", err.message || "Vui lòng kiểm tra Token/ID bài đăng hoặc dùng Nhập số liệu.");
                    } finally {
                        btnSyncSocial.disabled = false;
                        btnSyncSocial.textContent = "Đồng bộ MXH";
                    }
                });
            }

            const btnManualStats = document.getElementById("btnModalManualStats");
            if (btnManualStats) {
                btnManualStats.addEventListener("click", async function () {
                    const formBody =
                        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px;">' +
                            '<div><label>Reach</label><input type="number" min="0" id="statReach" value="0" style="width:100%;padding:6px 8px;border:1px solid #e2cdd5;border-radius:6px;"></div>' +
                            '<div><label>Views</label><input type="number" min="0" id="statViews" value="0" style="width:100%;padding:6px 8px;border:1px solid #e2cdd5;border-radius:6px;"></div>' +
                            '<div><label>Likes</label><input type="number" min="0" id="statLikes" value="0" style="width:100%;padding:6px 8px;border:1px solid #e2cdd5;border-radius:6px;"></div>' +
                            '<div><label>Comments</label><input type="number" min="0" id="statComments" value="0" style="width:100%;padding:6px 8px;border:1px solid #e2cdd5;border-radius:6px;"></div>' +
                            '<div><label>Shares</label><input type="number" min="0" id="statShares" value="0" style="width:100%;padding:6px 8px;border:1px solid #e2cdd5;border-radius:6px;"></div>' +
                        '</div>';
                    const ok = await UI.modal({
                        title: "Nhập số liệu thống kê thủ công",
                        body: formBody,
                        actions: [
                            { label: "Hủy", variant: "ghost", value: false },
                            { label: "Lưu số liệu", variant: "primary", value: "SAVE" }
                        ]
                    });
                    if (ok !== "SAVE") return;
                    const payload = {
                        reach_count: Number(document.getElementById("statReach").value || 0),
                        view_count: Number(document.getElementById("statViews").value || 0),
                        like_count: Number(document.getElementById("statLikes").value || 0),
                        comment_count: Number(document.getElementById("statComments").value || 0),
                        share_count: Number(document.getElementById("statShares").value || 0),
                        source_type: "MANUAL"
                    };
                    try {
                        const saved = await BlossomAPI.request("/posts/" + post.post_id + "/statistics", {
                            method: "POST",
                            body: payload
                        });
                        renderStatsBox(saved);
                        UI.toast("success", "Đã lưu số liệu", "Dữ liệu thống kê thủ công đã được ghi nhận.");
                    } catch (err) {
                        UI.toast("error", "Lỗi lưu số liệu", err.message);
                    }
                });
            }
        }
    }

    document.addEventListener("DOMContentLoaded", function () {
        const params = new URLSearchParams(location.search);
        const openId = params.get("open");
        if (openId) {
            setTimeout(function () {
                openPostDetailModal(Number(openId));
            }, 300);
        }
    });

    global.openPostDetailModal = openPostDetailModal;
    global.PostDetailModal = {
        open: openPostDetailModal,
        copyCaption: copyCaption,
        downloadMedia: downloadMedia
    };
    global.copyCaption = copyCaption;
    global.downloadMedia = downloadMedia;
})(window);

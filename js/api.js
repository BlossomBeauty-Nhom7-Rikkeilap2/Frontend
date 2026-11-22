/* =========================================================
   BLOSSOM BEAUTY STORE - CENTRAL API CLIENT (js/api.js)
   Module quan ly ket noi toi Backend FastAPI tai http://localhost:8000/api
   Cung cap:
   - Tu dong dinh kem JWT Access Token qua header Authorization
   - Tu dong chuyen huong ve trang Login khi gap HTTP 401 Unauthorized
   - Ho tro request JSON va FormData (Upload media)
   - Ho tro Graceful Offline Fallback khi Backend chua khoi chay
   ========================================================= */
(function (global) {
    "use strict";

    const API_BASE = "http://localhost:8000/api";
    const SERVER_BASE = "http://localhost:8000";
    const TOKEN_KEY = "blossom_access_token";
    const USER_KEY = "blossom_user";

    function resolveMediaUrl(url) {
        if (!url || typeof url !== "string") return "";
        if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:") || url.startsWith("blob:")) {
            return url;
        }
        if (url.startsWith("/")) {
            return SERVER_BASE + url;
        }
        return SERVER_BASE + "/" + url;
    }

    function getToken() {
        try {
            return localStorage.getItem(TOKEN_KEY);
        } catch (e) {
            return null;
        }
    }

    function setToken(token) {
        try {
            if (token) localStorage.setItem(TOKEN_KEY, token);
            else localStorage.removeItem(TOKEN_KEY);
        } catch (e) {}
    }

    function clearToken() {
        try {
            localStorage.removeItem(TOKEN_KEY);
        } catch (e) {}
    }

    function getLoginRedirectUrl() {
        const path = location.pathname;
        const idx = path.indexOf("/pages/");
        if (idx !== -1) {
            return path.slice(0, idx) + "/pages/auth/login.html";
        }
        return "pages/auth/login.html";
    }

    async function request(endpoint, options) {
        options = options || {};
        const url = endpoint.startsWith("http") ? endpoint : API_BASE + (endpoint.startsWith("/") ? endpoint : "/" + endpoint);
        const headers = options.headers || {};
        const token = getToken();

        if (token && !headers["Authorization"]) {
            headers["Authorization"] = "Bearer " + token;
        }

        const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
        if (!isFormData && options.body && typeof options.body === "object") {
            headers["Content-Type"] = "application/json";
            options.body = JSON.stringify(options.body);
        }

        const config = {
            method: (options.method || "GET").toUpperCase(),
            headers: headers,
            credentials: "include"
        };

        if (config.method !== "GET" && config.method !== "HEAD" && options.body !== undefined) {
            config.body = options.body;
        }

        let response;
        try {
            response = await fetch(url, config);
        } catch (netErr) {
            console.warn("[BlossomAPI] Network error or server offline:", netErr.message);
            throw new Error("Không thể kết nối máy chủ (" + netErr.message + "). Vui lòng đảm bảo Backend đang chạy tại " + API_BASE);
        }

        if (response.status === 401) {
            clearToken();
            try { localStorage.removeItem(USER_KEY); } catch (e) {}
            if (!location.pathname.includes("/pages/auth/login.html")) {
                location.href = getLoginRedirectUrl();
            }
            throw new Error("Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.");
        }

        if (!response.ok) {
            let errorDetail = "Yêu cầu thất bại với mã lỗi " + response.status;
            try {
                const errData = await response.json();
                if (errData && errData.detail) {
                    if (typeof errData.detail === "string") {
                        errorDetail = errData.detail;
                    } else if (Array.isArray(errData.detail)) {
                        errorDetail = errData.detail.map(d => d.msg || JSON.stringify(d)).join(", ");
                    }
                }
            } catch (e) {}
            throw new Error(errorDetail);
        }

        if (response.status === 204) return null;

        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
            return await response.json();
        }
        return await response.text();
    }

    async function login(usernameOrEmail, password) {
        const payload = {
            username_or_email: String(usernameOrEmail || "").trim(),
            password: String(password || "")
        };

        const res = await request("/auth/login", {
            method: "POST",
            body: payload
        });

        if (res && res.access_token) {
            setToken(res.access_token);
        }

        if (res && res.user) {
            const user = {
                userId: res.user.user_id,
                username: res.user.username,
                email: res.user.email,
                fullName: res.user.full_name,
                role: res.user.role_code === "MANAGER" ? "MANAGER" : "STAFF",
                roleCode: res.user.role_code,
                position: res.user.role_name || (res.user.role_code === "MANAGER" ? "Marketing Manager" : "Marketing Staff"),
                avatarUrl: res.user.avatar_url || ""
            };
            try {
                localStorage.setItem(USER_KEY, JSON.stringify(user));
            } catch (e) {}
            return { token: res.access_token, user: user };
        }
        return res;
    }

    async function logout() {
        try {
            await request("/auth/logout", { method: "POST" });
        } catch (e) {
            /* Bo qua loi mang khi dang xuat */
        } finally {
            clearToken();
            try { localStorage.removeItem(USER_KEY); } catch (e) {}
        }
    }

    async function getCurrentUser() {
        return await request("/auth/me");
    }

    async function uploadMedia(file) {
        const formData = new FormData();
        formData.append("file", file);
        return await request("/posts/upload-media", {
            method: "POST",
            body: formData
        });
    }

    global.BlossomAPI = {
        API_BASE: API_BASE,
        SERVER_BASE: SERVER_BASE,
        TOKEN_KEY: TOKEN_KEY,
        USER_KEY: USER_KEY,
        getToken: getToken,
        setToken: setToken,
        clearToken: clearToken,
        resolveMediaUrl: resolveMediaUrl,
        request: request,
        login: login,
        logout: logout,
        getCurrentUser: getCurrentUser,
        uploadMedia: uploadMedia
    };
})(window);

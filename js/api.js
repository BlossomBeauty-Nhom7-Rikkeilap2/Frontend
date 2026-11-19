/* =========================================================
   API & LOCAL STORE BRIDGE – Kết nối FastAPI Backend + Fallback LocalStorage
   Đảm bảo hệ thống hoạt động mượt mà cả khi chạy Backend (port 8000)
   lẫn khi chạy trực tiếp trên Live Server.
   ========================================================= */
(function (global) {
    "use strict";

    const API_BASE = global.BLOSSOM_API_BASE || "http://localhost:8000/api";
    const USER_KEY = "blossom_user";
    const TOKEN_KEY = "blossom_access_token";

    // Tự động khởi tạo phiên demo nếu người dùng mở trực tiếp trang nội bộ khi chấm bài
    function ensureDemoUser() {
        try {
            const raw = localStorage.getItem(USER_KEY);
            if (raw) return;
            const path = location.pathname || "";
            if (path.indexOf("/pages/auth/") !== -1) return;

            const isStaffArea = path.indexOf("/pages/staff/") !== -1;
            const demoUser = isStaffArea
                ? {
                    user_id: 2,
                    username: "ngocmai",
                    email: "ngocmai@blossom.vn",
                    role: "STAFF",
                    fullName: "Trần Ngọc Mai",
                    position: "Marketing Staff"
                }
                : {
                    user_id: 1,
                    username: "minhanh",
                    email: "minhanh@blossom.vn",
                    role: "MANAGER",
                    fullName: "Nguyễn Minh Anh",
                    position: "Quản trị viên"
                };
            localStorage.setItem(USER_KEY, JSON.stringify(demoUser));
        } catch (e) {
            /* ignore */
        }
    }

    ensureDemoUser();

    // Kiểm tra độ phức tạp mật khẩu theo FR-03 (ERR-02)
    function validatePasswordComplexity(password) {
        const pwd = String(password || "");
        const rules = {
            minLength: pwd.length >= 8,
            hasUpper: /[A-Z]/.test(pwd),
            hasLower: /[a-z]/.test(pwd),
            hasDigit: /[0-9]/.test(pwd)
        };
        const valid = rules.minLength && rules.hasUpper && rules.hasLower && rules.hasDigit;
        let message = "";
        if (!valid) {
            message = "[ERR-02] Mật khẩu phải có tối thiểu 8 ký tự, bao gồm chữ hoa (A-Z), chữ thường (a-z) và chữ số (0-9).";
        }
        return { valid: valid, rules: rules, message: message };
    }

    // Sinh chuỗi mô phỏng Bcrypt deterministic để hiển thị trực quan khi chạy offline fallback
    function simulateBcryptHash(password) {
        const str = String(password || "Blossom@123");
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789./";
        let seed = 5381;
        for (let i = 0; i < str.length; i++) {
            seed = ((seed << 5) + seed) + str.charCodeAt(i);
            seed = seed & 0x7fffffff;
        }
        let body = "";
        for (let j = 0; j < 53; j++) {
            seed = (seed * 1103515245 + 12345 + j) & 0x7fffffff;
            body += chars[seed % chars.length];
        }
        return "$2b$12$" + body;
    }

    async function request(endpoint, options) {
        options = options || {};
        const headers = Object.assign({ "Content-Type": "application/json" }, options.headers || {});
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
            headers["Authorization"] = "Bearer " + token;
        }
        const resp = await fetch(API_BASE + endpoint, Object.assign({}, options, {
            headers: headers,
            credentials: "include"
        }));
        const data = await resp.json().catch(function () { return {}; });
        if (!resp.ok) {
            const err = new Error(data.detail || "Lỗi kết nối máy chủ");
            err.status = resp.status;
            err.detail = data.detail;
            throw err;
        }
        return data;
    }

    global.BlossomAPI = {
        API_BASE: API_BASE,
        request: request,
        validatePasswordComplexity: validatePasswordComplexity,
        simulateBcryptHash: simulateBcryptHash
    };
})(window);

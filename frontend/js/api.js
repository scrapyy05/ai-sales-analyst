/**
 * ==========================================================================
 * AI Sales Analyst — Centralized API Layer (js/api.js)
 * Handles authentication headers, timeouts, and global HTTP error codes
 * ==========================================================================
 */

const API_BASE_URL = window.location.origin;

class API {
    /**
     * Centralized request handler
     */
    static async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const headers = options.headers || {};

        // 1. Attach Authorization header if JWT token exists
        const token = localStorage.getItem('jwt_token');
        if (token && !headers['Authorization']) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // 2. Set default Content-Type to JSON (unless FormData is passed)
        if (!options.body || !(options.body instanceof FormData)) {
            if (!headers['Content-Type']) {
                headers['Content-Type'] = 'application/json';
            }
        }

        const config = {
            ...options,
            headers
        };

        // 3. Setup Timeout (15 seconds default, 30 seconds for AI query)
        const timeoutMs = options.timeout || (endpoint.includes('/ask') ? 45000 : 15000);
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeoutMs);
        config.signal = controller.signal;

        try {
            const response = await fetch(url, config);
            clearTimeout(id);

            // Handle HTTP Error Status Codes
            if (!response.ok) {
                await API.handleErrorResponse(response);
            }

            // Return JSON or empty object for 204 No Content
            if (response.status === 204) return null;
            return await response.json();

        } catch (error) {
            clearTimeout(id);
            if (error.name === 'AbortError') {
                UI.showToast("⏳ Request Timed Out. The server took too long to respond.", "danger");
                throw new Error("Request Timeout");
            }
            if (!error.isHandled) {
                console.error("Network / API Error:", error);
                UI.showToast(error.message || "❌ Network Error: Could not connect to backend service.", "danger");
            }
            throw error;
        }
    }

    /**
     * Intercept and handle HTTP error codes
     */
    static async handleErrorResponse(response) {
        let errorDetail = "An unexpected error occurred.";
        try {
            const data = await response.json();
            errorDetail = data.detail || data.message || JSON.stringify(data);
        } catch (e) {
            errorDetail = response.statusText;
        }

        const err = new Error(errorDetail);
        err.status = response.status;
        err.isHandled = true;

        switch (response.status) {
            case 401:
                UI.showToast("🔒 Authentication required. Redirecting to login...", "warning");
                localStorage.removeItem('jwt_token');
                localStorage.removeItem('user_email');
                setTimeout(() => {
                    if (!window.location.pathname.includes('login.html')) {
                        window.location.href = 'login.html';
                    }
                }, 1500);
                break;

            case 403:
                UI.showToast("🚫 Access Denied: You do not have permission to perform this action.", "danger");
                break;

            case 404:
                UI.showToast(`🔍 Resource Not Found (${errorDetail})`, "warning");
                break;

            case 429:
                UI.showToast("⚡ Rate Limit Exceeded! You are sending requests too fast. Please wait a moment.", "warning");
                break;

            case 500:
                UI.showToast("💥 Internal Server Error. Please contact backend support.", "danger");
                break;

            default:
                UI.showToast(`❌ Error ${response.status}: ${errorDetail}`, "danger");
                break;
        }

        throw err;
    }

    // Convenience HTTP methods
    static get(endpoint, options = {}) {
        return API.request(endpoint, { ...options, method: 'GET' });
    }

    static post(endpoint, body, options = {}) {
        const config = { ...options, method: 'POST' };
        if (body instanceof FormData || typeof body === 'string' || body instanceof URLSearchParams) {
            config.body = body;
        } else if (body !== undefined && body !== null) {
            config.body = JSON.stringify(body);
        }
        return API.request(endpoint, config);
    }

    static put(endpoint, body, options = {}) {
        const config = { ...options, method: 'PUT' };
        if (body !== undefined && body !== null) {
            config.body = JSON.stringify(body);
        }
        return API.request(endpoint, config);
    }

    static delete(endpoint, options = {}) {
        return API.request(endpoint, { ...options, method: 'DELETE' });
    }
}

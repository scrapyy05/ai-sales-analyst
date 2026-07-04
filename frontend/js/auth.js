/**
 * ==========================================================================
 * AI Sales Analyst — Authentication Controller (js/auth.js)
 * Handles Login, Register, Logout, and Route Guarding
 * ==========================================================================
 */

class Auth {
    /**
     * Check authentication status on protected pages
     */
    static guard() {
        const token = localStorage.getItem('jwt_token');
        const isAuthPage = window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html');

        if (!token && !isAuthPage) {
            window.location.href = 'login.html';
            return false;
        }

        if (token && isAuthPage) {
            window.location.href = 'dashboard.html';
            return false;
        }

        if (token && !isAuthPage) {
            Auth.updateProfileUI();
            Auth.initLogout();
        }

        return true;
    }

    /**
     * Handle Login Form Submission
     */
    static async login(email, password, submitBtn) {
        if (!email || !password) {
            UI.showToast("Please enter both email and password.", "warning");
            return;
        }

        const originalText = submitBtn.textContent;
        submitBtn.textContent = "Signing In...";
        submitBtn.disabled = true;

        try {
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const res = await API.post('/auth/login', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            if (res && res.access_token) {
                localStorage.setItem('jwt_token', res.access_token);
                localStorage.setItem('user_email', email);
                UI.showToast("⚡ Welcome back! Redirecting to dashboard...", "success");
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            }
        } catch (error) {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    /**
     * Handle Register Form Submission
     */
    static async register(email, password, fullName, submitBtn) {
        if (!email || !password || !fullName) {
            UI.showToast("Please fill in all required fields.", "warning");
            return;
        }

        if (password.length < 6) {
            UI.showToast("Password must be at least 6 characters.", "warning");
            return;
        }

        const originalText = submitBtn.textContent;
        submitBtn.textContent = "Creating Account...";
        submitBtn.disabled = true;

        try {
            await API.post('/auth/register', {
                email: email,
                password: password,
                full_name: fullName,
                role: 'user'
            });

            UI.showToast("🎉 Account created successfully! Logging you in...", "success");
            await Auth.login(email, password, submitBtn);

        } catch (error) {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    /**
     * Logout Handler
     */
    static initLogout() {
        const logoutBtns = document.querySelectorAll('.logout-btn');
        logoutBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                UI.showConfirmDialog({
                    title: "Sign Out",
                    message: "Are you sure you want to log out of your enterprise account?",
                    confirmText: "Sign Out",
                    confirmVariant: "danger",
                    onConfirm: () => {
                        localStorage.removeItem('jwt_token');
                        localStorage.removeItem('user_email');
                        UI.showToast("You have been signed out safely.", "success");
                        setTimeout(() => {
                            window.location.href = 'login.html';
                        }, 800);
                    }
                });
            });
        });
    }

    /**
     * Update Navbar and Sidebar User Profile Display
     */
    static updateProfileUI() {
        const email = localStorage.getItem('user_email') || 'Executive User';
        const name = email.split('@')[0].replace('.', ' ');
        const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
        const avatarLetter = capitalizedName.charAt(0).toUpperCase();

        const avatarElements = document.querySelectorAll('.avatar');
        const userNameElements = document.querySelectorAll('.user-name');
        const userEmailElements = document.querySelectorAll('.user-email-display');

        avatarElements.forEach(el => el.textContent = avatarLetter);
        userNameElements.forEach(el => el.textContent = capitalizedName);
        userEmailElements.forEach(el => el.textContent = email);
    }
}

// Execute guard on DOM load
document.addEventListener('DOMContentLoaded', () => {
    Auth.guard();
});

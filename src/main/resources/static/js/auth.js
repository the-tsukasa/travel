// ==============================
// auth.js
// 统一的认证工具库
// ==============================

// 使用 IIFE 包装，避免重复声明错误
(function() {
    'use strict';
    
    // 如果已经加载过，直接返回
    if (window.TokenUtil && window.ApiUtil && window.AuthUtil) {
        console.log('auth.js 已经加载过了，跳过重复加载');
        return;
    }

    /**
     * Token 工具类
     */
    const TokenUtil = {
        /**
         * 获取 token
         */
        getToken() {
            return localStorage.getItem('token');
        },

        /**
         * 设置 token
         */
        setToken(token) {
            localStorage.setItem('token', token);
        },

        /**
         * 清除 token
         */
        clearToken() {
            localStorage.removeItem('token');
            localStorage.removeItem('username');
        },

        /**
         * 检查 token 是否存在
         */
        hasToken() {
            return !!this.getToken();
        },

        /**
         * 解析 token 并获取 payload
         */
        parseToken(token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                return payload;
            } catch (e) {
                return null;
            }
        },

        /**
         * 检查 token 是否过期
         */
        isTokenExpired(token) {
            const payload = this.parseToken(token);
            if (!payload || !payload.exp) {
                return true;
            }
            const exp = payload.exp * 1000; // JWT exp 是秒，转换为毫秒
            return Date.now() >= exp;
        },

        /**
         * 获取 token 剩余有效时间（分钟）
         */
        getTokenExpiresIn(token) {
            const payload = this.parseToken(token);
            if (!payload || !payload.exp) {
                return 0;
            }
            const exp = payload.exp * 1000;
            const now = Date.now();
            return Math.floor((exp - now) / 1000 / 60);
        },

        /**
         * 获取 token 过期时间
         */
        getTokenExpiresAt(token) {
            const payload = this.parseToken(token);
            if (!payload || !payload.exp) {
                return null;
            }
            return new Date(payload.exp * 1000);
        }
    };

    /**
     * API 请求工具类
     */
    const ApiUtil = {
        /**
         * 获取默认请求头
         */
        getHeaders(includeAuth = true) {
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (includeAuth) {
                const token = TokenUtil.getToken();
                if (token) {
                    headers['Authorization'] = 'Bearer ' + token;
                }
            }
            
            return headers;
        },

        /**
         * 统一的 fetch 请求，自动处理认证错误
         */
        async fetch(url, options = {}) {
            const token = TokenUtil.getToken();
            
            // 检查 token 是否存在
            if (!token && options.requireAuth !== false) {
                throw new Error('NOT_AUTHENTICATED');
            }

            // 检查 token 是否过期
            if (token && TokenUtil.isTokenExpired(token)) {
                TokenUtil.clearToken();
                throw new Error('TOKEN_EXPIRED');
            }

            // 合并请求头
            const headers = {
                ...this.getHeaders(),
                ...(options.headers || {})
            };

            try {
                const response = await fetch(url, {
                    ...options,
                    headers
                });

                // 处理认证错误
                if (response.status === 401 || response.status === 403) {
                    TokenUtil.clearToken();
                    
                    // 尝试解析错误信息
                    let errorMessage = 'ログインが必要です。';
                    try {
                        const errorData = await response.clone().json();
                        if (errorData.message) {
                            errorMessage = errorData.message;
                        }
                    } catch (e) {
                        // 如果不是 JSON，使用默认消息
                    }

                    // 如果不是在登录页面，提示并重定向
                    if (!window.location.pathname.includes('login.html')) {
                        if (confirm(errorMessage + '\n\nログインページに移動しますか？')) {
                            window.location.href = '/login.html';
                        }
                    }
                    
                    throw new Error('AUTHENTICATION_FAILED');
                }

                return response;
            } catch (error) {
                // 处理网络错误
                if (error.message === 'NOT_AUTHENTICATED') {
                    if (confirm('ログインが必要です。\n\nログインページに移動しますか？')) {
                        window.location.href = '/login.html';
                    }
                    throw error;
                }
                
                if (error.message === 'TOKEN_EXPIRED') {
                    if (confirm('ログイン期限が切れました。\n\nログインページに移動しますか？')) {
                        window.location.href = '/login.html';
                    }
                    throw error;
                }

                throw error;
            }
        },

        /**
         * GET 请求
         */
        async get(url, options = {}) {
            return this.fetch(url, { ...options, method: 'GET' });
        },

        /**
         * POST 请求
         */
        async post(url, data, options = {}) {
            return this.fetch(url, {
                ...options,
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        /**
         * PUT 请求
         */
        async put(url, data, options = {}) {
            return this.fetch(url, {
                ...options,
                method: 'PUT',
                body: JSON.stringify(data)
            });
        },

        /**
         * DELETE 请求
         */
        async delete(url, options = {}) {
            return this.fetch(url, { ...options, method: 'DELETE' });
        }
    };

    /**
     * 认证状态检查
     */
    const AuthUtil = {
        /**
         * 检查当前登录状态
         */
        async checkAuth() {
            const token = TokenUtil.getToken();
            
            if (!token) {
                return { authenticated: false, reason: 'NO_TOKEN' };
            }

            if (TokenUtil.isTokenExpired(token)) {
                TokenUtil.clearToken();
                return { authenticated: false, reason: 'TOKEN_EXPIRED' };
            }

            try {
                const response = await ApiUtil.get('/api/user/me');
                if (response.ok) {
                    const user = await response.json();
                    return { 
                        authenticated: true, 
                        user,
                        expiresIn: TokenUtil.getTokenExpiresIn(token),
                        expiresAt: TokenUtil.getTokenExpiresAt(token)
                    };
                } else {
                    TokenUtil.clearToken();
                    return { authenticated: false, reason: 'TOKEN_INVALID' };
                }
            } catch (error) {
                return { authenticated: false, reason: 'NETWORK_ERROR', error };
            }
        },

        /**
         * 要求认证，如果未认证则重定向
         */
        async requireAuth() {
            const authStatus = await this.checkAuth();
            
            if (!authStatus.authenticated) {
                if (confirm('ログインが必要です。\n\nログインページに移動しますか？')) {
                    window.location.href = '/login.html';
                }
                return false;
            }
            
            return true;
        }
    };

    // 导出到全局作用域
    window.TokenUtil = TokenUtil;
    window.ApiUtil = ApiUtil;
    window.AuthUtil = AuthUtil;
})(); // IIFE 结束

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
                    // 先记录详细的错误信息，不立即清除 Token
                    let errorMessage = 'ログインが必要です。';
                    let errorDetails = null;
                    
                    try {
                        const errorData = await response.clone().json();
                        if (errorData.message) {
                            errorMessage = errorData.message;
                        }
                        errorDetails = errorData;
                    } catch (e) {
                        // 如果不是 JSON，使用默认消息
                        try {
                            const errorText = await response.clone().text();
                            errorDetails = { raw: errorText };
                        } catch (e2) {
                            errorDetails = { error: '无法读取错误信息' };
                        }
                    }

                    // 记录详细的错误信息到控制台
                    const errorInfo = {
                        url: url,
                        method: options.method || 'GET',
                        status: response.status,
                        statusText: response.statusText,
                        requestHeaders: headers,
                        token: token ? token.substring(0, 30) + '...' : '无',
                        tokenFull: token ? token : '无',
                        tokenPayload: token ? TokenUtil.parseToken(token) : null,
                        tokenExpired: token ? TokenUtil.isTokenExpired(token) : null,
                        errorDetails: errorDetails,
                        responseHeaders: {
                            'content-type': response.headers.get('content-type'),
                            'www-authenticate': response.headers.get('www-authenticate'),
                            'authorization': response.headers.get('authorization')
                        }
                    };
                    
                    console.error('认证失败详情:', errorInfo);
                    console.error('错误详情 JSON:', JSON.stringify(errorInfo, null, 2));

                    // 检查是否是真正的认证失败（Token 无效）还是其他问题
                    // 如果 Token 本身是有效的，可能是后端配置问题，不要立即清除
                    const isTokenValid = token && !TokenUtil.isTokenExpired(token);
                    
                    // 如果不是在登录页面，提示并询问是否清除 Token
                    if (!window.location.pathname.includes('login.html')) {
                        const shouldClear = confirm(
                            `认证失败 (${response.status})\n\n` +
                            `错误信息: ${errorMessage}\n\n` +
                            `Token 状态: ${isTokenValid ? '有效' : '无效'}\n\n` +
                            `这可能是因为：\n` +
                            `1. Token 已过期或无效\n` +
                            `2. 后端配置问题\n` +
                            `3. 请求路径或方法错误\n\n` +
                            `是否清除 Token 并跳转到登录页面？\n\n` +
                            `（点击"取消"保留 Token，可以在控制台查看详细错误信息）`
                        );
                        
                        if (shouldClear) {
                            TokenUtil.clearToken();
                            window.location.href = '/login.html';
                        }
                    } else {
                        // 在登录页面，直接清除 Token
                        TokenUtil.clearToken();
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

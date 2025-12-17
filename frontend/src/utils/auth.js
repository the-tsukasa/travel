/**
 * Token 工具函数
 */
export const TokenUtil = {
  getToken() {
    return localStorage.getItem('token')
  },

  setToken(token) {
    localStorage.setItem('token', token)
  },

  clearToken() {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
  },

  hasToken() {
    return !!this.getToken()
  },

  parseToken(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload
    } catch (e) {
      return null
    }
  },

  isTokenExpired(token) {
    const payload = this.parseToken(token)
    if (!payload || !payload.exp) {
      return true
    }
    const exp = payload.exp * 1000 // JWT exp 是秒，转换为毫秒
    return Date.now() >= exp
  },
}

/**
 * 检查认证状态
 */
export const checkAuth = async () => {
  const token = TokenUtil.getToken()
  
  if (!token) {
    return { authenticated: false, reason: 'NO_TOKEN' }
  }

  if (TokenUtil.isTokenExpired(token)) {
    TokenUtil.clearToken()
    return { authenticated: false, reason: 'TOKEN_EXPIRED' }
  }

  try {
    const response = await fetch('/api/user/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (response.ok) {
      const user = await response.json()
      return { authenticated: true, user }
    } else {
      TokenUtil.clearToken()
      return { authenticated: false, reason: 'TOKEN_INVALID' }
    }
  } catch (error) {
    return { authenticated: false, reason: 'NETWORK_ERROR', error }
  }
}

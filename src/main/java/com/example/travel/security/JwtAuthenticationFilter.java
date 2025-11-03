package com.example.travel.security;

import java.io.IOException;
import java.util.Collections;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.example.travel.util.JwtUtil;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public JwtAuthenticationFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    @SuppressWarnings("NullableProblems") HttpServletResponse response,
                                    @SuppressWarnings("NullableProblems") FilterChain filterChain)
            throws ServletException, IOException {

        //  0️⃣ 放行 OPTIONS 请求（CORS 预检请求）
        String method = request.getMethod();
        if ("OPTIONS".equalsIgnoreCase(method)) {
            filterChain.doFilter(request, response);
            return;
        }

        //  1️⃣ 放行登录和注册接口
        String path = request.getServletPath();
        if (path.equals("/api/auth/login") || path.equals("/api/auth/register")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 2️⃣ 从请求头获取 Authorization
        String authHeader = request.getHeader("Authorization");
        
        log.info("JWT Filter - Path: {}, Method: {}, 检查 Authorization 头", path, method);

        // 3️⃣ 如果没有 Token 或 Token 不以 "Bearer " 开头，跳过
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("JWT Filter - 没有 Authorization 头或格式不正确，跳过 - Path: {}, Method: {}", path, method);
            filterChain.doFilter(request, response);
            return;
        }

        // 4️⃣ 截取真正的 Token
        String token = authHeader.substring(7);
        log.info("JWT Filter - 提取 Token: {}...", token.substring(0, Math.min(30, token.length())));
        log.info("JWT Filter - Token 完整长度: {}", token.length());

        try {
            // 5️⃣ 解析 Token
            log.info("JWT Filter - 开始解析 Token - Method: {}", method);
            Claims claims = jwtUtil.getClaims(token);
            String username = claims.getSubject();
            String role = claims.get("role", String.class);   // 从 token 中读取角色
            log.info("JWT Filter - Token 解析成功: username={}, role={}", username, role);

            // 5️⃣ 如果当前没有认证，则手动创建认证信息
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                // 确保 role 不为 null，默认为 USER
                if (role == null || role.trim().isEmpty()) {
                    role = "USER";
                    log.info("JWT Filter - role 为空，使用默认值 USER");
                }
                
                // 确保 role 格式正确（去掉可能的 ROLE_ 前缀，后面会重新添加）
                role = role.toUpperCase();
                if (role.startsWith("ROLE_")) {
                    role = role.substring(5);
                }

                // 封装角色 -> GrantedAuthority（注意要加 "ROLE_" 前缀）
                SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + role);
                log.info("JWT Filter - 创建 Authority: {}", authority.getAuthority());

                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                username,
                                null,
                                Collections.singletonList(authority)  // 传入角色权限
                        );

                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // 将认证信息放入上下文
                SecurityContextHolder.getContext().setAuthentication(authToken);
                log.info("JWT Filter - 认证成功: username={}, role={}, path={}", username, role, path);
            } else {
                log.info("JWT Filter - 已存在认证信息，跳过设置");
            }

        } catch (Exception e) {
            // Token 解析失败，清除 SecurityContext
            SecurityContextHolder.clearContext();
            
            // 记录错误信息（区分警告和错误）
            // 如果路径需要认证，记录为错误；如果是放行的路径，记录为警告
            boolean isPublicPath = path.equals("/api/auth/login") || 
                                 path.equals("/api/auth/register") ||
                                 path.startsWith("/api/notes") && method.equals("GET") ||
                                 path.startsWith("/api/spots") && method.equals("GET");
            
            if (isPublicPath) {
                log.warn("JWT Token 解析失败（放行路径，不影响访问）- Path: {}, Method: {}, Error: {}", 
                        path, method, e.getMessage());
            } else {
                log.error("JWT Token 解析失败 - Path: {}, Method: {}, Error: {}", 
                        path, method, e.getMessage(), e);
                // token 和 authHeader 已经在前面验证过，可以直接使用
                try {
                    if (!token.isEmpty()) {
                        log.error("JWT Token 解析失败 - Token 前30字符: {}", 
                                token.substring(0, Math.min(30, token.length())));
                    }
                    // authHeader 已经验证过不为null，直接使用
                    log.error("JWT Token 解析失败 - Authorization 头: {}", 
                            authHeader.substring(0, Math.min(20, authHeader.length())) + "...");
                } catch (Exception logEx) {
                    // 忽略日志记录时的异常
                }
            }
            
            // 让 Spring Security 的 AuthenticationEntryPoint 处理认证失败
            // 如果请求不需要认证（permitAll），Spring Security 会允许继续
            // 如果请求需要认证，Spring Security 会返回 401
        }

        // 继续过滤链，让 Spring Security 根据配置决定是否允许访问
        filterChain.doFilter(request, response);
    }
}

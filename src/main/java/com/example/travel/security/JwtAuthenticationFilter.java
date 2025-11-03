package com.example.travel.security;

import com.example.travel.util.JwtUtil;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    @SuppressWarnings("NullableProblems") HttpServletResponse response,
                                    @SuppressWarnings("NullableProblems") FilterChain filterChain)
            throws ServletException, IOException {

        //  0️⃣ 放行登录和注册接口
        String path = request.getServletPath();
        if (path.equals("/api/auth/login") || path.equals("/api/auth/register")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 1️⃣ 从请求头获取 Authorization
        String authHeader = request.getHeader("Authorization");

        // 2️⃣ 如果没有 Token 或 Token 不以 "Bearer " 开头，跳过
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 3️⃣ 截取真正的 Token
        String token = authHeader.substring(7);

        try {
            // 4️⃣ 解析 Token
            Claims claims = JwtUtil.getClaims(token);
            String username = claims.getSubject();
            String role = claims.get("role", String.class);   // 从 token 中读取角色

            // 5️⃣ 如果当前没有认证，则手动创建认证信息
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                // 确保 role 不为 null，默认为 USER
                if (role == null || role.trim().isEmpty()) {
                    role = "USER";
                }
                
                // 确保 role 格式正确（去掉可能的 ROLE_ 前缀，后面会重新添加）
                role = role.toUpperCase();
                if (role.startsWith("ROLE_")) {
                    role = role.substring(5);
                }

                // 封装角色 -> GrantedAuthority（注意要加 "ROLE_" 前缀）
                SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + role);

                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                username,
                                null,
                                Collections.singletonList(authority)  // 传入角色权限
                        );

                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // 将认证信息放入上下文
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }

        } catch (Exception e) {
            // Token 解析失败，清除 SecurityContext 并记录错误
            SecurityContextHolder.clearContext();
            log.warn("JWT Token 解析失败: {} - Path: {}", e.getMessage(), path);
            log.debug("Token 解析异常详情", e);
            // 让 Spring Security 的 AuthenticationEntryPoint 处理认证失败
            // 如果请求不需要认证，继续执行
        }

        // 继续过滤链
        filterChain.doFilter(request, response);
    }
}

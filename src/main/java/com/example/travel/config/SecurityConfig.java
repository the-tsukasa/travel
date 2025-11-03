package com.example.travel.config;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.example.travel.security.CustomUserDetailsService;
import com.example.travel.security.JwtAuthenticationFilter;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@EnableWebSecurity
@Configuration
@RequiredArgsConstructor
@EnableMethodSecurity  // 支持 @PreAuthorize
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomUserDetailsService userDetailsService;
    private final ObjectMapper objectMapper;

    // 1) 密码加密器
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // 2) AuthenticationManager 使用官方推荐新写法
    @Bean
    public AuthenticationManager authenticationManager(HttpSecurity http, PasswordEncoder passwordEncoder) throws Exception {
        AuthenticationManagerBuilder builder = http.getSharedObject(AuthenticationManagerBuilder.class);
        builder.userDetailsService(userDetailsService).passwordEncoder(passwordEncoder);
        return builder.build();
    }

    // 自定义未认证处理器，返回 JSON 格式的错误信息
    @Bean
    public AuthenticationEntryPoint authenticationEntryPoint() {
        return (request, response, authException) -> {
            // 确保响应没有被提交
            if (response.isCommitted()) {
                return;
            }
            
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            
            // 获取原始请求路径
            String path = request.getRequestURI();
            // 如果路径是 /error，尝试从多个地方获取原始路径
            if ("/error".equals(path)) {
                // 尝试从错误属性中获取
                String originalPath = (String) request.getAttribute("jakarta.servlet.error.request_uri");
                if (originalPath == null) {
                    originalPath = (String) request.getAttribute("javax.servlet.error.request_uri");
                }
                // 尝试从请求参数中获取
                if (originalPath == null) {
                    originalPath = request.getParameter("originalPath");
                }
                // 使用 servlet path 或 path info
                if (originalPath == null) {
                    String servletPath = request.getServletPath();
                    String pathInfo = request.getPathInfo();
                    if (servletPath != null && !servletPath.isEmpty()) {
                        originalPath = servletPath + (pathInfo != null ? pathInfo : "");
                    }
                }
                if (originalPath != null && !originalPath.isEmpty()) {
                    path = originalPath;
                }
            }
            
            Map<String, Object> error = new HashMap<>();
            error.put("status", 401);
            error.put("error", "Unauthorized");
            error.put("message", "ログインが必要です。Token が無効または期限切れです。");
            error.put("path", path);
            
            try {
                objectMapper.writeValue(response.getWriter(), error);
            } catch (IOException e) {
                // 如果写入失败，记录错误但不抛出异常
                log.error("无法写入错误响应", e);
            }
        };
    }

    // 自定义权限不足处理器，返回 JSON 格式的错误信息
    @Bean
    public AccessDeniedHandler accessDeniedHandler() {
        return (request, response, accessDeniedException) -> {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            
            Map<String, Object> error = new HashMap<>();
            error.put("status", 403);
            error.put("error", "Forbidden");
            error.put("message", "アクセス権限がありません。");
            error.put("path", request.getRequestURI());
            
            objectMapper.writeValue(response.getWriter(), error);
        };
    }

    // 3) 安全过滤器链
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, AuthenticationManager authManager) throws Exception {
        http
                // ✅ 无状态 & 关闭默认机制
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)

                // 设置异常处理器
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(authenticationEntryPoint())
                        .accessDeniedHandler(accessDeniedHandler())
                )

                // 放行端点 & 静态资源
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/", "/*.html", "/js/**", "/css/**", "/images/**", "/static/**").permitAll()
                        .requestMatchers("/spot.html", "/api/spots/**").permitAll()
                        .requestMatchers("/login.html", "/register.html", "/admin.html", "/notes-admin.html").permitAll() // 加上这行
                        .requestMatchers("/api/auth/register", "/api/auth/login").permitAll()
                        .requestMatchers("/api/notes", "/api/notes/search", "/api/notes/{id}").permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/likes/**", "/api/favorites/**").authenticated()

                        .anyRequest().authenticated()
                )


                // 新写法使用 AuthenticationManager
                .authenticationManager(authManager)

                // JWT 过滤器在 UsernamePasswordAuthenticationFilter 之前
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}

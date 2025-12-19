package com.example.travel.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/**
 * React SPA 控制器
 * 处理所有前端路由，返回 React 应用的 index.html
 * 使用 @Order 确保优先级高于静态资源处理器
 */
@Slf4j
@RestController
@Order(0)  // 改为 0，确保最高优先级（数字越小优先级越高）
public class ReactController {

    /**
     * 处理根路径，返回 React 应用的 index.html
     */
    @GetMapping("/")
    public ResponseEntity<String> index() {
        return getReactIndex();
    }

    /**
     * 处理所有非 API 的前端路由
     * 这些路由应该由 React Router 处理
     */
    @GetMapping(value = {
            "/home",
            "/spot",
            "/notes",
            "/login",
            "/register",
            "/user",
            "/profile-edit",
            "/notifications",
            "/admin",
            "/notes-admin",
            "/users-admin",
            "/notes-create",
            "/notes-my",
            "/notes-detail/**"
    }, produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> reactRoutes() {
        return getReactIndex();
    }

    /**
     * 处理旧的 HTML 文件路径，重定向到 React 路由
     * 这些旧的 HTML 文件已被封存到 html-archive 目录
     */
    @GetMapping(value = {
            "/spot.html",
            "/login.html",
            "/register.html",
            "/admin.html",
            "/notes-admin.html",
            "/notes-create.html",
            "/notes-detail.html",
            "/notes-my.html",
            "/notes.html",
            "/profile-edit.html",
            "/user.html"
    }, produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> oldHtmlRoutes() {
        // 返回 React 应用，由 React Router 处理路由
        return getReactIndex();
    }

    /**
     * 读取 React 构建的 index.html
     * 支持 JAR 包和文件系统两种方式
     */
    private ResponseEntity<String> getReactIndex() {
        try {
            Resource resource = new ClassPathResource("static/react-dist/index.html");
            log.info("尝试加载 React index.html，资源存在: {}", resource.exists());
            
            String content;
            
            // 尝试作为文件读取（开发环境）
            if (resource.exists() && resource.isFile() && resource.getFile().exists()) {
                log.info("从文件系统读取 React index.html: {}", resource.getFile().getAbsolutePath());
                content = new String(java.nio.file.Files.readAllBytes(resource.getFile().toPath()), StandardCharsets.UTF_8);
            } else {
                // 从 JAR 包中读取（生产环境）
                log.info("从 JAR 包中读取 React index.html");
                try (InputStream inputStream = resource.getInputStream()) {
                    content = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
                }
            }
            
            log.info("成功加载 React index.html，内容长度: {} 字符", content.length());
            return ResponseEntity.ok()
                    .contentType(MediaType.valueOf("text/html"))
                    .body(content);
        } catch (IOException e) {
            log.error("无法加载 React index.html: {}", e.getMessage(), e);
            // 如果读取失败，返回详细的错误页面
            String errorHtml = String.format(
                "<!DOCTYPE html><html><head><title>React App Error</title></head><body>" +
                "<h1>React 应用加载失败</h1>" +
                "<p>错误信息: %s</p>" +
                "<p>请确保前端已正确构建，并且 react-dist 目录存在于 JAR 包中。</p>" +
                "<p>检查步骤：</p>" +
                "<ul>" +
                "<li>1. 确认前端构建命令已执行: cd frontend && npm run build</li>" +
                "<li>2. 确认构建输出目录: src/main/resources/static/react-dist/</li>" +
                "<li>3. 确认 Maven 打包时包含了 react-dist 目录</li>" +
                "</ul>" +
                "</body></html>",
                e.getMessage()
            );
            return ResponseEntity.ok()
                    .contentType(MediaType.valueOf("text/html"))
                    .body(errorHtml);
        }
    }
}


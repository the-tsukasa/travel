package com.example.travel.controller;

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
@RestController
@Order(1)  // 确保优先级高于静态资源处理器
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
     * 读取 React 构建的 index.html
     * 支持 JAR 包和文件系统两种方式
     */
    private ResponseEntity<String> getReactIndex() {
        try {
            Resource resource = new ClassPathResource("static/react-dist/index.html");
            String content;
            
            // 尝试作为文件读取（开发环境）
            if (resource.exists() && resource.isFile() && resource.getFile().exists()) {
                content = new String(java.nio.file.Files.readAllBytes(resource.getFile().toPath()), StandardCharsets.UTF_8);
            } else {
                // 从 JAR 包中读取（生产环境）
                try (InputStream inputStream = resource.getInputStream()) {
                    content = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
                }
            }
            
            return ResponseEntity.ok()
                    .contentType(MediaType.valueOf("text/html"))
                    .body(content);
        } catch (IOException e) {
            // 如果读取失败，返回简单的错误页面
            return ResponseEntity.ok()
                    .contentType(MediaType.valueOf("text/html"))
                    .body("<!DOCTYPE html><html><head><title>Error</title></head><body><h1>React app not found: " + e.getMessage() + "</h1></body></html>");
        }
    }
}


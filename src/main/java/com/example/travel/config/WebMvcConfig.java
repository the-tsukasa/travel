package com.example.travel.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web MVC 配置
 * 确保 ReactController 优先处理所有前端路由
 * 不配置任何视图控制器，让 ReactController 处理所有路由
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    
    @Override
    public void addViewControllers(@NonNull ViewControllerRegistry registry) {
        // 不配置任何视图控制器，让 ReactController 处理所有路由
        // 这样可以确保 ReactController 的优先级
    }
}


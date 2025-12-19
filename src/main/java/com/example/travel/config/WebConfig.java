package com.example.travel.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        // 配置上传文件的静态资源访问
        String uploadPath = Paths.get(uploadDir).toAbsolutePath().toString();
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadPath + "/");
        
        // 只配置 React 构建的静态资源（不处理 .html 文件）
        // React 构建的文件在 react-dist 目录中
        registry.addResourceHandler("/assets/**")
                .addResourceLocations("classpath:/static/react-dist/assets/")
                .setCachePeriod(3600)
                .resourceChain(true);  // 启用资源链，提高优先级
        
        // React 构建的图片资源
        registry.addResourceHandler("/images/**")
                .addResourceLocations("classpath:/static/react-dist/images/")
                .setCachePeriod(3600)
                .resourceChain(true);
        
        // 注意：不配置 /*.html 的静态资源处理
        // 所有 .html 请求都由 ReactController 处理
    }
}


package com.example.travel.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {

    @Value("${cors.allowed-origins:http://localhost:3000,http://localhost:5173}")
    private String allowedOrigins;

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(@NonNull CorsRegistry registry) {
                // 开发环境：允许 React 开发服务器
                // 生产环境：通过环境变量配置前端 URL
                @SuppressWarnings("null") // split() never returns null
                String[] origins = allowedOrigins.split(",");
                
                registry.addMapping("/**")
                        .allowedOriginPatterns(origins)
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                        .allowedHeaders("*")
                        .allowCredentials(true)
                        .maxAge(3600);  // 预检请求缓存时间（秒）
            }
        };
    }
}

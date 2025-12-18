package com.example.travel.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;

@Data
@Component
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {
    // ⚠️ 生产环境必须通过环境变量 JWT_SECRET 设置，不能使用默认值
    // 默认值仅用于开发环境
    private String secret = "pV4E@9f!jL#8rXu2Yz*QmN3hS0w^Rk7VbG&cJ5zMdT$PqH6Lx";
    private long expiration = 604800000; // 默认7天（毫秒）
}


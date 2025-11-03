package com.example.travel.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;

@Data
@Component
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {
    private String secret = "pV4E@9f!jL#8rXu2Yz*QmN3hS0w^Rk7VbG&cJ5zMdT$PqH6Lx";
    private long expiration = 604800000; // 默认7天（毫秒）
}


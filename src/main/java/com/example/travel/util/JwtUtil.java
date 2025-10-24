package com.example.travel.util;

import java.security.Key;
import java.util.Date;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

public class JwtUtil {

    // ✅ 安全秘钥（请保密）
    private static final String SECRET = "pV4E@9f!jL#8rXu2Yz*QmN3hS0w^Rk7VbG&cJ5zMdT$PqH6Lx";

    // ✅ Token 有效期（24小时）
    private static final long EXPIRATION_TIME = 1000 * 60 * 60 * 24;
    // ✅ 字段名也可以改成 TOKEN_EXPIRE_TIME 让人更一目了然

    // ✅ 签名 Key
    private static final Key KEY = Keys.hmacShaKeyFor(SECRET.getBytes());

    /**
     * ✅ 1. 生成 Token，加入 username 和 role
     */
    public static String generateToken(String username) {
        return Jwts.builder()
                .setSubject(username)            // 标准字段：用户名
                .claim("role", null)             // 自定义字段：角色
                .setIssuedAt(new Date())         // 签发时间
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME)) // 过期时间
                .signWith(KEY, SignatureAlgorithm.HS256)  // ✅ 使用 KEY（大写）签名
                .compact();
    }

    /**
     * ✅ 2. 解析 Token → 获取 Claims（负载）
     */
    public static Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(KEY)  // 设置秘钥
                .build()
                .parseClaimsJws(token)  // 解析
                .getBody();             // 获取负载数据
    }

    /**
     * ✅ 3. 从 Token 中获取用户名
     */
    public static String getUsername(String token) {
        return getClaims(token).getSubject();
    }

    /**
     * ✅ 4. 判断 Token 是否过期
     */
    public static boolean isTokenExpired(String token) {
        return getClaims(token).getExpiration().before(new Date());
    }
}

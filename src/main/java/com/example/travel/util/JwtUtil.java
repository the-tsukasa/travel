package com.example.travel.util;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class JwtUtil {

    // ✅ 安全秘钥（请保密）
    private static final String SECRET = "pV4E@9f!jL#8rXu2Yz*QmN3hS0w^Rk7VbG&cJ5zMdT$PqH6Lx";

    // ✅ Token 有效期（7天）
    private static final long EXPIRATION_TIME = 1000L * 60 * 60 * 24 * 7;
    // ✅ 字段名也可以改成 TOKEN_EXPIRE_TIME 让人更一目了然

    // ✅ 签名 Key - 使用 UTF-8 编码确保一致性
    private static final Key KEY;
    
    static {
        // 初始化时验证密钥长度
        byte[] secretBytes = SECRET.getBytes(StandardCharsets.UTF_8);
        int bitLength = secretBytes.length * 8;
        
        log.info("JWT 密钥初始化:");
        log.info("  密钥字符串长度: {} 字符", SECRET.length());
        log.info("  密钥字节长度: {} 字节", secretBytes.length);
        log.info("  密钥位长度: {} 位", bitLength);
        
        if (bitLength < 256) {
            log.error("  警告: HS256 要求密钥至少 256 位（32 字节），当前只有 {} 位", bitLength);
        } else {
            log.info("  ✓ 密钥长度符合 HS256 要求（≥256位）");
        }
        
        KEY = Keys.hmacShaKeyFor(secretBytes);
        log.info("  ✓ 密钥初始化成功");
    }

    /**
     * ✅ 1. 生成 Token，加入 username 和 role
     */
    public static String generateToken(String username, String role) {
        try {
            log.debug("生成 Token - username: {}, role: {}", username, role);
            String token = Jwts.builder()
                    .setSubject(username)            // 标准字段：用户名
                    .claim("role", role)              // ✅ 写入角色（如 USER / ADMIN）
                    .setIssuedAt(new Date())         // 签发时间
                    .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME)) // 过期时间
                    .signWith(KEY, SignatureAlgorithm.HS256)
                    .compact();
            log.debug("Token 生成成功: {}...", token.substring(0, Math.min(30, token.length())));
            return token;
        } catch (Exception e) {
            log.error("生成 Token 失败: {}", e.getMessage(), e);
            throw e;
        }
    }


    /**
     * ✅ 2. 解析 Token → 获取 Claims（负载）
     * 增强异常处理，提供详细的错误信息
     */
    public static Claims getClaims(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(KEY)  // 设置秘钥
                    .build()
                    .parseClaimsJws(token)  // 解析
                    .getBody();             // 获取负载数据
        } catch (ExpiredJwtException e) {
            log.error("JWT Token 已过期: {}", e.getMessage());
            throw e;
        } catch (UnsupportedJwtException | MalformedJwtException e) {
            log.error("JWT Token 格式错误: {}", e.getMessage());
            throw e;
        } catch (SignatureException e) {
            log.error("JWT Token 签名验证失败: {}", e.getMessage());
            log.error("可能的原因: 密钥不匹配或 Token 被篡改");
            throw e;
        } catch (IllegalArgumentException e) {
            log.error("JWT Token 参数错误: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("JWT Token 解析失败 - 未知错误: {}", e.getMessage(), e);
            throw e;
        }
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

package com.example.travel.util;

import java.nio.charset.StandardCharsets;

/**
 * JWT 工具类测试和验证
 * 用于诊断 JWT 验证问题
 */
public class JwtUtilTest {
    
    private static final String SECRET = "pV4E@9f!jL#8rXu2Yz*QmN3hS0w^Rk7VbG&cJ5zMdT$PqH6Lx";
    
    public static void main(String[] args) {
        System.out.println("=== JWT 验证问题诊断 ===\n");
        
        // 1. 检查密钥长度
        checkKeyLength();
        
        // 2. 检查密钥编码一致性
        checkKeyEncoding();
        
        // 3. 检查 JWT 库版本兼容性
        checkJwtLibraryVersion();
        
        // 4. 测试 Token 生成和验证
        testTokenGenerationAndValidation();
    }
    
    /**
     * 1. 检查密钥长度
     * HS256 算法要求密钥长度至少 256 位（32 字节）
     */
    private static void checkKeyLength() {
        System.out.println("1. 检查密钥长度:");
        byte[] secretBytes = SECRET.getBytes(StandardCharsets.UTF_8);
        int byteLength = secretBytes.length;
        int bitLength = byteLength * 8;
        
        System.out.println("   密钥字符串长度: " + SECRET.length() + " 字符");
        System.out.println("   密钥字节长度: " + byteLength + " 字节");
        System.out.println("   密钥位长度: " + bitLength + " 位");
        
        if (bitLength >= 256) {
            System.out.println("   ✓ 密钥长度符合 HS256 要求（≥256位）");
        } else {
            System.out.println("   ✗ 密钥长度不足！HS256 需要至少 256 位（32 字节）");
            System.out.println("   当前密钥只有 " + bitLength + " 位，需要至少 256 位");
        }
        System.out.println();
    }
    
    /**
     * 2. 检查密钥编码一致性
     */
    private static void checkKeyEncoding() {
        System.out.println("2. 检查密钥编码一致性:");
        
        // 使用默认编码
        byte[] defaultBytes = SECRET.getBytes();
        
        // 使用 UTF-8 编码
        byte[] utf8Bytes = SECRET.getBytes(StandardCharsets.UTF_8);
        
        System.out.println("   默认编码字节数组: " + java.util.Arrays.toString(defaultBytes));
        System.out.println("   UTF-8 编码字节数组: " + java.util.Arrays.toString(utf8Bytes));
        
        boolean encodingMatch = java.util.Arrays.equals(defaultBytes, utf8Bytes);
        
        if (encodingMatch) {
            System.out.println("   ✓ 默认编码和 UTF-8 编码一致");
        } else {
            System.out.println("   ✗ 编码不一致！这可能导致签名验证失败");
            System.out.println("   建议: 统一使用 StandardCharsets.UTF_8");
        }
        System.out.println();
    }
    
    /**
     * 3. 检查 JWT 库版本
     */
    private static void checkJwtLibraryVersion() {
        System.out.println("3. 检查 JWT 库版本:");
        
        try {
            Package jwtPackage = io.jsonwebtoken.Jwts.class.getPackage();
            String version = jwtPackage.getImplementationVersion();
            
            System.out.println("   JWT 库版本: " + (version != null ? version : "未知"));
            System.out.println("   使用的类: " + io.jsonwebtoken.Jwts.class.getName());
            
            // 检查是否支持新 API
            try {
                io.jsonwebtoken.Jwts.builder();
                System.out.println("   ✓ 支持新 API (Jwts.builder())");
            } catch (Exception e) {
                System.out.println("   ✗ 不支持新 API");
            }
            
            // 检查是否支持 parserBuilder
            try {
                io.jsonwebtoken.Jwts.parserBuilder();
                System.out.println("   ✓ 支持 parserBuilder()");
            } catch (Exception e) {
                System.out.println("   ✗ 不支持 parserBuilder()");
            }
            
        } catch (Exception e) {
            System.out.println("   ✗ 无法检查 JWT 库版本: " + e.getMessage());
        }
        System.out.println();
    }
    
    /**
     * 4. 测试 Token 生成和验证
     * 注意：此方法需要Spring上下文，因为JwtUtil现在是@Component
     * 建议使用Spring Boot测试框架进行测试
     */
    private static void testTokenGenerationAndValidation() {
        System.out.println("4. 测试 Token 生成和验证:");
        System.out.println("   注意：JwtUtil已改为Spring Bean，需要Spring上下文才能使用");
        System.out.println("   建议使用@SpringBootTest进行集成测试");
        System.out.println();
    }
}


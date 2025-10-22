package com.example.travel.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AdminController {

    // ✅ 只有 ADMIN 角色可以访问
    @GetMapping("/api/admin/test")
    @PreAuthorize("hasAuthority('ADMIN')")   // 或者 hasRole('ADMIN')，取决于你数据库角色存储方式
    public String adminTest(Authentication authentication) {
        // 从认证信息中获取当前登录用户名
        String username = authentication.getName();

        // 生成动态返回内容
        return "你好，" + username + "！只有 ADMIN 才能看到这个内容 ✅";
    }
}

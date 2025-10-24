package com.example.travel.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AdminController {

    // ✅ 只有 ADMIN 角色可以访问
    @GetMapping("/api/admin/test")
    @PreAuthorize("hasRole('ADMIN')")
    public String adminTest(Authentication authentication) {
        String username = authentication.getName();
        return "你好，" + username + "！只有 ADMIN 才能看到这个内容 ✅";
    }
}

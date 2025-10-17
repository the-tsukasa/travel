package com.example.travel.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AdminController {

    // ✅ 只有 ADMIN 角色可以访问
    @GetMapping("/api/admin/test")
    @PreAuthorize("hasAuthority('ADMIN')")   // ✅ 注意：你的角色值是 "ADMIN"
    public String adminTest() {
        return "只有 ADMIN 才能看到这个内容 ✅";
    }
}

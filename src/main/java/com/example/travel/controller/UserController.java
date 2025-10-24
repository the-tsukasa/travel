package com.example.travel.controller;

import com.example.travel.dto.UserDTO;
import com.example.travel.entity.User;
import com.example.travel.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/me")
    public UserDTO getCurrentUser() {
        // ✅ 从 SecurityContext 中获取当前用户名
        String username = (String) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();

        // ✅ 查询数据库
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("ユーザーが見つかりません: " + username));


        // ✅ 防止空指针
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }

        // ✅ 转换为安全的 DTO（不会泄露密码）
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setCreatedAt(user.getCreatedAt());

        return dto;
    }
}

package com.example.travel.controller;

import com.example.travel.dto.UserDTO;
import com.example.travel.entity.User;
import com.example.travel.repository.FavoritesRepository;
import com.example.travel.repository.LikesRepository;
import com.example.travel.repository.NotesRepository;
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
    private final NotesRepository notesRepository;
    private final LikesRepository likesRepository;
    private final FavoritesRepository favoritesRepository;

    @GetMapping("/me")
    public UserDTO getCurrentUser() {
        // ✅ 从 SecurityContext 中获取当前用户名
        String username = (String) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();

        // ✅ 查询数据库
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("ユーザーが見つかりません: " + username));

        // ✅ 转换为安全的 DTO（不会泄露密码）
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setLocation(user.getLocation() != null ? user.getLocation() : "日本");
        dto.setAvatarUrl(user.getAvatarUrl());
        dto.setCreatedAt(user.getCreatedAt());

        // ✅ 计算统计数据
        dto.setNotesCount(notesRepository.countByUser(user));
        dto.setLikesCount(likesRepository.countByUser(user));
        dto.setFavoritesCount(favoritesRepository.countByUser(user));
        dto.setTotalLikesAndFavorites(dto.getLikesCount() + dto.getFavoritesCount());

        return dto;
    }
}

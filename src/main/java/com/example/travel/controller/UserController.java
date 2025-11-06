package com.example.travel.controller;

import com.example.travel.dto.UpdateProfileRequest;
import com.example.travel.dto.UserDTO;
import com.example.travel.entity.User;
import com.example.travel.repository.FavoritesRepository;
import com.example.travel.repository.LikesRepository;
import com.example.travel.repository.NotesRepository;
import com.example.travel.repository.UserRepository;
import com.example.travel.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final NotesRepository notesRepository;
    private final LikesRepository likesRepository;
    private final FavoritesRepository favoritesRepository;
    private final UserService userService;

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
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setLocation(user.getLocation() != null ? user.getLocation() : "日本");
        dto.setAvatarUrl(user.getAvatarUrl());
        dto.setBio(user.getBio());
        dto.setAddress(user.getAddress());
        dto.setBirthday(user.getBirthday());
        dto.setCreatedAt(user.getCreatedAt());

        // ✅ 计算统计数据
        dto.setNotesCount(notesRepository.countByUser(user));
        dto.setLikesCount(likesRepository.countByUser(user));
        dto.setFavoritesCount(favoritesRepository.countByUser(user));
        dto.setTotalLikesAndFavorites(dto.getLikesCount() + dto.getFavoritesCount());

        return dto;
    }

    @PutMapping("/profile")
    public UserDTO updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        // ✅ 从 SecurityContext 中获取当前用户名
        String username = (String) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();

        // ✅ 更新用户资料
        userService.updateProfile(username, request);

        // ✅ 返回更新后的用户信息
        return getCurrentUser();
    }
}

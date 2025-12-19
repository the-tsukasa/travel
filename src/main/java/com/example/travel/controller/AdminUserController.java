package com.example.travel.controller;

import com.example.travel.dto.UserDTO;
import com.example.travel.entity.User;
import com.example.travel.repository.FavoritesRepository;
import com.example.travel.repository.LikesRepository;
import com.example.travel.repository.NotesRepository;
import com.example.travel.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserRepository userRepository;
    private final NotesRepository notesRepository;
    private final LikesRepository likesRepository;
    private final FavoritesRepository favoritesRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * 获取所有用户列表
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDTO>> getAllUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "createdAt") String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String sortOrder) {
        
        List<User> users = userRepository.findAll();
        
        // 搜索过滤
        if (search != null && !search.trim().isEmpty()) {
            String searchLower = search.toLowerCase();
            users = users.stream()
                    .filter(user -> 
                        (user.getUsername() != null && user.getUsername().toLowerCase().contains(searchLower)) ||
                        (user.getEmail() != null && user.getEmail().toLowerCase().contains(searchLower)) ||
                        (user.getFirstName() != null && user.getFirstName().toLowerCase().contains(searchLower)) ||
                        (user.getLastName() != null && user.getLastName().toLowerCase().contains(searchLower))
                    )
                    .collect(Collectors.toList());
        }
        
        // 排序
        if ("username".equals(sortBy)) {
            users.sort((u1, u2) -> {
                int result = (u1.getUsername() != null ? u1.getUsername() : "")
                        .compareToIgnoreCase(u2.getUsername() != null ? u2.getUsername() : "");
                return "desc".equals(sortOrder) ? -result : result;
            });
        } else if ("email".equals(sortBy)) {
            users.sort((u1, u2) -> {
                int result = (u1.getEmail() != null ? u1.getEmail() : "")
                        .compareToIgnoreCase(u2.getEmail() != null ? u2.getEmail() : "");
                return "desc".equals(sortOrder) ? -result : result;
            });
        } else if ("role".equals(sortBy)) {
            users.sort((u1, u2) -> {
                int result = (u1.getRole() != null ? u1.getRole() : "")
                        .compareToIgnoreCase(u2.getRole() != null ? u2.getRole() : "");
                return "desc".equals(sortOrder) ? -result : result;
            });
        } else {
            // 默认按创建时间排序
            users.sort((u1, u2) -> {
                int result = u1.getCreatedAt().compareTo(u2.getCreatedAt());
                return "desc".equals(sortOrder) ? -result : result;
            });
        }
        
        List<UserDTO> userDTOs = users.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(userDTOs);
    }

    /**
     * 根据ID获取用户详情
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ユーザーが見つかりません: " + id));
        return ResponseEntity.ok(convertToDTO(user));
    }

    /**
     * 更新用户信息（包括角色）
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDTO> updateUser(
            @PathVariable Long id,
            @RequestBody UpdateUserRequest request) {
        
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ユーザーが見つかりません: " + id));
        
        // 更新基本信息
        if (request.getUsername() != null) {
            // 检查用户名是否已被其他用户使用
            userRepository.findByUsername(request.getUsername())
                    .ifPresent(existingUser -> {
                        if (!existingUser.getId().equals(id)) {
                            throw new RuntimeException("このユーザー名は既に使用されています");
                        }
                    });
            user.setUsername(request.getUsername());
        }
        
        if (request.getEmail() != null) {
            // 检查邮箱是否已被其他用户使用
            userRepository.findByEmail(request.getEmail())
                    .ifPresent(existingUser -> {
                        if (!existingUser.getId().equals(id)) {
                            throw new RuntimeException("このメールアドレスは既に登録されています");
                        }
                    });
            user.setEmail(request.getEmail());
        }
        
        if (request.getRole() != null) {
            user.setRole(request.getRole());
        }
        
        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }
        
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }
        
        if (request.getLocation() != null) {
            user.setLocation(request.getLocation());
        }
        
        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }
        
        if (request.getAddress() != null) {
            user.setAddress(request.getAddress());
        }
        
        if (request.getBirthday() != null) {
            user.setBirthday(request.getBirthday());
        }
        
        // 如果提供了新密码，则更新密码
        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        
        userRepository.save(user);
        return ResponseEntity.ok(convertToDTO(user));
    }

    /**
     * 删除用户
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ユーザーが見つかりません: " + id));
        
        // 检查是否是最后一个管理员
        if ("ADMIN".equals(user.getRole())) {
            long adminCount = userRepository.findAll().stream()
                    .filter(u -> "ADMIN".equals(u.getRole()))
                    .count();
            if (adminCount <= 1) {
                throw new RuntimeException("最後の管理者を削除することはできません");
            }
        }
        
        userRepository.delete(user);
        return ResponseEntity.ok().build();
    }

    /**
     * 获取用户统计信息
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserStatsDTO> getUserStats() {
        long totalUsers = userRepository.count();
        long adminUsers = userRepository.findAll().stream()
                .filter(u -> "ADMIN".equals(u.getRole()))
                .count();
        long regularUsers = totalUsers - adminUsers;
        
        UserStatsDTO stats = new UserStatsDTO();
        stats.setTotalUsers(totalUsers);
        stats.setAdminUsers(adminUsers);
        stats.setRegularUsers(regularUsers);
        
        return ResponseEntity.ok(stats);
    }

    /**
     * 将 User 实体转换为 UserDTO
     */
    private UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole() != null ? user.getRole() : "USER");
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setLocation(user.getLocation() != null ? user.getLocation() : "日本");
        
        // 处理头像URL
        String avatarUrl = user.getAvatarUrl();
        if (avatarUrl != null && !avatarUrl.isEmpty() 
            && !avatarUrl.startsWith("http://") && !avatarUrl.startsWith("https://")) {
            avatarUrl = "/uploads/" + avatarUrl;
        }
        dto.setAvatarUrl(avatarUrl);
        
        dto.setBio(user.getBio());
        dto.setAddress(user.getAddress());
        dto.setBirthday(user.getBirthday());
        dto.setCreatedAt(user.getCreatedAt());
        
        // 计算统计数据
        dto.setNotesCount(notesRepository.countByUser(user));
        dto.setLikesCount(likesRepository.countByUser(user));
        dto.setFavoritesCount(favoritesRepository.countByUser(user));
        dto.setTotalLikesAndFavorites(dto.getLikesCount() + dto.getFavoritesCount());
        
        return dto;
    }

    /**
     * 更新用户请求 DTO
     */
    @lombok.Data
    public static class UpdateUserRequest {
        private String username;
        private String email;
        private String role;
        private String password;
        private String firstName;
        private String lastName;
        private String location;
        private String bio;
        private String address;
        private java.time.LocalDate birthday;
    }

    /**
     * 用户统计 DTO
     */
    @lombok.Data
    public static class UserStatsDTO {
        private long totalUsers;
        private long adminUsers;
        private long regularUsers;
    }
}


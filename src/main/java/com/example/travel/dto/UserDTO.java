package com.example.travel.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserDTO {
    private Long id;
    private String username;
    private String email;
    private String role;
    private String location;
    private String avatarUrl;
    private LocalDateTime createdAt;
    
    // 统计数据
    private Long notesCount;      // 笔记数量
    private Long likesCount;      // 点赞数量
    private Long favoritesCount;  // 收藏数量
    private Long totalLikesAndFavorites; // 总点赞和收藏数（用于显示）
}

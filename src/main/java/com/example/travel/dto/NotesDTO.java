package com.example.travel.dto;

import java.time.LocalDateTime;
import java.util.List;

import lombok.Data;

@Data
public class NotesDTO {
    private Long id;
    private String title;
    private String content;
    private String imageUrl; // 兼容旧版本：单张图片URL
    private List<String> imageUrls; // 新版本：多张图片URL列表
    private String location;
    private Integer likesCount;
    private Integer favoritesCount;
    private Boolean isApproved;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String username; // 作者用户名
    private Boolean isLiked; // 当前用户是否已点赞
    private Boolean isFavorited; // 当前用户是否已收藏
}

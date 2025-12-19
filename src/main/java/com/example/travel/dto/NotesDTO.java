package com.example.travel.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.example.travel.enums.NoteStatus;

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
    
    /**
     * 笔记状态
     */
    private NoteStatus status;
    
    /**
     * 退回理由（当状态为 REJECTED 时）
     */
    private String rejectReason;
    
    /**
     * 提交审核时间
     */
    private LocalDateTime submittedAt;
    
    /**
     * 审核时间
     */
    private LocalDateTime reviewedAt;
    
    /**
     * 审核人用户名
     */
    private String reviewedByUsername;
    
    /**
     * 是否已批准（保留字段，用于向后兼容）
     */
    private Boolean isApproved;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String username; // 作者用户名
    private Boolean isLiked; // 当前用户是否已点赞
    private Boolean isFavorited; // 当前用户是否已收藏
}

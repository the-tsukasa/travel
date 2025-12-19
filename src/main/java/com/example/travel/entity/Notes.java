package com.example.travel.entity;

import java.time.LocalDateTime;

import com.example.travel.enums.NoteStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "notes")
public class Notes {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Column(name = "location")
    private String location;

    @Column(name = "likes_count")
    private Integer likesCount = 0;

    @Column(name = "favorites_count")
    private Integer favoritesCount = 0;

    /**
     * 笔记状态（新字段）
     * 默认状态为 DRAFT（草稿）
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private NoteStatus status = NoteStatus.DRAFT;

    /**
     * 退回理由（当状态为 REJECTED 时使用）
     */
    @Column(name = "reject_reason", columnDefinition = "TEXT")
    private String rejectReason;

    /**
     * 提交审核时间
     */
    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    /**
     * 审核时间
     */
    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    /**
     * 审核人（管理员）
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    /**
     * 是否已批准（保留字段，用于向后兼容）
     * 该字段将在状态机完全迁移后废弃
     * 目前通过 status 字段同步更新
     */
    @Column(name = "is_approved")
    private Boolean isApproved = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        // 初始化状态
        if (status == null) {
            status = NoteStatus.DRAFT;
        }
        // 同步 isApproved 字段（向后兼容）
        syncIsApproved();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        // 同步 isApproved 字段（向后兼容）
        syncIsApproved();
    }

    /**
     * 同步 isApproved 字段（向后兼容）
     * 当状态为 PUBLISHED 时，isApproved 为 true
     */
    private void syncIsApproved() {
        this.isApproved = (this.status == NoteStatus.PUBLISHED);
    }
}

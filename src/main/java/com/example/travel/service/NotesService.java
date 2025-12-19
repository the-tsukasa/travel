package com.example.travel.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.travel.dto.CreateNotesRequest;
import com.example.travel.dto.NotesDTO;
import com.example.travel.entity.User;
import com.example.travel.enums.NoteStatus;

public interface NotesService {
    
    // ========== 用户功能 ==========
    
    /**
     * 创建笔记（状态为 DRAFT）
     */
    NotesDTO createNotes(CreateNotesRequest request, User user);
    
    /**
     * 更新笔记（仅限 DRAFT、REJECTED、PRIVATE 状态）
     */
    NotesDTO updateNotes(Long id, CreateNotesRequest request, User user);
    
    /**
     * 提交审核（DRAFT/REJECTED/PRIVATE → PENDING）
     */
    NotesDTO submitNotes(Long id, User user);
    
    /**
     * 获取用户的笔记列表（可按状态过滤）
     */
    List<NotesDTO> getUserNotes(User user, NoteStatus status);
    
    /**
     * 获取用户的笔记列表（所有状态）
     */
    List<NotesDTO> getUserNotes(User user);
    
    /**
     * 根据ID获取笔记详情
     */
    NotesDTO getNotesById(Long id, User currentUser);
    
    /**
     * 删除笔记（用户只能删除自己的笔记）
     */
    void deleteNotes(Long id, User user);
    
    // ========== 公开查询功能 ==========
    
    /**
     * 获取已发布的笔记列表（分页）
     */
    Page<NotesDTO> getPublishedNotes(Pageable pageable, User currentUser);
    
    /**
     * 获取已发布的笔记列表（向后兼容，使用旧方法名）
     */
    Page<NotesDTO> getApprovedNotes(Pageable pageable, User currentUser);
    
    /**
     * 搜索已发布的笔记
     */
    Page<NotesDTO> searchNotes(String keyword, Pageable pageable, User currentUser);
    
    // ========== 管理员功能 ==========
    
    /**
     * 获取待审核笔记（PENDING 状态）
     */
    List<NotesDTO> getPendingNotes();
    
    /**
     * 审核通过（PENDING → PUBLISHED）
     */
    void approveNotes(Long id, User admin);
    
    /**
     * 退回修改（PENDING → REJECTED，需提供退回理由）
     */
    void rejectNotes(Long id, String rejectReason, User admin);
    
    /**
     * 下架笔记（PUBLISHED → PRIVATE）
     */
    void unpublishNotes(Long id, User admin);
    
    /**
     * 删除笔记（管理员可删除任意状态的笔记）
     */
    void deleteNotesByAdmin(Long id, User admin);
    
    /**
     * 根据状态获取笔记列表（管理员用）
     */
    List<NotesDTO> getNotesByStatus(NoteStatus status);
    
    /**
     * 获取笔记统计信息（管理员用）
     */
    NotesStatsDTO getNotesStats();
    
    /**
     * 笔记统计 DTO
     */
    @lombok.Data
    class NotesStatsDTO {
        private long totalNotes;
        private long pendingNotes;
        private long publishedNotes;
        private long draftNotes;
        private long rejectedNotes;
        private long privateNotes;
    }
}

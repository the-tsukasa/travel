package com.example.travel.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.travel.entity.Notes;
import com.example.travel.entity.User;
import com.example.travel.enums.NoteStatus;

@Repository
public interface NotesRepository extends JpaRepository<Notes, Long> {

    // 查找用户的所有笔记
    List<Notes> findByUserOrderByCreatedAtDesc(User user);

    // ========== 旧方法（向后兼容，保留） ==========
    
    // 查找已批准的笔记
    Page<Notes> findByIsApprovedTrueOrderByCreatedAtDesc(Pageable pageable);

    // 查找待审核的笔记（管理员用）
    List<Notes> findByIsApprovedFalseOrderByCreatedAtDesc();

    // 根据标题搜索已批准的笔记
    @Query("SELECT n FROM Notes n WHERE n.isApproved = true AND (n.title LIKE CONCAT('%', :keyword, '%') OR n.content LIKE CONCAT('%', :keyword, '%'))")
    Page<Notes> searchApprovedNotes(@Param("keyword") String keyword, Pageable pageable);
    
    // ========== 新方法（基于状态） ==========
    
    /**
     * 根据状态查找笔记（分页）
     */
    Page<Notes> findByStatusOrderByCreatedAtDesc(NoteStatus status, Pageable pageable);
    
    /**
     * 根据状态查找笔记（列表）
     */
    List<Notes> findByStatusOrderByCreatedAtDesc(NoteStatus status);
    
    /**
     * 查找用户的笔记（按状态过滤）
     */
    List<Notes> findByUserAndStatusOrderByCreatedAtDesc(User user, NoteStatus status);
    
    /**
     * 根据状态和关键词搜索笔记
     */
    @Query("SELECT n FROM Notes n WHERE n.status = :status AND (n.title LIKE CONCAT('%', :keyword, '%') OR n.content LIKE CONCAT('%', :keyword, '%'))")
    Page<Notes> searchNotesByStatus(@Param("status") NoteStatus status, @Param("keyword") String keyword, Pageable pageable);
    
    /**
     * 查找已发布的笔记（用于公开展示）
     */
    @Query("SELECT n FROM Notes n WHERE n.status = 'PUBLISHED' ORDER BY n.createdAt DESC")
    Page<Notes> findPublishedNotesOrderByCreatedAtDesc(Pageable pageable);
    
    /**
     * 搜索已发布的笔记
     */
    @Query("SELECT n FROM Notes n WHERE n.status = 'PUBLISHED' AND (n.title LIKE CONCAT('%', :keyword, '%') OR n.content LIKE CONCAT('%', :keyword, '%')) ORDER BY n.createdAt DESC")
    Page<Notes> searchPublishedNotes(@Param("keyword") String keyword, Pageable pageable);

    // 统计用户的笔记数量
    long countByUser(User user);

    // 检查用户是否拥有某个笔记
    boolean existsByIdAndUser(Long id, User user);
}

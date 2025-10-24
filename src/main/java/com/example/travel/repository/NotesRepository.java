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

@Repository
public interface NotesRepository extends JpaRepository<Notes, Long> {

    // 查找用户的所有笔记
    List<Notes> findByUserOrderByCreatedAtDesc(User user);

    // 查找已批准的笔记
    Page<Notes> findByIsApprovedTrueOrderByCreatedAtDesc(Pageable pageable);

    // 查找待审核的笔记（管理员用）
    List<Notes> findByIsApprovedFalseOrderByCreatedAtDesc();

    // 根据标题搜索已批准的笔记
    @Query("SELECT n FROM Notes n WHERE n.isApproved = true AND (n.title LIKE %:keyword% OR n.content LIKE %:keyword%)")
    Page<Notes> searchApprovedNotes(@Param("keyword") String keyword, Pageable pageable);

    // 统计用户的笔记数量
    long countByUser(User user);

    // 检查用户是否拥有某个笔记
    boolean existsByIdAndUser(Long id, User user);
}

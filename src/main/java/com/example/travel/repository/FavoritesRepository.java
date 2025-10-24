package com.example.travel.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.travel.entity.Favorites;
import com.example.travel.entity.Notes;
import com.example.travel.entity.User;

@Repository
public interface FavoritesRepository extends JpaRepository<Favorites, Long> {

    // 查找用户的所有收藏
    Page<Favorites> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    // 检查用户是否已收藏某个笔记
    boolean existsByUserAndNotes(User user, Notes notes);

    // 查找用户和笔记的收藏记录
    Optional<Favorites> findByUserAndNotes(User user, Notes notes);

    // 统计用户的收藏数量
    long countByUser(User user);

    // 统计笔记的收藏数量
    long countByNotes(Notes notes);

    // 查找用户收藏的笔记列表
    @Query("SELECT f.notes FROM Favorites f WHERE f.user = :user ORDER BY f.createdAt DESC")
    List<Notes> findNotesByUser(@Param("user") User user);

    // 根据笔记删除所有收藏记录
    void deleteByNotes(Notes notes);
}

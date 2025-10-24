package com.example.travel.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.travel.entity.Likes;
import com.example.travel.entity.Notes;
import com.example.travel.entity.User;

@Repository
public interface LikesRepository extends JpaRepository<Likes, Long> {

    // 检查用户是否已点赞某个笔记
    boolean existsByUserAndNotes(User user, Notes notes);

    // 查找用户和笔记的点赞记录
    Optional<Likes> findByUserAndNotes(User user, Notes notes);

    // 统计笔记的点赞数量
    long countByNotes(Notes notes);

    // 统计用户的点赞数量
    long countByUser(User user);

    // 查找用户点赞的笔记列表
    @Query("SELECT l.notes FROM Likes l WHERE l.user = :user ORDER BY l.createdAt DESC")
    List<Notes> findNotesByUser(@Param("user") User user);

    // 根据笔记删除所有点赞记录
    void deleteByNotes(Notes notes);
}

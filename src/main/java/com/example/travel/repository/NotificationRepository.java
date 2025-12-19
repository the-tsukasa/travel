package com.example.travel.repository;

import com.example.travel.entity.Notification;
import com.example.travel.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    // 查找用户的所有通知（按时间倒序）
    List<Notification> findByUserOrderByCreatedAtDesc(User user);
    
    // 查找用户的未读通知
    List<Notification> findByUserAndIsReadFalseOrderByCreatedAtDesc(User user);
    
    // 统计用户的未读通知数量
    long countByUserAndIsReadFalse(User user);
    
    // 标记所有通知为已读
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user = :user AND n.isRead = false")
    void markAllAsRead(@Param("user") User user);
    
    // 标记单个通知为已读
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.id = :id AND n.user = :user")
    void markAsRead(@Param("id") Long id, @Param("user") User user);
    
    // 查找单个通知（用于验证）
    Optional<Notification> findByIdAndUser(Long id, User user);
}


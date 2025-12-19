package com.example.travel.service;

import com.example.travel.dto.NotificationDTO;
import com.example.travel.entity.User;

import java.util.List;

public interface NotificationService {
    
    // 创建通知
    NotificationDTO createNotification(User user, String type, String title, String content, Long relatedId);
    
    // 获取用户的所有通知
    List<NotificationDTO> getUserNotifications(User user);
    
    // 获取用户的未读通知
    List<NotificationDTO> getUnreadNotifications(User user);
    
    // 获取未读通知数量
    long getUnreadCount(User user);
    
    // 标记所有通知为已读
    void markAllAsRead(User user);
    
    // 标记单个通知为已读
    void markAsRead(Long id, User user);
}


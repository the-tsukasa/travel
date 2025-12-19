package com.example.travel.service.impl;

import com.example.travel.dto.NotificationDTO;
import com.example.travel.entity.Notification;
import com.example.travel.entity.User;
import com.example.travel.repository.NotificationRepository;
import com.example.travel.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class NotificationServiceImpl implements NotificationService {
    
    private final NotificationRepository notificationRepository;
    
    @Override
    public NotificationDTO createNotification(User user, String type, String title, String content, Long relatedId) {
        try {
            log.info("创建通知 - 用户ID: {}, 类型: {}, 标题: {}", user.getId(), type, title);
            
            Notification notification = new Notification();
            notification.setUser(user);
            notification.setType(type);
            notification.setTitle(title);
            notification.setContent(content);
            notification.setRelatedId(relatedId);
            notification.setIsRead(false);
            
            Notification saved = notificationRepository.save(notification);
            log.info("通知创建成功 - 通知ID: {}", saved.getId());
            
            return convertToDTO(saved);
        } catch (Exception e) {
            log.error("创建通知失败 - 用户ID: {}, 类型: {}, 错误: {}", user.getId(), type, e.getMessage(), e);
            throw e;
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<NotificationDTO> getUserNotifications(User user) {
        List<Notification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(user);
        return notifications.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<NotificationDTO> getUnreadNotifications(User user) {
        List<Notification> notifications = notificationRepository.findByUserAndIsReadFalseOrderByCreatedAtDesc(user);
        return notifications.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(User user) {
        return notificationRepository.countByUserAndIsReadFalse(user);
    }
    
    @Override
    public void markAllAsRead(User user) {
        try {
            log.info("标记所有通知为已读 - 用户ID: {}", user.getId());
            notificationRepository.markAllAsRead(user);
        } catch (Exception e) {
            log.error("标记所有通知为已读失败 - 用户ID: {}, 错误: {}", user.getId(), e.getMessage(), e);
            throw e;
        }
    }
    
    @Override
    public void markAsRead(Long id, User user) {
        try {
            log.info("标记通知为已读 - 通知ID: {}, 用户ID: {}", id, user.getId());
            // 先验证通知是否属于该用户
            Optional<Notification> notificationOpt = notificationRepository.findByIdAndUser(id, user);
            if (notificationOpt.isEmpty()) {
                log.warn("通知不存在或不属于该用户 - 通知ID: {}, 用户ID: {}", id, user.getId());
                throw new RuntimeException("通知不存在或不属于该用户");
            }
            notificationRepository.markAsRead(id, user);
        } catch (Exception e) {
            log.error("标记通知为已读失败 - 通知ID: {}, 用户ID: {}, 错误: {}", id, user.getId(), e.getMessage(), e);
            throw e;
        }
    }
    
    private NotificationDTO convertToDTO(Notification notification) {
        NotificationDTO dto = new NotificationDTO();
        dto.setId(notification.getId());
        dto.setType(notification.getType());
        dto.setTitle(notification.getTitle());
        dto.setContent(notification.getContent());
        dto.setRelatedId(notification.getRelatedId());
        dto.setIsRead(notification.getIsRead());
        dto.setCreatedAt(notification.getCreatedAt());
        return dto;
    }
}


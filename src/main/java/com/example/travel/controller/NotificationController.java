package com.example.travel.controller;

import com.example.travel.dto.NotificationDTO;
import com.example.travel.service.NotificationService;
import com.example.travel.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {
    
    private final NotificationService notificationService;
    private final SecurityUtils securityUtils;
    
    // 获取用户的所有通知
    @GetMapping
    public ResponseEntity<List<NotificationDTO>> getUserNotifications(Authentication authentication) {
        try {
            var user = securityUtils.getCurrentUserOrThrow(authentication);
            log.debug("获取用户通知 - 用户ID: {}", user.getId());
            List<NotificationDTO> notifications = notificationService.getUserNotifications(user);
            log.debug("用户通知数量: {}", notifications.size());
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("获取用户通知失败", e);
            throw e;
        }
    }
    
    // 获取未读通知
    @GetMapping("/unread")
    public ResponseEntity<List<NotificationDTO>> getUnreadNotifications(Authentication authentication) {
        try {
            var user = securityUtils.getCurrentUserOrThrow(authentication);
            log.debug("获取未读通知 - 用户ID: {}", user.getId());
            List<NotificationDTO> notifications = notificationService.getUnreadNotifications(user);
            log.debug("未读通知数量: {}", notifications.size());
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("获取未读通知失败", e);
            throw e;
        }
    }
    
    // 获取未读通知数量
    @GetMapping("/unread/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication authentication) {
        try {
            var user = securityUtils.getCurrentUserOrThrow(authentication);
            long count = notificationService.getUnreadCount(user);
            log.debug("未读通知数量 - 用户ID: {}, 数量: {}", user.getId(), count);
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            log.error("获取未读通知数量失败", e);
            // 返回0而不是抛出异常，避免影响导航栏显示
            return ResponseEntity.ok(Map.of("count", 0L));
        }
    }
    
    // 标记所有通知为已读
    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(Authentication authentication) {
        try {
            var user = securityUtils.getCurrentUserOrThrow(authentication);
            log.info("标记所有通知为已读 - 用户ID: {}", user.getId());
            notificationService.markAllAsRead(user);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("标记所有通知为已读失败", e);
            throw e;
        }
    }
    
    // 标记单个通知为已读
    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id, Authentication authentication) {
        try {
            var user = securityUtils.getCurrentUserOrThrow(authentication);
            log.info("标记通知为已读 - 通知ID: {}, 用户ID: {}", id, user.getId());
            notificationService.markAsRead(id, user);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("标记通知为已读失败 - 通知ID: {}", id, e);
            throw e;
        }
    }
}


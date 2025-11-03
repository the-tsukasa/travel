package com.example.travel.util;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import com.example.travel.entity.User;
import com.example.travel.exception.ResourceNotFoundException;
import com.example.travel.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class SecurityUtils {

    private final UserRepository userRepository;

    /**
     * 从Authentication中获取当前用户
     * @param authentication Spring Security的Authentication对象
     * @return 当前登录的用户，如果未认证则返回null
     */
    public User getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        String username = authentication.getName();
        return userRepository.findByUsername(username).orElse(null);
    }

    /**
     * 获取当前用户（必须已认证）
     * @param authentication Spring Security的Authentication对象
     * @return 当前登录的用户
     * @throws ResourceNotFoundException 如果用户未认证或不存在
     */
    public User getCurrentUserOrThrow(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResourceNotFoundException("用户未认证");
        }
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
    }
}


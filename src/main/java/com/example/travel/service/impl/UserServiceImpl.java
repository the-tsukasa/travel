package com.example.travel.service.impl;

import com.example.travel.dto.LoginRequest;
import com.example.travel.dto.RegisterRequest;
import com.example.travel.dto.UpdateProfileRequest;
import com.example.travel.entity.User;
import com.example.travel.exception.BusinessException;
import com.example.travel.exception.ResourceNotFoundException;
import com.example.travel.repository.UserRepository;
import com.example.travel.service.UserService;
import com.example.travel.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Override
    public void register(RegisterRequest request) {
        // 检查用户名是否存在
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException("USERNAME_EXISTS", "このユーザー名は既に使用されています");
        }

        // 检查邮箱是否存在
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("EMAIL_EXISTS", "このメールアドレスは既に登録されています");
        }

        // 创建用户
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setRole("USER");  // 默认角色
        user.setCreatedAt(LocalDateTime.now());

        // 保存
        userRepository.save(user);
    }

    @Override
    public String login(LoginRequest request) {
        // 查找用户
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", request.getUsername()));

        // 校验密码
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException("INVALID_PASSWORD", "パスワードが正しくありません");
        }

        // 处理 role 为 null 的情况（兼容旧数据）
        String role = user.getRole() != null ? user.getRole() : "USER";
        
        // 生成并返回 JWT Token
        return jwtUtil.generateToken(user.getUsername(), role);
    }

    @Override
    public void updateProfile(String username, UpdateProfileRequest request) {
        // 查找用户
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        // 更新字段（只更新非空字段）
        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }
        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }
        if (request.getLocation() != null) {
            user.setLocation(request.getLocation());
        }
        if (request.getAddress() != null) {
            user.setAddress(request.getAddress());
        }
        if (request.getBirthday() != null) {
            user.setBirthday(request.getBirthday());
        }

        // 保存更新
        userRepository.save(user);
    }
}

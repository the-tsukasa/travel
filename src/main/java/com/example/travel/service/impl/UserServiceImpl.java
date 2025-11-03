package com.example.travel.service.impl;

import com.example.travel.dto.LoginRequest;
import com.example.travel.dto.RegisterRequest;
import com.example.travel.entity.User;
import com.example.travel.repository.UserRepository;
import com.example.travel.service.UserService;
import com.example.travel.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    public void register(RegisterRequest request) {
        // 检查用户名是否存在
        userRepository.findByUsername(request.getUsername())
                .ifPresent(u -> { throw new RuntimeException("用户名已存在"); });

        // 检查邮箱是否存在
        userRepository.findByEmail(request.getEmail())
                .ifPresent(u -> { throw new RuntimeException("邮箱已被注册"); });

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
        // 查找用户（Optional 安全写法）
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        // 校验密码
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("密码错误");
        }

        // 生成并返回 JWT Token
        return JwtUtil.generateToken(user.getUsername(), user.getRole());

    }
}

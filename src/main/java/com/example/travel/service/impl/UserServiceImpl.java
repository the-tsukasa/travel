package com.example.travel.service.impl;

import com.example.travel.dto.LoginRequest;
import com.example.travel.dto.RegisterRequest;
import com.example.travel.entity.User;
import com.example.travel.repository.UserRepository;
import com.example.travel.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import com.example.travel.util.JwtUtil;

import java.time.LocalDateTime;


@Service
@RequiredArgsConstructor   // 自动生成构造函数注入依赖（Lombok）
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    public void register(RegisterRequest request) {
        // 1. 检查用户名是否存在
        if (userRepository.findByUsername(request.getUsername()) != null) {
            throw new RuntimeException("用户名已存在");
        }

        // 2. 检查邮箱是否存在（你需要在 UserRepository 添加 findByEmail）
        if (userRepository.findByEmail(request.getEmail()) != null) {
            throw new RuntimeException("邮箱已被注册");
        }

        // 3. 创建用户
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());       // ✅ 新增
        user.setRole("USER");                    // ✅ 默认角色
        user.setCreatedAt(LocalDateTime.now());  // ✅ 当前时间

        // 4. 保存
        userRepository.save(user);
    }


    @Override
    public String login(LoginRequest request) {
        // 根据用户名查用户
        User user = userRepository.findByUsername(request.getUsername());
        if (user == null) {
            return "用户不存在"; // ❌ 占位，稍后改为 JSON 响应
        }

        // 校验密码
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return "密码错误"; // ❌ 占位，同上
        }

        // ✅ 生成 JWT Token

        // ✅ 推荐返回 JSON 格式
        return JwtUtil.generateToken(user.getUsername());
    }

}

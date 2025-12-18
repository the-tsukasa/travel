package com.example.travel.controller;

import com.example.travel.dto.LoginRequest;
import com.example.travel.dto.LoginResponse;
import com.example.travel.dto.RegisterRequest;
import com.example.travel.entity.User;
import com.example.travel.exception.ResourceNotFoundException;
import com.example.travel.repository.UserRepository;
import com.example.travel.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody RegisterRequest request) {
        userService.register(request);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "登録が完了しました ✅");
        response.put("username", request.getUsername());
        response.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.ok(response);
    }

    /**
     * 登录接口 - 优化为返回统一的 JSON 格式
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        String token = userService.login(request);
        
        // 获取用户信息（登录成功后用户肯定存在）
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", request.getUsername()));
        
        LoginResponse response = new LoginResponse();
        response.setToken(token);
        response.setUsername(user.getUsername());
        // 处理 role 为 null 的情况（兼容旧数据）
        response.setRole(user.getRole() != null ? user.getRole() : "USER");
        response.setMessage("ログイン成功");
        
        return ResponseEntity.ok(response);
    }
}

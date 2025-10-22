package com.example.travel.controller;

import com.example.travel.dto.RegisterRequest;
import com.example.travel.dto.LoginRequest;
import com.example.travel.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody RegisterRequest request) {
        userService.register(request);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "注册成功 ✅");
        response.put("username", request.getUsername());
        response.put("timestamp", LocalDateTime.now().toString());
        return response;
    }

    @PostMapping("/login")
    public String login(@RequestBody LoginRequest request) {
        return userService.login(request);
    }
}

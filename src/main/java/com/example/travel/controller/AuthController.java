package com.example.travel.controller;

import com.example.travel.dto.RegisterRequest;
import com.example.travel.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import com.example.travel.dto.LoginRequest;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @PostMapping("/register")
    public String register(@RequestBody RegisterRequest request) {
        userService.register(request);
        return "注册成功";

    }
    @PostMapping("/login")
    public String login(@RequestBody LoginRequest request) {
        return userService.login(request);

    }

}

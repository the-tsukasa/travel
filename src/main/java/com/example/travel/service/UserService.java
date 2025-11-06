package com.example.travel.service;

import com.example.travel.dto.LoginRequest;
import com.example.travel.dto.RegisterRequest;
import com.example.travel.dto.UpdateProfileRequest;

public interface UserService {
    void register(RegisterRequest request);
    String login(LoginRequest request); // 新加
    void updateProfile(String username, UpdateProfileRequest request);
}

package com.example.travel.controller;

import com.example.travel.repository.UserRepository;
import com.example.travel.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class FileUploadController {

    private final UserRepository userRepository;

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    @PostMapping("/avatar")
    public ResponseEntity<Map<String, Object>> uploadAvatar(@RequestParam("file") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // 验证文件
            if (file.isEmpty()) {
                response.put("success", false);
                response.put("message", "ファイルが選択されていません");
                return ResponseEntity.badRequest().body(response);
            }

            // 验证文件类型
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                response.put("success", false);
                response.put("message", "画像ファイルのみアップロードできます");
                return ResponseEntity.badRequest().body(response);
            }

            // 验证文件大小 (5MB)
            if (file.getSize() > 5 * 1024 * 1024) {
                response.put("success", false);
                response.put("message", "ファイルサイズは5MB以下にしてください");
                return ResponseEntity.badRequest().body(response);
            }

            // 获取当前用户
            String username = (String) SecurityContextHolder.getContext()
                    .getAuthentication()
                    .getPrincipal();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("ユーザーが見つかりません"));

            // 创建上传目录
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // 生成唯一文件名
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String filename = "avatar_" + user.getId() + "_" + UUID.randomUUID().toString() + extension;

            // 保存文件
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // 删除旧头像（如果存在）
            if (user.getAvatarUrl() != null && !user.getAvatarUrl().isEmpty()) {
                String oldFilename = user.getAvatarUrl();
                // 如果旧头像是本地文件（不是URL），则删除
                if (!oldFilename.startsWith("http://") && !oldFilename.startsWith("https://")) {
                    Path oldFilePath = uploadPath.resolve(oldFilename);
                    try {
                        Files.deleteIfExists(oldFilePath);
                    } catch (IOException e) {
                        log.warn("旧头像ファイルの削除に失敗しました: {}", oldFilename, e);
                    }
                }
            }

            // 更新用户头像URL（存储相对路径）
            String avatarUrl = filename;
            user.setAvatarUrl(avatarUrl);
            userRepository.save(user);

            // 返回成功响应
            response.put("success", true);
            response.put("message", "アバターが正常にアップロードされました");
            response.put("avatarUrl", "/uploads/" + avatarUrl);
            response.put("filename", avatarUrl);

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            log.error("ファイルアップロードエラー", e);
            response.put("success", false);
            response.put("message", "ファイルアップロードに失敗しました: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        } catch (Exception e) {
            log.error("アバターアップロードエラー", e);
            response.put("success", false);
            response.put("message", "エラーが発生しました: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}


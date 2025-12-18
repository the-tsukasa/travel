package com.example.travel.controller;

import com.example.travel.repository.UserRepository;
import com.example.travel.entity.User;
import com.example.travel.util.FileValidationUtil;
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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
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

            // 验证文件类型（包含扩展名、Content-Type 和 Magic Number 验证）
            if (!FileValidationUtil.isValidImageFile(file)) {
                response.put("success", false);
                response.put("message", "画像ファイルのみアップロードできます。有効な形式: JPG, PNG, GIF, WebP");
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

            // 生成唯一文件名（使用验证后的扩展名）
            String originalFilename = file.getOriginalFilename();
            String extension = FileValidationUtil.getFileExtension(originalFilename != null ? originalFilename : "jpg");
            // 如果扩展名为空，使用默认的 .jpg
            if (extension.isEmpty()) {
                extension = ".jpg";
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

    @PostMapping("/note-image")
    public ResponseEntity<Map<String, Object>> uploadNoteImage(@RequestParam("file") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // 验证文件
            if (file.isEmpty()) {
                response.put("success", false);
                response.put("message", "ファイルが選択されていません");
                return ResponseEntity.badRequest().body(response);
            }

            // 验证文件类型（包含扩展名、Content-Type 和 Magic Number 验证）
            if (!FileValidationUtil.isValidImageFile(file)) {
                response.put("success", false);
                response.put("message", "画像ファイルのみアップロードできます。有効な形式: JPG, PNG, GIF, WebP");
                return ResponseEntity.badRequest().body(response);
            }

            // 验证文件大小 (10MB，笔记图片可能更大)
            if (file.getSize() > 10 * 1024 * 1024) {
                response.put("success", false);
                response.put("message", "ファイルサイズは10MB以下にしてください");
                return ResponseEntity.badRequest().body(response);
            }

            // 获取当前用户
            String username = (String) SecurityContextHolder.getContext()
                    .getAuthentication()
                    .getPrincipal();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("ユーザーが見つかりません"));

            // 创建上传目录（notes 子文件夹）
            Path uploadPath = Paths.get(uploadDir, "notes");
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // 生成唯一文件名（使用验证后的扩展名）
            String originalFilename = file.getOriginalFilename();
            String extension = FileValidationUtil.getFileExtension(originalFilename != null ? originalFilename : "jpg");
            if (extension.isEmpty()) {
                extension = ".jpg";
            }
            String filename = "note_" + user.getId() + "_" + UUID.randomUUID().toString() + extension;

            // 保存文件
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // 返回成功响应（存储相对路径，包含 notes 子文件夹）
            String imageUrl = "notes/" + filename;

            response.put("success", true);
            response.put("message", "画像が正常にアップロードされました");
            response.put("imageUrl", "/uploads/" + imageUrl);
            response.put("filename", imageUrl);

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            log.error("ファイルアップロードエラー", e);
            response.put("success", false);
            response.put("message", "ファイルアップロードに失敗しました: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        } catch (Exception e) {
            log.error("ノート画像アップロードエラー", e);
            response.put("success", false);
            response.put("message", "エラーが発生しました: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/note-images")
    public ResponseEntity<Map<String, Object>> uploadNoteImages(@RequestParam("files") MultipartFile[] files) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // 验证文件数量（最多9张）
            if (files == null || files.length == 0) {
                response.put("success", false);
                response.put("message", "ファイルが選択されていません");
                return ResponseEntity.badRequest().body(response);
            }

            if (files.length > 9) {
                response.put("success", false);
                response.put("message", "画像は最大9枚までアップロードできます");
                return ResponseEntity.badRequest().body(response);
            }

            // 获取当前用户
            String username = (String) SecurityContextHolder.getContext()
                    .getAuthentication()
                    .getPrincipal();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("ユーザーが見つかりません"));

            // 创建上传目录（notes 子文件夹）
            Path uploadPath = Paths.get(uploadDir, "notes");
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            List<String> uploadedFiles = new ArrayList<>();
            List<String> uploadedUrls = new ArrayList<>();
            List<String> errors = new ArrayList<>();

            // 处理每个文件
            for (int i = 0; i < files.length; i++) {
                MultipartFile file = files[i];
                
                try {
                    // 验证文件
                    if (file.isEmpty()) {
                        errors.add("ファイル " + (i + 1) + " が空です");
                        continue;
                    }

                    // 验证文件类型（包含扩展名、Content-Type 和 Magic Number 验证）
                    if (!FileValidationUtil.isValidImageFile(file)) {
                        errors.add("ファイル " + (i + 1) + " は有効な画像ファイルではありません（JPG, PNG, GIF, WebP のみ）");
                        continue;
                    }

                    // 验证文件大小 (10MB)
                    if (file.getSize() > 10 * 1024 * 1024) {
                        errors.add("ファイル " + (i + 1) + " のサイズが10MBを超えています");
                        continue;
                    }

                    // 生成唯一文件名（使用验证后的扩展名）
                    String originalFilename = file.getOriginalFilename();
                    String extension = FileValidationUtil.getFileExtension(originalFilename != null ? originalFilename : "jpg");
                    if (extension.isEmpty()) {
                        extension = ".jpg";
                    }
                    String filename = "note_" + user.getId() + "_" + UUID.randomUUID().toString() + extension;

                    // 保存文件
                    Path filePath = uploadPath.resolve(filename);
                    Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

                    // 保存相对路径
                    String imageUrl = "notes/" + filename;
                    uploadedFiles.add(imageUrl);
                    uploadedUrls.add("/uploads/" + imageUrl);

                } catch (IOException e) {
                    log.error("ファイル " + (i + 1) + " のアップロードエラー", e);
                    errors.add("ファイル " + (i + 1) + " のアップロードに失敗しました: " + e.getMessage());
                }
            }

            // 如果所有文件都失败
            if (uploadedFiles.isEmpty()) {
                response.put("success", false);
                response.put("message", "すべてのファイルのアップロードに失敗しました: " + String.join(", ", errors));
                return ResponseEntity.badRequest().body(response);
            }

            // 返回成功响应
            response.put("success", true);
            response.put("message", uploadedFiles.size() + " 枚の画像が正常にアップロードされました");
            response.put("filenames", uploadedFiles); // 相对路径数组
            response.put("imageUrls", uploadedUrls); // 完整URL数组
            if (!errors.isEmpty()) {
                response.put("warnings", errors);
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("ノート画像アップロードエラー", e);
            response.put("success", false);
            response.put("message", "エラーが発生しました: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}


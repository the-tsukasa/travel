package com.example.travel.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 文件上传响应 DTO
 * 统一文件上传接口的返回格式
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FileUploadResponse {
    private boolean success;
    private String message;
    private String avatarUrl;  // 头像上传时使用
    private List<String> imageUrls;  // 多图上传时使用
    private List<String> filenames;  // 文件名列表
    private List<String> warnings;  // 警告信息（如果有）

    // 头像上传成功响应
    public static FileUploadResponse avatarSuccess(String message, String avatarUrl) {
        FileUploadResponse response = new FileUploadResponse();
        response.setSuccess(true);
        response.setMessage(message);
        response.setAvatarUrl(avatarUrl);
        return response;
    }

    // 多图上传成功响应
    public static FileUploadResponse imagesSuccess(String message, List<String> imageUrls, List<String> filenames) {
        FileUploadResponse response = new FileUploadResponse();
        response.setSuccess(true);
        response.setMessage(message);
        response.setImageUrls(imageUrls);
        response.setFilenames(filenames);
        return response;
    }

    // 失败响应
    public static FileUploadResponse failure(String message) {
        FileUploadResponse response = new FileUploadResponse();
        response.setSuccess(false);
        response.setMessage(message);
        return response;
    }
}

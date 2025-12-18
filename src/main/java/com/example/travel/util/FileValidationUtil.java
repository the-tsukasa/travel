package com.example.travel.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.Set;

/**
 * 文件验证工具类
 * 用于验证上传文件的类型和安全性
 */
@Slf4j
public class FileValidationUtil {

    // 允许的图片文件扩展名白名单
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            ".jpg", ".jpeg", ".png", ".gif", ".webp"
    );

    // 文件类型 Magic Number 定义
    private static final byte[] JPEG_SIGNATURE = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] PNG_SIGNATURE = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
    private static final byte[] GIF_SIGNATURE_1 = {0x47, 0x49, 0x46, 0x38, 0x37, 0x61}; // GIF87a
    private static final byte[] GIF_SIGNATURE_2 = {0x47, 0x49, 0x46, 0x38, 0x39, 0x61}; // GIF89a
    private static final byte[] WEBP_SIGNATURE = {0x52, 0x49, 0x46, 0x46}; // RIFF (WebP starts with RIFF)

    /**
     * 验证文件是否为有效的图片文件
     * 
     * @param file 上传的文件
     * @return true 如果是有效的图片文件，false 否则
     */
    public static boolean isValidImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return false;
        }

        // 1. 检查文件扩展名
        String filename = file.getOriginalFilename();
        if (filename == null || !hasValidExtension(filename)) {
            log.warn("文件扩展名不合法: {}", filename);
            return false;
        }

        // 2. 检查 Content-Type（第一层验证）
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            log.warn("Content-Type 不合法: {}", contentType);
            return false;
        }

        // 3. 检查文件真实类型（Magic Number，防止伪造）
        try {
            if (!isValidImageContent(file.getInputStream())) {
                log.warn("文件内容验证失败（Magic Number 不匹配）: {}", filename);
                return false;
            }
        } catch (IOException e) {
            log.error("读取文件内容失败: {}", filename, e);
            return false;
        }

        return true;
    }

    /**
     * 检查文件扩展名是否在白名单中
     */
    private static boolean hasValidExtension(String filename) {
        String lowerFilename = filename.toLowerCase();
        return ALLOWED_EXTENSIONS.stream()
                .anyMatch(ext -> lowerFilename.endsWith(ext));
    }

    /**
     * 通过 Magic Number 验证文件真实类型
     * 这是最重要的安全检查，防止恶意文件伪装成图片
     */
    private static boolean isValidImageContent(InputStream inputStream) throws IOException {
        if (inputStream == null) {
            return false;
        }

        // 读取文件头（Magic Number）
        byte[] header = new byte[12];
        int bytesRead = inputStream.read(header);
        if (bytesRead < 4) {
            return false;
        }

        // 检查 JPEG
        if (bytesRead >= 3 && matchesSignature(header, JPEG_SIGNATURE)) {
            return true;
        }

        // 检查 PNG
        if (bytesRead >= 8 && matchesSignature(header, PNG_SIGNATURE)) {
            return true;
        }

        // 检查 GIF
        if (bytesRead >= 6 && (matchesSignature(header, GIF_SIGNATURE_1) || matchesSignature(header, GIF_SIGNATURE_2))) {
            return true;
        }

        // 检查 WebP (RIFF header)
        if (bytesRead >= 4 && matchesSignature(header, WEBP_SIGNATURE)) {
            // WebP 需要进一步验证，这里简化处理
            // 完整的 WebP 验证需要检查更多字节
            return true;
        }

        return false;
    }

    /**
     * 检查文件头是否匹配指定的签名
     */
    private static boolean matchesSignature(byte[] header, byte[] signature) {
        if (header.length < signature.length) {
            return false;
        }
        for (int i = 0; i < signature.length; i++) {
            if (header[i] != signature[i]) {
                return false;
            }
        }
        return true;
    }

    /**
     * 获取文件的扩展名
     */
    public static String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf(".")).toLowerCase();
    }

    /**
     * 验证文件扩展名
     */
    public static boolean hasValidExtensionOnly(String filename) {
        return hasValidExtension(filename);
    }
}


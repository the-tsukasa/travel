package com.example.travel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.util.List;

@Data
public class CreateNotesRequest {
    
    @NotBlank(message = "标题不能为空")
    @Size(max = 200, message = "标题长度不能超过200个字符")
    private String title;

    @NotBlank(message = "内容不能为空")
    @Size(max = 5000, message = "内容长度不能超过5000个字符")
    private String content;

    private String imageUrl; // 兼容旧版本：单张图片或JSON数组字符串
    private List<String> imageUrls; // 新版本：多张图片路径列表
    private String location;
}

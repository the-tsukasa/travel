package com.example.travel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateNotesRequest {
    
    @NotBlank(message = "标题不能为空")
    @Size(max = 200, message = "标题长度不能超过200个字符")
    private String title;

    @NotBlank(message = "内容不能为空")
    @Size(max = 5000, message = "内容长度不能超过5000个字符")
    private String content;

    private String imageUrl;
    private String location;
}

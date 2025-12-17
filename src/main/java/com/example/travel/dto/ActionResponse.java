package com.example.travel.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 操作响应 DTO
 * 用于点赞、收藏等操作的统一响应格式
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActionResponse {
    private boolean success;
    private String message;
    private Integer likesCount;
    private Integer favoritesCount;
    private Boolean isLiked;
    private Boolean isFavorited;

    // 点赞响应构造器
    public static ActionResponse likeResponse(boolean success, String message, int likesCount, boolean isLiked) {
        ActionResponse response = new ActionResponse();
        response.setSuccess(success);
        response.setMessage(message);
        response.setLikesCount(likesCount);
        response.setIsLiked(isLiked);
        return response;
    }

    // 收藏响应构造器
    public static ActionResponse favoriteResponse(boolean success, String message, int favoritesCount, boolean isFavorited) {
        ActionResponse response = new ActionResponse();
        response.setSuccess(success);
        response.setMessage(message);
        response.setFavoritesCount(favoritesCount);
        response.setIsFavorited(isFavorited);
        return response;
    }

    // 通用成功响应
    public static ActionResponse success(String message) {
        ActionResponse response = new ActionResponse();
        response.setSuccess(true);
        response.setMessage(message);
        return response;
    }
}

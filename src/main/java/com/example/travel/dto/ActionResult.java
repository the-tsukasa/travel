package com.example.travel.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 操作结果 DTO
 * 用于 Service 层返回操作结果
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActionResult {
    private boolean success;
    private String message;
    private Integer likesCount;
    private Integer favoritesCount;
    private Boolean isLiked;
    private Boolean isFavorited;

    // 点赞结果构造器
    public static ActionResult likeResult(int likesCount, boolean isLiked) {
        ActionResult result = new ActionResult();
        result.setSuccess(true);
        result.setMessage(isLiked ? "いいねしました" : "いいねを解除しました");
        result.setLikesCount(likesCount);
        result.setIsLiked(isLiked);
        return result;
    }

    // 收藏结果构造器
    public static ActionResult favoriteResult(int favoritesCount, boolean isFavorited) {
        ActionResult result = new ActionResult();
        result.setSuccess(true);
        result.setMessage(isFavorited ? "お気に入りに追加しました" : "お気に入りを解除しました");
        result.setFavoritesCount(favoritesCount);
        result.setIsFavorited(isFavorited);
        return result;
    }
}

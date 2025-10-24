package com.example.travel.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.travel.entity.Favorites;
import com.example.travel.entity.User;

public interface FavoritesService {
    
    // 添加收藏
    void addToFavorites(Long notesId, User user);
    
    // 取消收藏
    void removeFromFavorites(Long notesId, User user);
    
    // 获取用户的收藏列表
    Page<Favorites> getUserFavorites(User user, Pageable pageable);
    
    // 检查是否已收藏
    boolean isFavorited(Long notesId, User user);
}

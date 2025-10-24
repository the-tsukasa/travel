package com.example.travel.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.travel.entity.Favorites;
import com.example.travel.entity.User;
import com.example.travel.service.FavoritesService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoritesController {

    private final FavoritesService favoritesService;

    // 添加收藏
    @PostMapping("/{notesId}")
    public ResponseEntity<Void> addToFavorites(@PathVariable Long notesId, 
                                             Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        favoritesService.addToFavorites(notesId, user);
        return ResponseEntity.ok().build();
    }

    // 取消收藏
    @DeleteMapping("/{notesId}")
    public ResponseEntity<Void> removeFromFavorites(@PathVariable Long notesId, 
                                                  Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        favoritesService.removeFromFavorites(notesId, user);
        return ResponseEntity.ok().build();
    }

    // 获取用户的收藏列表
    @GetMapping
    public ResponseEntity<Page<Favorites>> getUserFavorites(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        Pageable pageable = PageRequest.of(page, size);
        Page<Favorites> favorites = favoritesService.getUserFavorites(user, pageable);
        return ResponseEntity.ok(favorites);
    }

    // 检查是否已收藏
    @GetMapping("/{notesId}/status")
    public ResponseEntity<Boolean> isFavorited(@PathVariable Long notesId, 
                                            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        boolean isFavorited = favoritesService.isFavorited(notesId, user);
        return ResponseEntity.ok(isFavorited);
    }
}

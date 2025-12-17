package com.example.travel.controller;

import java.util.List;

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

import com.example.travel.dto.NotesDTO;
import com.example.travel.entity.Favorites;
import com.example.travel.entity.User;
import com.example.travel.exception.ResourceNotFoundException;
import com.example.travel.repository.UserRepository;
import com.example.travel.service.FavoritesService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoritesController {

    private final FavoritesService favoritesService;
    private final UserRepository userRepository;

    // 添加收藏
    @PostMapping("/{notesId}")
    public ResponseEntity<Void> addToFavorites(@PathVariable Long notesId, 
                                             Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
        favoritesService.addToFavorites(notesId, user);
        return ResponseEntity.ok().build();
    }

    // 取消收藏
    @DeleteMapping("/{notesId}")
    public ResponseEntity<Void> removeFromFavorites(@PathVariable Long notesId, 
                                                  Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
        favoritesService.removeFromFavorites(notesId, user);
        return ResponseEntity.ok().build();
    }

    // 获取用户的收藏列表（分页，返回Favorites实体）
    @GetMapping
    public ResponseEntity<Page<Favorites>> getUserFavorites(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
        Pageable pageable = PageRequest.of(page, size);
        Page<Favorites> favorites = favoritesService.getUserFavorites(user, pageable);
        return ResponseEntity.ok(favorites);
    }

    // 获取用户收藏的笔记列表（返回NotesDTO）
    @GetMapping("/my")
    public ResponseEntity<List<NotesDTO>> getMyFavoriteNotes(Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
        List<NotesDTO> favoriteNotes = favoritesService.getUserFavoriteNotes(user);
        return ResponseEntity.ok(favoriteNotes);
    }

    // 检查是否已收藏
    @GetMapping("/{notesId}/status")
    public ResponseEntity<Boolean> isFavorited(@PathVariable Long notesId, 
                                            Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
        boolean isFavorited = favoritesService.isFavorited(notesId, user);
        return ResponseEntity.ok(isFavorited);
    }
}

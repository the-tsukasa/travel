package com.example.travel.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.travel.entity.Notes;
import com.example.travel.entity.User;
import com.example.travel.service.LikesService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/likes")
@RequiredArgsConstructor
public class LikesController {

    private final LikesService likesService;

    // 点赞
    @PostMapping("/{notesId}")
    public ResponseEntity<Void> likeNotes(@PathVariable Long notesId, 
                                        Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        likesService.likeNotes(notesId, user);
        return ResponseEntity.ok().build();
    }

    // 取消点赞
    @DeleteMapping("/{notesId}")
    public ResponseEntity<Void> unlikeNotes(@PathVariable Long notesId, 
                                         Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        likesService.unlikeNotes(notesId, user);
        return ResponseEntity.ok().build();
    }

    // 获取用户点赞的笔记列表
    @GetMapping
    public ResponseEntity<List<Notes>> getUserLikedNotes(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<Notes> likedNotes = likesService.getUserLikedNotes(user);
        return ResponseEntity.ok(likedNotes);
    }

    // 检查是否已点赞
    @GetMapping("/{notesId}/status")
    public ResponseEntity<Boolean> isLiked(@PathVariable Long notesId, 
                                        Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        boolean isLiked = likesService.isLiked(notesId, user);
        return ResponseEntity.ok(isLiked);
    }
}

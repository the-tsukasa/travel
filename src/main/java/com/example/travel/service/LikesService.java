package com.example.travel.service;

import java.util.List;

import com.example.travel.entity.Notes;
import com.example.travel.entity.User;

public interface LikesService {
    
    // 点赞
    void likeNotes(Long notesId, User user);
    
    // 取消点赞
    void unlikeNotes(Long notesId, User user);
    
    // 获取用户点赞的笔记列表
    List<Notes> getUserLikedNotes(User user);
    
    // 检查是否已点赞
    boolean isLiked(Long notesId, User user);
}

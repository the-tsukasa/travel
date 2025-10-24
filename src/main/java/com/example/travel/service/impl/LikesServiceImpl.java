package com.example.travel.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.travel.entity.Likes;
import com.example.travel.entity.Notes;
import com.example.travel.entity.User;
import com.example.travel.repository.LikesRepository;
import com.example.travel.repository.NotesRepository;
import com.example.travel.service.LikesService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class LikesServiceImpl implements LikesService {

    private final LikesRepository likesRepository;
    private final NotesRepository notesRepository;

    @Override
    public void likeNotes(Long notesId, User user) {
        Notes notes = notesRepository.findById(notesId)
                .orElseThrow(() -> new RuntimeException("笔记不存在"));

        if (likesRepository.existsByUserAndNotes(user, notes)) {
            throw new RuntimeException("已经点赞过此笔记");
        }

        Likes likes = new Likes();
        likes.setUser(user);
        likes.setNotes(notes);
        likesRepository.save(likes);

        // 更新笔记的点赞数
        notes.setLikesCount(notes.getLikesCount() + 1);
        notesRepository.save(notes);
    }

    @Override
    public void unlikeNotes(Long notesId, User user) {
        Notes notes = notesRepository.findById(notesId)
                .orElseThrow(() -> new RuntimeException("笔记不存在"));

        Likes likes = likesRepository.findByUserAndNotes(user, notes)
                .orElseThrow(() -> new RuntimeException("未点赞此笔记"));

        likesRepository.delete(likes);

        // 更新笔记的点赞数
        notes.setLikesCount(Math.max(0, notes.getLikesCount() - 1));
        notesRepository.save(notes);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Notes> getUserLikedNotes(User user) {
        return likesRepository.findNotesByUser(user);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isLiked(Long notesId, User user) {
        Notes notes = notesRepository.findById(notesId)
                .orElseThrow(() -> new RuntimeException("笔记不存在"));
        return likesRepository.existsByUserAndNotes(user, notes);
    }
}

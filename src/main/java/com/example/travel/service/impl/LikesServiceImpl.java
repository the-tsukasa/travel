package com.example.travel.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.travel.dto.NotesDTO;
import com.example.travel.entity.Likes;
import com.example.travel.entity.Notes;
import com.example.travel.entity.User;
import com.example.travel.exception.BusinessException;
import com.example.travel.exception.ResourceNotFoundException;
import com.example.travel.repository.FavoritesRepository;
import com.example.travel.repository.LikesRepository;
import com.example.travel.repository.NotesRepository;
import com.example.travel.service.LikesService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class LikesServiceImpl implements LikesService {

    private final LikesRepository likesRepository;
    private final NotesRepository notesRepository;
    private final FavoritesRepository favoritesRepository;

    @Override
    public void likeNotes(Long notesId, User user) {
        Notes notes = notesRepository.findById(notesId)
                .orElseThrow(() -> new ResourceNotFoundException("Notes", "id", notesId));

        // 先检查是否已点赞（避免唯一约束冲突）
        if (likesRepository.existsByUserAndNotes(user, notes)) {
            log.warn("用户 {} 已经点赞过笔记 {}", user.getUsername(), notesId);
            throw new BusinessException("ALREADY_LIKED", "已经点赞过此笔记");
        }

        try {
            Likes likes = new Likes();
            likes.setUser(user);
            likes.setNotes(notes);
            likesRepository.save(likes);
            log.debug("用户 {} 成功点赞笔记 {}", user.getUsername(), notesId);

            // 从数据库重新计算点赞数，确保计数准确（解决并发问题）
            long actualCount = likesRepository.countByNotes(notes);
            notes.setLikesCount((int) actualCount);
            notesRepository.save(notes);
        } catch (DataIntegrityViolationException e) {
            // 处理唯一约束冲突（并发情况下的重复点赞）
            log.warn("数据库唯一约束冲突：用户 {} 尝试重复点赞笔记 {}，可能由并发请求引起", 
                    user.getUsername(), notesId);
            throw new BusinessException("ALREADY_LIKED", "已经点赞过此笔记");
        }
    }

    @Override
    public void unlikeNotes(Long notesId, User user) {
        Notes notes = notesRepository.findById(notesId)
                .orElseThrow(() -> new ResourceNotFoundException("Notes", "id", notesId));

        Likes likes = likesRepository.findByUserAndNotes(user, notes)
                .orElseThrow(() -> new ResourceNotFoundException("Likes", "user and notes", user.getUsername() + " and notes " + notesId));

        likesRepository.delete(likes);
        log.debug("用户 {} 成功取消点赞笔记 {}", user.getUsername(), notesId);

        // 从数据库重新计算点赞数，确保计数准确（解决并发问题）
        long actualCount = likesRepository.countByNotes(notes);
        notes.setLikesCount((int) actualCount);
        notesRepository.save(notes);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Notes> getUserLikedNotes(User user) {
        return likesRepository.findNotesByUser(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotesDTO> getUserLikedNotesDTO(User user) {
        List<Notes> notes = likesRepository.findNotesByUserWithUser(user);
        return notes.stream()
                .map(note -> convertToDTO(note, user))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isLiked(Long notesId, User user) {
        Notes notes = notesRepository.findById(notesId)
                .orElseThrow(() -> new ResourceNotFoundException("Notes", "id", notesId));
        return likesRepository.existsByUserAndNotes(user, notes);
    }

    private NotesDTO convertToDTO(Notes notes, User currentUser) {
        NotesDTO dto = new NotesDTO();
        dto.setId(notes.getId());
        dto.setTitle(notes.getTitle());
        dto.setContent(notes.getContent());
        dto.setImageUrl(notes.getImageUrl());
        dto.setLocation(notes.getLocation());
        dto.setLikesCount(notes.getLikesCount());
        dto.setFavoritesCount(notes.getFavoritesCount());
        dto.setIsApproved(notes.getIsApproved());
        dto.setCreatedAt(notes.getCreatedAt());
        dto.setUpdatedAt(notes.getUpdatedAt());
        if (notes.getUser() != null) {
            dto.setUsername(notes.getUser().getUsername());
        }

        if (currentUser != null) {
            dto.setIsLiked(likesRepository.existsByUserAndNotes(currentUser, notes));
            dto.setIsFavorited(favoritesRepository.existsByUserAndNotes(currentUser, notes));
        }

        return dto;
    }
}

package com.example.travel.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.travel.dto.NotesDTO;
import com.example.travel.entity.Favorites;
import com.example.travel.entity.Notes;
import com.example.travel.entity.User;
import com.example.travel.repository.FavoritesRepository;
import com.example.travel.repository.LikesRepository;
import com.example.travel.repository.NotesRepository;
import com.example.travel.service.FavoritesService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class FavoritesServiceImpl implements FavoritesService {

    private final FavoritesRepository favoritesRepository;
    private final NotesRepository notesRepository;
    private final LikesRepository likesRepository;

    @Override
    public void addToFavorites(Long notesId, User user) {
        Notes notes = notesRepository.findById(notesId)
                .orElseThrow(() -> new RuntimeException("笔记不存在"));

        if (favoritesRepository.existsByUserAndNotes(user, notes)) {
            throw new RuntimeException("已经收藏过此笔记");
        }

        Favorites favorites = new Favorites();
        favorites.setUser(user);
        favorites.setNotes(notes);
        favoritesRepository.save(favorites);

        // 从数据库重新计算收藏数，确保计数准确（解决并发问题）
        long actualCount = favoritesRepository.countByNotes(notes);
        notes.setFavoritesCount((int) actualCount);
        notesRepository.save(notes);
    }

    @Override
    public void removeFromFavorites(Long notesId, User user) {
        Notes notes = notesRepository.findById(notesId)
                .orElseThrow(() -> new RuntimeException("笔记不存在"));

        Favorites favorites = favoritesRepository.findByUserAndNotes(user, notes)
                .orElseThrow(() -> new RuntimeException("未收藏此笔记"));

        favoritesRepository.delete(favorites);

        // 从数据库重新计算收藏数，确保计数准确（解决并发问题）
        long actualCount = favoritesRepository.countByNotes(notes);
        notes.setFavoritesCount((int) actualCount);
        notesRepository.save(notes);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Favorites> getUserFavorites(User user, Pageable pageable) {
        return favoritesRepository.findByUserOrderByCreatedAtDesc(user, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotesDTO> getUserFavoriteNotes(User user) {
        List<Notes> notes = favoritesRepository.findNotesByUserWithUser(user);
        return notes.stream()
                .map(note -> convertToDTO(note, user))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isFavorited(Long notesId, User user) {
        Notes notes = notesRepository.findById(notesId)
                .orElseThrow(() -> new RuntimeException("笔记不存在"));
        return favoritesRepository.existsByUserAndNotes(user, notes);
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

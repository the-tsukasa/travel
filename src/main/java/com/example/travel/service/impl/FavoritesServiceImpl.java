package com.example.travel.service.impl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.travel.entity.Favorites;
import com.example.travel.entity.Notes;
import com.example.travel.entity.User;
import com.example.travel.repository.FavoritesRepository;
import com.example.travel.repository.NotesRepository;
import com.example.travel.service.FavoritesService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class FavoritesServiceImpl implements FavoritesService {

    private final FavoritesRepository favoritesRepository;
    private final NotesRepository notesRepository;

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

        // 更新笔记的收藏数
        notes.setFavoritesCount(notes.getFavoritesCount() + 1);
        notesRepository.save(notes);
    }

    @Override
    public void removeFromFavorites(Long notesId, User user) {
        Notes notes = notesRepository.findById(notesId)
                .orElseThrow(() -> new RuntimeException("笔记不存在"));

        Favorites favorites = favoritesRepository.findByUserAndNotes(user, notes)
                .orElseThrow(() -> new RuntimeException("未收藏此笔记"));

        favoritesRepository.delete(favorites);

        // 更新笔记的收藏数
        notes.setFavoritesCount(Math.max(0, notes.getFavoritesCount() - 1));
        notesRepository.save(notes);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Favorites> getUserFavorites(User user, Pageable pageable) {
        return favoritesRepository.findByUserOrderByCreatedAtDesc(user, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isFavorited(Long notesId, User user) {
        Notes notes = notesRepository.findById(notesId)
                .orElseThrow(() -> new RuntimeException("笔记不存在"));
        return favoritesRepository.existsByUserAndNotes(user, notes);
    }
}

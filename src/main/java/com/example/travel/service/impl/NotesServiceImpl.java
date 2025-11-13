package com.example.travel.service.impl;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.travel.dto.CreateNotesRequest;
import com.example.travel.dto.NotesDTO;
import com.example.travel.entity.Notes;
import com.example.travel.entity.User;
import com.example.travel.exception.BusinessException;
import com.example.travel.exception.ResourceNotFoundException;
import com.example.travel.repository.FavoritesRepository;
import com.example.travel.repository.LikesRepository;
import com.example.travel.repository.NotesRepository;
import com.example.travel.service.NotesService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class NotesServiceImpl implements NotesService {

    private final NotesRepository notesRepository;
    private final LikesRepository likesRepository;
    private final FavoritesRepository favoritesRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public NotesDTO createNotes(CreateNotesRequest request, User user) {
        Notes notes = new Notes();
        notes.setTitle(request.getTitle());
        notes.setContent(request.getContent());
        // 处理图片：优先使用 imageUrls（多图片），否则使用 imageUrl（单图片或兼容旧格式）
        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            // 多图片：转换为 JSON 数组字符串存储
            try {
                String imageUrlsJson = objectMapper.writeValueAsString(request.getImageUrls());
                notes.setImageUrl(imageUrlsJson);
            } catch (Exception e) {
                throw new BusinessException("IMAGE_URLS_ERROR", "图片URL处理失败: " + e.getMessage());
            }
        } else if (request.getImageUrl() != null && !request.getImageUrl().isEmpty()) {
            // 单图片或旧格式
            notes.setImageUrl(request.getImageUrl());
        }
        notes.setLocation(request.getLocation());
        notes.setUser(user);
        notes.setIsApproved(false); // 新笔记需要审核

        Notes savedNotes = notesRepository.save(notes);
        return convertToDTO(savedNotes, user);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotesDTO> getApprovedNotes(Pageable pageable, User currentUser) {
        Page<Notes> notesPage = notesRepository.findByIsApprovedTrueOrderByCreatedAtDesc(pageable);
        return notesPage.map(notes -> convertToDTO(notes, currentUser));
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotesDTO> getUserNotes(User user) {
        List<Notes> notes = notesRepository.findByUserOrderByCreatedAtDesc(user);
        return notes.stream()
                .map(notes1 -> convertToDTO(notes1, user))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public NotesDTO getNotesById(Long id, User currentUser) {
        Notes notes = notesRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notes", "id", id));
        
        // 检查笔记是否已批准，或者当前用户是否为笔记作者
        if (!notes.getIsApproved() && (currentUser == null || notes.getUser() == null || !notes.getUser().getId().equals(currentUser.getId()))) {
            throw new BusinessException("NOTES_NOT_APPROVED", "笔记未审核，无法查看");
        }
        
        return convertToDTO(notes, currentUser);
    }

    @Override
    public NotesDTO updateNotes(Long id, CreateNotesRequest request, User user) {
        Notes notes = notesRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notes", "id", id));

        if (notes.getUser() == null || !notes.getUser().getId().equals(user.getId())) {
            throw new BusinessException("NO_PERMISSION", "无权限修改此笔记");
        }

        notes.setTitle(request.getTitle());
        notes.setContent(request.getContent());
        // 处理图片：优先使用 imageUrls（多图片），否则使用 imageUrl（单图片或兼容旧格式）
        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            // 多图片：转换为 JSON 数组字符串存储
            try {
                String imageUrlsJson = objectMapper.writeValueAsString(request.getImageUrls());
                notes.setImageUrl(imageUrlsJson);
            } catch (Exception e) {
                throw new BusinessException("IMAGE_URLS_ERROR", "图片URL处理失败: " + e.getMessage());
            }
        } else if (request.getImageUrl() != null && !request.getImageUrl().isEmpty()) {
            // 单图片或旧格式
            notes.setImageUrl(request.getImageUrl());
        } else {
            notes.setImageUrl(null);
        }
        notes.setLocation(request.getLocation());
        notes.setIsApproved(false); // 更新后需要重新审核

        Notes savedNotes = notesRepository.save(notes);
        return convertToDTO(savedNotes, user);
    }

    @Override
    public void deleteNotes(Long id, User user) {
        Notes notes = notesRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notes", "id", id));

        if (notes.getUser() == null || !notes.getUser().getId().equals(user.getId())) {
            throw new BusinessException("NO_PERMISSION", "无权限删除此笔记");
        }

        // 删除相关的点赞和收藏记录
        likesRepository.deleteByNotes(notes);
        favoritesRepository.deleteByNotes(notes);
        
        notesRepository.delete(notes);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotesDTO> searchNotes(String keyword, Pageable pageable, User currentUser) {
        Page<Notes> notesPage = notesRepository.searchApprovedNotes(keyword, pageable);
        return notesPage.map(notes -> convertToDTO(notes, currentUser));
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotesDTO> getPendingNotes() {
        List<Notes> notes = notesRepository.findByIsApprovedFalseOrderByCreatedAtDesc();
        return notes.stream()
                .map(notes1 -> convertToDTO(notes1, null))
                .collect(Collectors.toList());
    }

    @Override
    public void approveNotes(Long id) {
        Notes notes = notesRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notes", "id", id));
        notes.setIsApproved(true);
        notesRepository.save(notes);
    }

    @Override
    public void rejectNotes(Long id) {
        Notes notes = notesRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notes", "id", id));
        
        // 删除相关的点赞和收藏记录
        likesRepository.deleteByNotes(notes);
        favoritesRepository.deleteByNotes(notes);
        
        notesRepository.delete(notes);
    }

    private NotesDTO convertToDTO(Notes notes, User currentUser) {
        NotesDTO dto = new NotesDTO();
        dto.setId(notes.getId());
        dto.setTitle(notes.getTitle());
        dto.setContent(notes.getContent());
        
        // 处理图片URL：尝试解析为 JSON 数组（多图片），否则作为单图片处理
        String imageUrlStr = notes.getImageUrl();
        if (imageUrlStr != null && !imageUrlStr.isEmpty()) {
            try {
                // 尝试解析为 JSON 数组
                if (imageUrlStr.trim().startsWith("[")) {
                    List<String> imageUrls = objectMapper.readValue(imageUrlStr, new TypeReference<List<String>>() {});
                    List<String> processedUrls = new ArrayList<>();
                    for (String url : imageUrls) {
                        // 如果是本地文件（不是http/https），添加/uploads/前缀
                        if (url != null && !url.isEmpty() 
                            && !url.startsWith("http://") && !url.startsWith("https://")) {
                            processedUrls.add("/uploads/" + url);
                        } else {
                            processedUrls.add(url);
                        }
                    }
                    dto.setImageUrls(processedUrls);
                    // 为了兼容，也设置第一张图片到 imageUrl
                    if (!processedUrls.isEmpty()) {
                        dto.setImageUrl(processedUrls.get(0));
                    }
                } else {
                    // 单图片格式
                    String imageUrl = imageUrlStr;
                    if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
                        imageUrl = "/uploads/" + imageUrl;
                    }
                    dto.setImageUrl(imageUrl);
                    // 也设置到 imageUrls 数组（兼容新格式）
                    List<String> singleUrlList = new ArrayList<>();
                    singleUrlList.add(imageUrl);
                    dto.setImageUrls(singleUrlList);
                }
            } catch (Exception e) {
                // 解析失败，作为单图片处理
                String imageUrl = imageUrlStr;
                if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
                    imageUrl = "/uploads/" + imageUrl;
                }
                dto.setImageUrl(imageUrl);
                List<String> singleUrlList = new ArrayList<>();
                singleUrlList.add(imageUrl);
                dto.setImageUrls(singleUrlList);
            }
        }
        
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

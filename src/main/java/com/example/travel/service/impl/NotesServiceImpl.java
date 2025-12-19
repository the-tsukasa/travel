package com.example.travel.service.impl;

import java.time.LocalDateTime;
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
import com.example.travel.enums.NoteStatus;
import com.example.travel.exception.BusinessException;
import com.example.travel.exception.ResourceNotFoundException;
import com.example.travel.repository.FavoritesRepository;
import com.example.travel.repository.LikesRepository;
import com.example.travel.repository.NotesRepository;
import com.example.travel.repository.UserRepository;
import com.example.travel.service.NotesService;
import com.example.travel.service.NotificationService;
import com.example.travel.util.NoteStatusTransitionValidator;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class NotesServiceImpl implements NotesService {

    private final NotesRepository notesRepository;
    private final LikesRepository likesRepository;
    private final FavoritesRepository favoritesRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
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
        // 新创建的笔记状态为 DRAFT（草稿）
        notes.setStatus(NoteStatus.DRAFT);

        Notes savedNotes = notesRepository.save(notes);
        return convertToDTO(savedNotes, user);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotesDTO> getPublishedNotes(Pageable pageable, User currentUser) {
        Page<Notes> notesPage = notesRepository.findPublishedNotesOrderByCreatedAtDesc(pageable);
        return notesPage.map(notes -> convertToDTO(notes, currentUser));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotesDTO> getApprovedNotes(Pageable pageable, User currentUser) {
        // 向后兼容：使用新的状态查询
        return getPublishedNotes(pageable, currentUser);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotesDTO> getUserNotes(User user, NoteStatus status) {
        List<Notes> notes;
        if (status != null) {
            notes = notesRepository.findByUserAndStatusOrderByCreatedAtDesc(user, status);
        } else {
            notes = notesRepository.findByUserOrderByCreatedAtDesc(user);
        }
        return notes.stream()
                .map(note -> convertToDTO(note, user))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotesDTO> getUserNotes(User user) {
        return getUserNotes(user, null);
    }

    @Override
    @Transactional(readOnly = true)
    public NotesDTO getNotesById(Long id, User currentUser) {
        Notes notes = notesRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notes", "id", id));
        
        // 检查权限：只有已发布的笔记或笔记作者可以查看
        boolean isPublished = notes.getStatus() == NoteStatus.PUBLISHED;
        boolean isOwner = currentUser != null && notes.getUser() != null 
                && notes.getUser().getId().equals(currentUser.getId());
        
        if (!isPublished && !isOwner) {
            throw new BusinessException("NOTES_NOT_APPROVED", "笔记未发布，无法查看");
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

        // 只有 DRAFT、REJECTED、PRIVATE 状态的笔记可以编辑
        NoteStatus currentStatus = notes.getStatus();
        if (currentStatus != NoteStatus.DRAFT 
                && currentStatus != NoteStatus.REJECTED 
                && currentStatus != NoteStatus.PRIVATE) {
            throw new BusinessException("INVALID_STATUS", 
                    "只有草稿、已退回或已下架的笔记可以编辑。当前状态: " + currentStatus.getDescription());
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
        
        // 编辑后，如果之前是 REJECTED 或 PRIVATE，清除退回理由
        if (currentStatus == NoteStatus.REJECTED || currentStatus == NoteStatus.PRIVATE) {
            notes.setRejectReason(null);
        }
        // 编辑后状态保持为 DRAFT（如果之前是 REJECTED 或 PRIVATE，改为 DRAFT）
        if (currentStatus == NoteStatus.REJECTED || currentStatus == NoteStatus.PRIVATE) {
            notes.setStatus(NoteStatus.DRAFT);
        }

        Notes savedNotes = notesRepository.save(notes);
        return convertToDTO(savedNotes, user);
    }

    @Override
    public NotesDTO submitNotes(Long id, User user) {
        Notes notes = notesRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notes", "id", id));

        if (notes.getUser() == null || !notes.getUser().getId().equals(user.getId())) {
            throw new BusinessException("NO_PERMISSION", "无权限提交此笔记");
        }

        NoteStatus currentStatus = notes.getStatus();
        NoteStatus targetStatus = NoteStatus.PENDING;

        // 验证状态转换是否合法
        if (!NoteStatusTransitionValidator.isValidTransition(currentStatus, targetStatus)) {
            throw new BusinessException("INVALID_STATUS_TRANSITION", 
                    String.format("不允许的状态转换: %s -> %s。只有草稿、已退回或已下架的笔记可以提交审核。", 
                            currentStatus.getDescription(), targetStatus.getDescription()));
        }

        // 执行状态转换
        notes.setStatus(targetStatus);
        notes.setSubmittedAt(LocalDateTime.now());
        // 清除退回理由（如果存在）
        notes.setRejectReason(null);

        Notes savedNotes = notesRepository.save(notes);
        
        // 创建通知 - 用户提交笔记后
        try {
            // 1. 为用户创建提交成功通知
            log.info("创建提交通知 - 笔记ID: {}, 用户ID: {}", savedNotes.getId(), user.getId());
            notificationService.createNotification(
                user,
                "NOTE_SUBMITTED",
                "ノートが提出されました",
                String.format("「%s」が提出されました。管理者の審査をお待ちください。", savedNotes.getTitle()),
                savedNotes.getId()
            );
            
            // 2. 为所有管理员创建待审查通知
            List<User> admins = userRepository.findByRole("ADMIN");
            log.info("找到 {} 个管理员，将发送待审查通知", admins.size());
            for (User admin : admins) {
                try {
                    notificationService.createNotification(
                        admin,
                        "ADMIN_NOTE_PENDING",
                        "新しいノートが審査待ちです",
                        String.format("ユーザー「%s」が提出した「%s」が審査待ちです。", user.getUsername(), savedNotes.getTitle()),
                        savedNotes.getId()
                    );
                    log.info("管理员通知创建成功 - 管理员ID: {}, 笔记ID: {}", admin.getId(), savedNotes.getId());
                } catch (Exception e) {
                    log.error("为管理员创建通知失败 - 管理员ID: {}, 错误: {}", admin.getId(), e.getMessage(), e);
                }
            }
            
            log.info("提交通知创建成功 - 笔记ID: {}", savedNotes.getId());
        } catch (Exception e) {
            // 记录错误但不影响提交流程
            log.error("创建提交通知失败 - 笔记ID: {}, 错误: {}", savedNotes.getId(), e.getMessage(), e);
        }
        
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
        // 使用新的状态查询方法
        Page<Notes> notesPage = notesRepository.searchPublishedNotes(keyword, pageable);
        return notesPage.map(notes -> convertToDTO(notes, currentUser));
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotesDTO> getPendingNotes() {
        List<Notes> notes = notesRepository.findByStatusOrderByCreatedAtDesc(NoteStatus.PENDING);
        return notes.stream()
                .map(note -> convertToDTO(note, null))
                .collect(Collectors.toList());
    }

    @Override
    public void approveNotes(Long id, User admin) {
        Notes notes = notesRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notes", "id", id));

        NoteStatus currentStatus = notes.getStatus();
        NoteStatus targetStatus = NoteStatus.PUBLISHED;

        // 验证状态转换
        if (!NoteStatusTransitionValidator.isValidTransition(currentStatus, targetStatus)) {
            throw new BusinessException("INVALID_STATUS_TRANSITION", 
                    String.format("不允许的状态转换: %s -> %s。只有待审核的笔记可以批准。", 
                            currentStatus.getDescription(), targetStatus.getDescription()));
        }

        // 执行状态转换
        notes.setStatus(targetStatus);
        notes.setReviewedAt(LocalDateTime.now());
        notes.setReviewedBy(admin);
        notes.setRejectReason(null); // 清除退回理由

        notesRepository.save(notes);
        
        // 创建通知 - 显式获取用户信息（避免 LAZY 加载问题）
        // 先获取 user_id（即使 LAZY 也能获取 ID）
        Long userId = notes.getUser() != null ? notes.getUser().getId() : null;
        
        if (userId != null) {
            try {
                // 显式从数据库加载 User 实体
                User noteAuthor = userRepository.findById(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
                
                log.info("创建批准通知 - 笔记ID: {}, 笔记标题: {}, 作者ID: {}, 作者用户名: {}", 
                    notes.getId(), notes.getTitle(), noteAuthor.getId(), noteAuthor.getUsername());
                
                notificationService.createNotification(
                    noteAuthor,
                    "NOTE_APPROVED",
                    "ノートが承認されました",
                    String.format("「%s」が承認され、公開されました。プラットフォームで表示されています。", notes.getTitle()),
                    notes.getId()
                );
                
                log.info("批准通知创建成功 - 笔记ID: {}", notes.getId());
            } catch (Exception e) {
                // 记录错误但不影响审核流程
                log.error("创建批准通知失败 - 笔记ID: {}, 错误: {}", notes.getId(), e.getMessage(), e);
                System.err.println("创建通知失败: " + e.getMessage());
                e.printStackTrace();
            }
        } else {
            log.warn("无法创建批准通知 - 笔记ID: {}, 作者ID为空", id);
        }
    }

    @Override
    public void rejectNotes(Long id, String rejectReason, User admin) {
        Notes notes = notesRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notes", "id", id));

        NoteStatus currentStatus = notes.getStatus();
        NoteStatus targetStatus = NoteStatus.REJECTED;

        // 验证状态转换
        if (!NoteStatusTransitionValidator.isValidTransition(currentStatus, targetStatus)) {
            throw new BusinessException("INVALID_STATUS_TRANSITION", 
                    String.format("不允许的状态转换: %s -> %s。只有待审核的笔记可以退回。", 
                            currentStatus.getDescription(), targetStatus.getDescription()));
        }

        if (rejectReason == null || rejectReason.trim().isEmpty()) {
            throw new BusinessException("REJECT_REASON_REQUIRED", "退回理由不能为空");
        }

        // 执行状态转换
        notes.setStatus(targetStatus);
        notes.setRejectReason(rejectReason.trim());
        notes.setReviewedAt(LocalDateTime.now());
        notes.setReviewedBy(admin);

        notesRepository.save(notes);
        
        // 创建通知 - 显式获取用户信息（避免 LAZY 加载问题）
        // 先获取 user_id（即使 LAZY 也能获取 ID）
        Long userId = notes.getUser() != null ? notes.getUser().getId() : null;
        
        if (userId != null) {
            try {
                // 显式从数据库加载 User 实体
                User noteAuthor = userRepository.findById(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
                
                log.info("创建退回通知 - 笔记ID: {}, 笔记标题: {}, 作者ID: {}, 作者用户名: {}", 
                    notes.getId(), notes.getTitle(), noteAuthor.getId(), noteAuthor.getUsername());
                
                notificationService.createNotification(
                    noteAuthor,
                    "NOTE_REJECTED",
                    "ノートが差し戻されました",
                    String.format("「%s」が差し戻されました。理由：%s", notes.getTitle(), rejectReason.trim()),
                    notes.getId()
                );
                
                log.info("退回通知创建成功 - 笔记ID: {}", notes.getId());
            } catch (Exception e) {
                // 记录错误但不影响审核流程
                log.error("创建退回通知失败 - 笔记ID: {}, 错误: {}", notes.getId(), e.getMessage(), e);
                System.err.println("创建通知失败: " + e.getMessage());
                e.printStackTrace();
            }
        } else {
            log.warn("无法创建退回通知 - 笔记ID: {}, 作者ID为空", id);
        }
    }

    @Override
    public void unpublishNotes(Long id, User admin) {
        Notes notes = notesRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notes", "id", id));

        NoteStatus currentStatus = notes.getStatus();
        NoteStatus targetStatus = NoteStatus.PRIVATE;

        // 验证状态转换
        if (!NoteStatusTransitionValidator.isValidTransition(currentStatus, targetStatus)) {
            throw new BusinessException("INVALID_STATUS_TRANSITION", 
                    String.format("不允许的状态转换: %s -> %s。只有已发布的笔记可以下架。", 
                            currentStatus.getDescription(), targetStatus.getDescription()));
        }

        // 执行状态转换
        notes.setStatus(targetStatus);
        notes.setReviewedAt(LocalDateTime.now());
        notes.setReviewedBy(admin);

        notesRepository.save(notes);
        
        // 创建通知 - 显式获取用户信息（避免 LAZY 加载问题）
        // 先获取 user_id（即使 LAZY 也能获取 ID）
        Long userId = notes.getUser() != null ? notes.getUser().getId() : null;
        
        if (userId != null) {
            try {
                // 显式从数据库加载 User 实体
                User noteAuthor = userRepository.findById(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
                
                log.info("创建下架通知 - 笔记ID: {}, 笔记标题: {}, 作者ID: {}, 作者用户名: {}", 
                    notes.getId(), notes.getTitle(), noteAuthor.getId(), noteAuthor.getUsername());
                
                notificationService.createNotification(
                    noteAuthor,
                    "NOTE_UNPUBLISHED",
                    "ノートが非公開になりました",
                    String.format("「%s」が非公開になりました。", notes.getTitle()),
                    notes.getId()
                );
                
                log.info("下架通知创建成功 - 笔记ID: {}", notes.getId());
            } catch (Exception e) {
                // 记录错误但不影响审核流程
                log.error("创建下架通知失败 - 笔记ID: {}, 错误: {}", notes.getId(), e.getMessage(), e);
                System.err.println("创建通知失败: " + e.getMessage());
                e.printStackTrace();
            }
        } else {
            log.warn("无法创建下架通知 - 笔记ID: {}, 作者ID为空", id);
        }
    }

    @Override
    public void deleteNotesByAdmin(Long id, User admin) {
        Notes notes = notesRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notes", "id", id));

        // 删除相关的点赞和收藏记录
        likesRepository.deleteByNotes(notes);
        favoritesRepository.deleteByNotes(notes);

        notesRepository.delete(notes);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotesDTO> getNotesByStatus(NoteStatus status) {
        List<Notes> notes;
        if (status != null) {
            notes = notesRepository.findByStatusOrderByCreatedAtDesc(status);
        } else {
            // 当 status 为 null 时，返回所有笔记并按创建时间降序排序
            notes = notesRepository.findAll().stream()
                    .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                    .collect(Collectors.toList());
        }
        return notes.stream()
                .map(note -> convertToDTO(note, null))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public NotesService.NotesStatsDTO getNotesStats() {
        NotesService.NotesStatsDTO stats = new NotesService.NotesStatsDTO();
        
        // 获取所有笔记总数
        stats.setTotalNotes(notesRepository.count());
        
        // 按状态统计
        stats.setPendingNotes(notesRepository.findByStatusOrderByCreatedAtDesc(NoteStatus.PENDING).size());
        stats.setPublishedNotes(notesRepository.findByStatusOrderByCreatedAtDesc(NoteStatus.PUBLISHED).size());
        stats.setDraftNotes(notesRepository.findByStatusOrderByCreatedAtDesc(NoteStatus.DRAFT).size());
        stats.setRejectedNotes(notesRepository.findByStatusOrderByCreatedAtDesc(NoteStatus.REJECTED).size());
        stats.setPrivateNotes(notesRepository.findByStatusOrderByCreatedAtDesc(NoteStatus.PRIVATE).size());
        
        return stats;
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
        
        // 状态相关字段
        dto.setStatus(notes.getStatus());
        dto.setRejectReason(notes.getRejectReason());
        dto.setSubmittedAt(notes.getSubmittedAt());
        dto.setReviewedAt(notes.getReviewedAt());
        if (notes.getReviewedBy() != null) {
            dto.setReviewedByUsername(notes.getReviewedBy().getUsername());
        }
        
        // 向后兼容字段
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

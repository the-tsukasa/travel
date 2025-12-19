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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.travel.dto.CreateNotesRequest;
import com.example.travel.dto.NotesDTO;
import com.example.travel.entity.User;
import com.example.travel.enums.NoteStatus;
import com.example.travel.service.NotesService;
import com.example.travel.util.SecurityUtils;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class NotesController {

    private final NotesService notesService;
    private final SecurityUtils securityUtils;

    // 创建笔记
    @PostMapping
    public ResponseEntity<NotesDTO> createNotes(@Valid @RequestBody CreateNotesRequest request,
                                                Authentication authentication) {
        User user = securityUtils.getCurrentUserOrThrow(authentication);
        NotesDTO notes = notesService.createNotes(request, user);
        return ResponseEntity.ok(notes);
    }

    // 获取已批准的笔记列表
    @GetMapping
    public ResponseEntity<Page<NotesDTO>> getApprovedNotes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        User currentUser = securityUtils.getCurrentUser(authentication);

        Pageable pageable = PageRequest.of(page, size);
        Page<NotesDTO> notes = notesService.getApprovedNotes(pageable, currentUser);
        return ResponseEntity.ok(notes);
    }

    // 获取用户的笔记（可按状态过滤）
    @GetMapping("/my")
    public ResponseEntity<List<NotesDTO>> getUserNotes(
            @RequestParam(required = false) String status,
            Authentication authentication) {
        User user = securityUtils.getCurrentUserOrThrow(authentication);
        NoteStatus noteStatus = null;
        if (status != null && !status.trim().isEmpty()) {
            try {
                noteStatus = NoteStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().build();
            }
        }
        List<NotesDTO> notes = notesService.getUserNotes(user, noteStatus);
        return ResponseEntity.ok(notes);
    }
    
    // 提交审核
    @PostMapping("/{id}/submit")
    public ResponseEntity<NotesDTO> submitNotes(@PathVariable Long id,
                                                  Authentication authentication) {
        User user = securityUtils.getCurrentUserOrThrow(authentication);
        NotesDTO notes = notesService.submitNotes(id, user);
        return ResponseEntity.ok(notes);
    }

    // 获取笔记详情
    @GetMapping("/{id}")
    public ResponseEntity<NotesDTO> getNotesById(@PathVariable Long id,
                                                 Authentication authentication) {
        User currentUser = securityUtils.getCurrentUser(authentication);
        NotesDTO notes = notesService.getNotesById(id, currentUser);
        return ResponseEntity.ok(notes);
    }

    // 更新笔记
    @PutMapping("/{id}")
    public ResponseEntity<NotesDTO> updateNotes(@PathVariable Long id,
                                                @Valid @RequestBody CreateNotesRequest request,
                                                Authentication authentication) {
        User user = securityUtils.getCurrentUserOrThrow(authentication);
        NotesDTO notes = notesService.updateNotes(id, request, user);
        return ResponseEntity.ok(notes);
    }

    // 删除笔记
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotes(@PathVariable Long id,
                                            Authentication authentication) {
        User user = securityUtils.getCurrentUserOrThrow(authentication);
        notesService.deleteNotes(id, user);
        return ResponseEntity.ok().build();
    }

    // 搜索笔记
    @GetMapping("/search")
    public ResponseEntity<Page<NotesDTO>> searchNotes(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        // 如果keyword为空或null，返回空结果
        if (keyword == null || keyword.trim().isEmpty()) {
            Pageable pageable = PageRequest.of(page, size);
            return ResponseEntity.ok(Page.empty(pageable));
        }
        
        User currentUser = securityUtils.getCurrentUser(authentication);

        Pageable pageable = PageRequest.of(page, size);
        Page<NotesDTO> notes = notesService.searchNotes(keyword.trim(), pageable, currentUser);
        return ResponseEntity.ok(notes);
    }
}

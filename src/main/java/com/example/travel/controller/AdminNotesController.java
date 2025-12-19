package com.example.travel.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.travel.dto.NotesDTO;
import com.example.travel.entity.User;
import com.example.travel.enums.NoteStatus;
import com.example.travel.service.NotesService;
import com.example.travel.util.SecurityUtils;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/notes")
@RequiredArgsConstructor
public class AdminNotesController {

    private final NotesService notesService;
    private final SecurityUtils securityUtils;

    // 获取待审核的笔记列表
    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<NotesDTO>> getPendingNotes() {
        List<NotesDTO> pendingNotes = notesService.getPendingNotes();
        return ResponseEntity.ok(pendingNotes);
    }

    // 根据状态获取笔记列表
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<NotesDTO>> getNotesByStatus(
            @RequestParam(required = false) String status) {
        NoteStatus noteStatus = null;
        if (status != null && !status.trim().isEmpty()) {
            try {
                noteStatus = NoteStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().build();
            }
        }
        List<NotesDTO> notes = notesService.getNotesByStatus(noteStatus);
        return ResponseEntity.ok(notes);
    }

    // 批准笔记（PENDING → PUBLISHED）
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> approveNotes(@PathVariable Long id,
                                              Authentication authentication) {
        User admin = securityUtils.getCurrentUserOrThrow(authentication);
        notesService.approveNotes(id, admin);
        return ResponseEntity.ok().build();
    }

    // 退回修改（PENDING → REJECTED，需提供退回理由）
    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> rejectNotes(@PathVariable Long id,
                                             @RequestBody Map<String, String> request,
                                             Authentication authentication) {
        User admin = securityUtils.getCurrentUserOrThrow(authentication);
        String rejectReason = request.get("rejectReason");
        notesService.rejectNotes(id, rejectReason, admin);
        return ResponseEntity.ok().build();
    }

    // 下架笔记（PUBLISHED → PRIVATE）
    @PostMapping("/{id}/unpublish")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> unpublishNotes(@PathVariable Long id,
                                                Authentication authentication) {
        User admin = securityUtils.getCurrentUserOrThrow(authentication);
        notesService.unpublishNotes(id, admin);
        return ResponseEntity.ok().build();
    }

    // 删除笔记（管理员可删除任意状态的笔记）
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteNotes(@PathVariable Long id,
                                             Authentication authentication) {
        User admin = securityUtils.getCurrentUserOrThrow(authentication);
        notesService.deleteNotesByAdmin(id, admin);
        return ResponseEntity.ok().build();
    }

    // 获取笔记统计信息
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<NotesService.NotesStatsDTO> getNotesStats() {
        NotesService.NotesStatsDTO stats = notesService.getNotesStats();
        return ResponseEntity.ok(stats);
    }
}

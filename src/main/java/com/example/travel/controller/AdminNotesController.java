package com.example.travel.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.travel.dto.NotesDTO;
import com.example.travel.service.NotesService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/notes")
@RequiredArgsConstructor
public class AdminNotesController {

    private final NotesService notesService;

    // 获取待审核的笔记列表
    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<NotesDTO>> getPendingNotes() {
        List<NotesDTO> pendingNotes = notesService.getPendingNotes();
        return ResponseEntity.ok(pendingNotes);
    }

    // 批准笔记
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> approveNotes(@PathVariable Long id) {
        notesService.approveNotes(id);
        return ResponseEntity.ok().build();
    }

    // 拒绝/删除不合适的笔记
    @DeleteMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> rejectNotes(@PathVariable Long id) {
        notesService.rejectNotes(id);
        return ResponseEntity.ok().build();
    }
}

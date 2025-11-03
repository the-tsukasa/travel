package com.example.travel.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.example.travel.dto.CreateNotesRequest;
import com.example.travel.dto.NotesDTO;
import com.example.travel.entity.User;
import com.example.travel.repository.UserRepository;
import com.example.travel.service.NotesService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class NotesController {

    private final NotesService notesService;
    private final UserRepository userRepository;

    // 创建笔记
    @PostMapping
    public ResponseEntity<NotesDTO> createNotes(@Valid @RequestBody CreateNotesRequest request,
                                                Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        NotesDTO notes = notesService.createNotes(request, user);
        return ResponseEntity.ok(notes);
    }

    // 获取已批准的笔记列表
    @GetMapping
    public ResponseEntity<Page<NotesDTO>> getApprovedNotes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        User currentUser = null;
        if (authentication != null && authentication.isAuthenticated()) {
            String username = authentication.getName();
            currentUser = userRepository.findByUsername(username).orElse(null);
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<NotesDTO> notes = notesService.getApprovedNotes(pageable, currentUser);
        return ResponseEntity.ok(notes);
    }

    // 获取用户的笔记
    @GetMapping("/my")
    public ResponseEntity<List<NotesDTO>> getUserNotes(Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        List<NotesDTO> notes = notesService.getUserNotes(user);
        return ResponseEntity.ok(notes);
    }

    // 获取笔记详情
    @GetMapping("/{id}")
    public ResponseEntity<NotesDTO> getNotesById(@PathVariable Long id,
                                                 Authentication authentication) {
        User currentUser = null;
        if (authentication != null && authentication.isAuthenticated()) {
            String username = authentication.getName();
            currentUser = userRepository.findByUsername(username).orElse(null);
        }

        NotesDTO notes = notesService.getNotesById(id, currentUser);
        return ResponseEntity.ok(notes);
    }

    // 更新笔记
    @PutMapping("/{id}")
    public ResponseEntity<NotesDTO> updateNotes(@PathVariable Long id,
                                                @Valid @RequestBody CreateNotesRequest request,
                                                Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        NotesDTO notes = notesService.updateNotes(id, request, user);
        return ResponseEntity.ok(notes);
    }

    // 删除笔记
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotes(@PathVariable Long id,
                                            Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        notesService.deleteNotes(id, user);
        return ResponseEntity.ok().build();
    }

    // 搜索笔记
    @GetMapping("/search")
    public ResponseEntity<Page<NotesDTO>> searchNotes(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        User currentUser = null;
        if (authentication != null && authentication.isAuthenticated()) {
            String username = authentication.getName();
            currentUser = userRepository.findByUsername(username).orElse(null);
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<NotesDTO> notes = notesService.searchNotes(keyword, pageable, currentUser);
        return ResponseEntity.ok(notes);
    }
}

package com.example.travel.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.travel.dto.CreateNotesRequest;
import com.example.travel.dto.NotesDTO;
import com.example.travel.entity.User;

public interface NotesService {
    
    // 创建笔记
    NotesDTO createNotes(CreateNotesRequest request, User user);
    
    // 获取已批准的笔记列表（分页）
    Page<NotesDTO> getApprovedNotes(Pageable pageable, User currentUser);
    
    // 获取用户的笔记列表
    List<NotesDTO> getUserNotes(User user);
    
    // 根据ID获取笔记详情
    NotesDTO getNotesById(Long id, User currentUser);
    
    // 更新笔记
    NotesDTO updateNotes(Long id, CreateNotesRequest request, User user);
    
    // 删除笔记
    void deleteNotes(Long id, User user);
    
    // 搜索笔记
    Page<NotesDTO> searchNotes(String keyword, Pageable pageable, User currentUser);
    
    // 管理员功能：获取待审核笔记
    List<NotesDTO> getPendingNotes();
    
    // 管理员功能：批准笔记
    void approveNotes(Long id);
    
    // 管理员功能：拒绝/删除不合适的笔记
    void rejectNotes(Long id);
}

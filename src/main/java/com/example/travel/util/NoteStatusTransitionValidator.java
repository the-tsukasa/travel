package com.example.travel.util;

import java.util.Map;
import java.util.Set;

import com.example.travel.enums.NoteStatus;

/**
 * 笔记状态流转验证器
 * 确保只有合法的状态转换才能被执行
 */
public class NoteStatusTransitionValidator {
    
    /**
     * 定义允许的状态转换规则
     * Key: 当前状态
     * Value: 允许转换到的目标状态集合
     */
    private static final Map<NoteStatus, Set<NoteStatus>> ALLOWED_TRANSITIONS = Map.of(
        NoteStatus.DRAFT, Set.of(NoteStatus.PENDING),
        NoteStatus.PENDING, Set.of(NoteStatus.PUBLISHED, NoteStatus.REJECTED),
        NoteStatus.REJECTED, Set.of(NoteStatus.PENDING),
        NoteStatus.PUBLISHED, Set.of(NoteStatus.PRIVATE),
        NoteStatus.PRIVATE, Set.of(NoteStatus.PENDING)
    );
    
    /**
     * 验证状态转换是否合法
     * 
     * @param from 当前状态
     * @param to 目标状态
     * @return 如果转换合法返回 true，否则返回 false
     */
    public static boolean isValidTransition(NoteStatus from, NoteStatus to) {
        if (from == null || to == null) {
            return false;
        }
        
        // 相同状态转换视为无效（除非业务需要）
        if (from == to) {
            return false;
        }
        
        Set<NoteStatus> allowedTargets = ALLOWED_TRANSITIONS.get(from);
        if (allowedTargets == null) {
            return false;
        }
        
        return allowedTargets.contains(to);
    }
    
    /**
     * 获取允许转换的目标状态集合
     * 
     * @param from 当前状态
     * @return 允许的目标状态集合，如果当前状态不存在则返回空集合
     */
    public static Set<NoteStatus> getAllowedTargets(NoteStatus from) {
        return ALLOWED_TRANSITIONS.getOrDefault(from, Set.of());
    }
    
    /**
     * 验证并抛出异常（如果转换不合法）
     * 
     * @param from 当前状态
     * @param to 目标状态
     * @throws IllegalArgumentException 如果状态转换不合法
     */
    public static void validateTransition(NoteStatus from, NoteStatus to) {
        if (!isValidTransition(from, to)) {
            throw new IllegalArgumentException(
                String.format("不允许的状态转换: %s -> %s", from, to)
            );
        }
    }
}


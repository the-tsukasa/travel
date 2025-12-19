package com.example.travel.enums;

/**
 * 笔记状态枚举
 * 定义笔记在系统中的所有可能状态
 */
public enum NoteStatus {
    /**
     * 草稿：用户创建但未提交审核
     */
    DRAFT("草稿"),
    
    /**
     * 待审核：已提交，等待管理员审查
     */
    PENDING("待审核"),
    
    /**
     * 已发布：审查通过，已公开
     */
    PUBLISHED("已发布"),
    
    /**
     * 已退回：审查未通过，被退回修改
     */
    REJECTED("已退回"),
    
    /**
     * 已下架：管理员下架，暂不公开
     */
    PRIVATE("已下架");
    
    private final String description;
    
    NoteStatus(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
}


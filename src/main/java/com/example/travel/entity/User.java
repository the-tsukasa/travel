package com.example.travel.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "users") // 数据库中的表名
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // 自增主键
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, unique = true)
    private String email;

    //  角色（默认 USER）
    @Column(nullable = false)
    private String role = "USER";

    //  名
    @Column(name = "first_name")
    private String firstName;

    //  姓
    @Column(name = "last_name")
    private String lastName;

    //  所在地
    @Column(name = "location")
    private String location = "日本";

    //  头像URL
    @Column(name = "avatar_url")
    private String avatarUrl;

    //  个人简介
    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;

    //  地址
    @Column(name = "address")
    private String address;

    //  生日
    @Column(name = "birthday")
    private java.time.LocalDate birthday;

    //  注册时间（自动记录）
    @Column(nullable = false, name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}

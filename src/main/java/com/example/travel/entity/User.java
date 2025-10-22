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

    //  注册时间（自动记录）
    @Column(nullable = false)

    private LocalDateTime createdAt;
}

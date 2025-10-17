package com.example.travel.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "spots")
public class Spot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String name;
    private String description;
    private String location;

    @Column(name = "image_url")
    private String imageUrl;

    private int likes;
    private int favorites;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}

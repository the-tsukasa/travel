package com.example.travel.dto;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String firstName;
    private String lastName;
    private String avatarUrl;
    private String bio;
    private String location;
    private String address;
    private java.time.LocalDate birthday;
}


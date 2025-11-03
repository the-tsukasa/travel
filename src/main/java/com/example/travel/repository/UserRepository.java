package com.example.travel.repository;

import com.example.travel.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // ✅ 改成 Optional<User>
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
}

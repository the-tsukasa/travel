package com.example.travel.repository;

import com.example.travel.entity.Spot;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpotRepository extends JpaRepository<Spot, Integer> {
}

package com.example.travel.controller;

import com.example.travel.entity.Spot;
import com.example.travel.service.SpotService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/spots")
public class SpotController {

    private final SpotService service;

    public SpotController(SpotService service) {
        this.service = service;
    }

    @GetMapping
    public List<Spot> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Spot> getSpotById(@PathVariable Integer id) {
        Spot spot = service.findById(id);
        if (spot == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(spot);
    }

    @PostMapping("/{id}/like")
    public Spot like(@PathVariable Integer id) {
        return service.addLike(id);
    }

    @DeleteMapping("/{id}/like")
    public Spot unlike(@PathVariable Integer id) {
        return service.removeLike(id);
    }

    @PostMapping("/{id}/favorite")
    public Spot favorite(@PathVariable Integer id) {
        return service.addFavorite(id);
    }

    @DeleteMapping("/{id}/favorite")
    public Spot unfavorite(@PathVariable Integer id) {
        return service.removeFavorite(id);
    }

    @PostMapping
    public Spot create(@RequestBody Spot spot) {
        return service.save(spot);
    }
}

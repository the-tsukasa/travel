package com.example.travel.controller;

import com.example.travel.entity.Spot;
import com.example.travel.service.SpotService;
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

    @PostMapping("/{id}/like")
    public Spot like(@PathVariable Integer id) {
        return service.addLike(id);
    }

    @PostMapping("/{id}/favorite")
    public Spot favorite(@PathVariable Integer id) {
        return service.addFavorite(id);
    }

    @PostMapping
    public Spot create(@RequestBody Spot spot) {
        return service.save(spot);
    }
}

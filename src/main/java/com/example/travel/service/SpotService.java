package com.example.travel.service;

import com.example.travel.entity.Spot;
import com.example.travel.repository.SpotRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class SpotService {

    private final SpotRepository repository;

    public SpotService(SpotRepository repository) {
        this.repository = repository;
    }

    public List<Spot> findAll() {
        return repository.findAll();
    }

    public Spot findById(Integer id) {
        return repository.findById(id).orElse(null);
    }

    public Spot save(Spot spot) {
        return repository.save(spot);
    }

    public Spot addLike(Integer id) {
        Spot spot = findById(id);
        if (spot != null) {
            spot.setLikes(spot.getLikes() + 1);
            repository.save(spot);
        }
        return spot;
    }

    public Spot addFavorite(Integer id) {
        Spot spot = findById(id);
        if (spot != null) {
            spot.setFavorites(spot.getFavorites() + 1);
            repository.save(spot);
        }
        return spot;
    }
}

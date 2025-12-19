package com.example.travel.service;

import com.example.travel.entity.Spot;
import com.example.travel.repository.SpotRepository;
import org.springframework.lang.NonNull;
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

    @SuppressWarnings("null")
    public Spot findById(@NonNull Integer id) {
        return repository.findById(id).orElse(null);
    }

    @NonNull
    public Spot save(@NonNull Spot spot) {
        return repository.save(spot);
    }

    @SuppressWarnings("null") // id is checked for null in findById
    public Spot addLike(@NonNull Integer id) {
        Spot spot = findById(id);
        if (spot != null) {
            spot.setLikes(spot.getLikes() + 1);
            repository.save(spot);
        }
        return spot;
    }

    @SuppressWarnings("null") // id is checked for null in findById
    public Spot addFavorite(@NonNull Integer id) {
        Spot spot = findById(id);
        if (spot != null) {
            spot.setFavorites(spot.getFavorites() + 1);
            repository.save(spot);
        }
        return spot;
    }
}

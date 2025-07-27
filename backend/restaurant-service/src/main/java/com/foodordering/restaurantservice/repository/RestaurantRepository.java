package com.foodordering.restaurantservice.repository;

import com.foodordering.restaurantservice.entity.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {
    // get restaurant by OwnerId
    List<Restaurant> findByOwnerId(Long ownerId);

    // Find restaurants within a certain distance
    @Query("SELECT r FROM Restaurant r WHERE " +
            "6371 * acos(cos(radians(:latitude)) * cos(radians(r.latitude)) * " +
            "cos(radians(r.longitude) - radians(:longitude)) + " +
            "sin(radians(:latitude)) * sin(radians(r.latitude))) <= :distance")
    List<Restaurant> findNearbyRestaurants(@Param("latitude") double latitude,
                                            @Param("longitude") double longitude,
                                            @Param("distance") double distance);
    
}

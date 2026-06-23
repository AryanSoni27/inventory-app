package com.inventory.repository;

import com.inventory.entity.Item;
import com.inventory.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {
    List<Item> findByUser(User user);
    Optional<Item> findByIdAndUser(Long id, User user);
}

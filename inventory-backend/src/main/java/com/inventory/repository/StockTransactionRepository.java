package com.inventory.repository;

import com.inventory.entity.StockTransaction;
import com.inventory.entity.User;
import com.inventory.enums.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StockTransactionRepository extends JpaRepository<StockTransaction, Long> {
    List<StockTransaction> findByItemIdOrderByCreatedAtDesc(Long itemId);
    List<StockTransaction> findTop10ByOrderByCreatedAtDesc();

    List<StockTransaction> findTop10ByItem_UserOrderByCreatedAtDesc(User user);

    void deleteByItemId(Long itemId);

    // Statistics: ALL types, admin (all users)
    List<StockTransaction> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime start, LocalDateTime end);

    // Statistics: specific type, admin (all users)
    List<StockTransaction> findByTransactionTypeAndCreatedAtBetweenOrderByCreatedAtDesc(
            TransactionType type, LocalDateTime start, LocalDateTime end);

    // Statistics: ALL types, specific user (own items only)
    List<StockTransaction> findByItem_UserAndCreatedAtBetweenOrderByCreatedAtDesc(
            User user, LocalDateTime start, LocalDateTime end);

    // Statistics: specific type, specific user (own items only)
    List<StockTransaction> findByItem_UserAndTransactionTypeAndCreatedAtBetweenOrderByCreatedAtDesc(
            User user, TransactionType type, LocalDateTime start, LocalDateTime end);
}

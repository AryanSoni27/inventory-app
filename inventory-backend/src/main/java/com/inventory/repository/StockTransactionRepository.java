package com.inventory.repository;

import com.inventory.entity.StockTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import com.inventory.entity.User;

@Repository
public interface StockTransactionRepository extends JpaRepository<StockTransaction, Long> {
    List<StockTransaction> findByItemIdOrderByCreatedAtDesc(Long itemId);
    List<StockTransaction> findTop10ByOrderByCreatedAtDesc();
    
    List<StockTransaction> findTop10ByItem_UserOrderByCreatedAtDesc(User user);

    void deleteByItemId(Long itemId);
}

package com.inventory.repository;

import com.inventory.entity.StockTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockTransactionRepository extends JpaRepository<StockTransaction, Long> {
    List<StockTransaction> findByItemIdOrderByCreatedAtDesc(Long itemId);
    List<StockTransaction> findTop10ByOrderByCreatedAtDesc();
}

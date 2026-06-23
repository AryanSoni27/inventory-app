package com.inventory.service;

import com.inventory.dto.ItemResponse;
import com.inventory.dto.TransactionRequest;
import com.inventory.dto.TransactionResponse;
import com.inventory.entity.Item;
import com.inventory.entity.StockTransaction;
import com.inventory.entity.User;
import com.inventory.enums.TransactionType;
import com.inventory.exception.ResourceNotFoundException;
import com.inventory.repository.ItemRepository;
import com.inventory.repository.StockTransactionRepository;
import com.inventory.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final StockTransactionRepository transactionRepository;
    private final ItemRepository itemRepository;
    private final UserRepository userRepository;

    @Transactional
    public ItemResponse processTransaction(TransactionRequest request, String username, boolean isAdmin) {
        Item item = itemRepository.findById(request.getItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + request.getItemId()));

        if (!isAdmin && !item.getUser().getUsername().equals(username)) {
            throw new ResourceNotFoundException("Item not found with id: " + request.getItemId());
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        if (request.getTransactionType() == TransactionType.ADD) {
            item.setQuantity(item.getQuantity() + request.getQuantity());
        } else if (request.getTransactionType() == TransactionType.REMOVE) {
            int newQuantity = item.getQuantity() - request.getQuantity();
            if (newQuantity < 0) {
                throw new IllegalArgumentException(
                        "Insufficient stock. Current quantity: " + item.getQuantity()
                                + ", requested removal: " + request.getQuantity()
                );
            }
            item.setQuantity(newQuantity);
        }

        itemRepository.save(item);

        StockTransaction transaction = StockTransaction.builder()
                .item(item)
                .user(user)
                .transactionType(request.getTransactionType())
                .quantity(request.getQuantity())
                .note(request.getNote())
                .build();

        transactionRepository.save(transaction);

        return ItemResponse.builder()
                .id(item.getId())
                .name(item.getName())
                .description(item.getDescription())
                .quantity(item.getQuantity())
                .unit(item.getUnit())
                .price(item.getPrice())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }

    public List<TransactionResponse> getTransactionsByItemId(Long itemId, String username, boolean isAdmin) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + itemId));

        if (!isAdmin && !item.getUser().getUsername().equals(username)) {
            throw new ResourceNotFoundException("Item not found with id: " + itemId);
        }

        return transactionRepository.findByItemIdOrderByCreatedAtDesc(itemId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<TransactionResponse> getRecentTransactions(String username, boolean isAdmin) {
        List<StockTransaction> transactions;
        if (isAdmin) {
            transactions = transactionRepository.findTop10ByOrderByCreatedAtDesc();
        } else {
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
            transactions = transactionRepository.findTop10ByItem_UserOrderByCreatedAtDesc(user);
        }

        return transactions.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private TransactionResponse mapToResponse(StockTransaction tx) {
        return TransactionResponse.builder()
                .id(tx.getId())
                .itemId(tx.getItem().getId())
                .itemName(tx.getItem().getName())
                .username(tx.getUser().getUsername())
                .transactionType(tx.getTransactionType().name())
                .quantity(tx.getQuantity())
                .note(tx.getNote())
                .createdAt(tx.getCreatedAt())
                .build();
    }
}

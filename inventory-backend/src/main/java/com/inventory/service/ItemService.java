package com.inventory.service;

import com.inventory.dto.ItemRequest;
import com.inventory.dto.ItemResponse;
import com.inventory.dto.TransactionResponse;
import com.inventory.entity.Item;
import com.inventory.entity.StockTransaction;
import com.inventory.entity.User;
import com.inventory.exception.ResourceNotFoundException;
import com.inventory.repository.ItemRepository;
import com.inventory.repository.StockTransactionRepository;
import com.inventory.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ItemService {

    private final ItemRepository itemRepository;
    private final StockTransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public List<ItemResponse> getAllItems(String username, boolean isAdmin) {
        List<Item> items;
        if (isAdmin) {
            items = itemRepository.findAll();
        } else {
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
            items = itemRepository.findByUser(user);
        }

        return items.stream()
                .map(item -> mapToResponse(item, false))
                .collect(Collectors.toList());
    }

    public ItemResponse getItemById(Long id, String username, boolean isAdmin) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + id));

        if (!isAdmin && !item.getUser().getUsername().equals(username)) {
            throw new ResourceNotFoundException("Item not found with id: " + id);
        }

        ItemResponse response = mapToResponse(item, true);

        List<StockTransaction> transactions = transactionRepository.findByItemIdOrderByCreatedAtDesc(id);
        response.setTransactions(transactions.stream()
                .map(this::mapTransactionToResponse)
                .collect(Collectors.toList()));

        return response;
    }

    public ItemResponse createItem(ItemRequest request, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        Item item = Item.builder()
                .user(user)
                .name(request.getName())
                .description(request.getDescription())
                .quantity(request.getQuantity() != null ? request.getQuantity() : 0)
                .unit(request.getUnit())
                .price(request.getPrice())
                .build();

        Item saved = itemRepository.save(item);
        return mapToResponse(saved, false);
    }

    public ItemResponse updateItem(Long id, ItemRequest request, String username, boolean isAdmin) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + id));

        if (!isAdmin && !item.getUser().getUsername().equals(username)) {
            throw new ResourceNotFoundException("Item not found with id: " + id);
        }

        item.setName(request.getName());
        item.setDescription(request.getDescription());
        item.setUnit(request.getUnit());
        item.setPrice(request.getPrice());
        // Note: quantity is NOT updated here — only via transactions

        Item saved = itemRepository.save(item);
        return mapToResponse(saved, false);
    }

    @Transactional
    public void deleteItem(Long id, String username, boolean isAdmin) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + id));

        if (!isAdmin && !item.getUser().getUsername().equals(username)) {
            throw new ResourceNotFoundException("Item not found with id: " + id);
        }

        // Delete all related transactions first to avoid foreign key constraint
        transactionRepository.deleteByItemId(id);
        itemRepository.deleteById(id);
    }

    private ItemResponse mapToResponse(Item item, boolean includeTransactions) {
        return ItemResponse.builder()
                .id(item.getId())
                .name(item.getName())
                .description(item.getDescription())
                .quantity(item.getQuantity())
                .unit(item.getUnit())
                .price(item.getPrice())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .transactions(includeTransactions ? Collections.emptyList() : null)
                .build();
    }

    private TransactionResponse mapTransactionToResponse(StockTransaction tx) {
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

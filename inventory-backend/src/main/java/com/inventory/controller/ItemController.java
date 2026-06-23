package com.inventory.controller;

import com.inventory.dto.ItemRequest;
import com.inventory.dto.ItemResponse;
import com.inventory.service.ItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/items")
@RequiredArgsConstructor
public class ItemController {

    private final ItemService itemService;

    private boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    @GetMapping
    public ResponseEntity<List<ItemResponse>> getAllItems(Authentication authentication) {
        return ResponseEntity.ok(itemService.getAllItems(authentication.getName(), isAdmin(authentication)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ItemResponse> getItemById(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(itemService.getItemById(id, authentication.getName(), isAdmin(authentication)));
    }

    @PostMapping
    public ResponseEntity<ItemResponse> createItem(@Valid @RequestBody ItemRequest request, Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED).body(itemService.createItem(request, authentication.getName()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ItemResponse> updateItem(@PathVariable Long id, @Valid @RequestBody ItemRequest request, Authentication authentication) {
        return ResponseEntity.ok(itemService.updateItem(id, request, authentication.getName(), isAdmin(authentication)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id, Authentication authentication) {
        itemService.deleteItem(id, authentication.getName(), isAdmin(authentication));
        return ResponseEntity.noContent().build();
    }
}

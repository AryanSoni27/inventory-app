package com.inventory.controller;

import com.inventory.dto.ItemResponse;
import com.inventory.dto.TransactionRequest;
import com.inventory.dto.TransactionResponse;
import com.inventory.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    private boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    @PostMapping
    public ResponseEntity<ItemResponse> processTransaction(
            @Valid @RequestBody TransactionRequest request,
            Authentication authentication
    ) {
        String username = authentication.getName();
        ItemResponse response = transactionService.processTransaction(request, username, isAdmin(authentication));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/item/{itemId}")
    public ResponseEntity<List<TransactionResponse>> getTransactionsByItem(@PathVariable Long itemId, Authentication authentication) {
        return ResponseEntity.ok(transactionService.getTransactionsByItemId(itemId, authentication.getName(), isAdmin(authentication)));
    }

    @GetMapping("/recent")
    public ResponseEntity<List<TransactionResponse>> getRecentTransactions(Authentication authentication) {
        return ResponseEntity.ok(transactionService.getRecentTransactions(authentication.getName(), isAdmin(authentication)));
    }
}

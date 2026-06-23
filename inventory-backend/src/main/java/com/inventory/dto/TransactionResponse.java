package com.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionResponse {
    private Long id;
    private Long itemId;
    private String itemName;
    private String username;
    private String transactionType;
    private Integer quantity;
    private String note;
    private LocalDateTime createdAt;
}

package com.inventory.dto.statistics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemBreakdownResponse {
    private Long itemId;
    private String itemName;
    private String unit;
    private long totalSold;
    private long totalRestocked;
    private long transactionCount;
    private LocalDateTime lastTransactionDate;
}

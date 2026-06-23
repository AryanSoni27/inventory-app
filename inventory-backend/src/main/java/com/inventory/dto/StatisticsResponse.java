package com.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatisticsResponse {
    private Integer totalSoldQuantity;
    private Integer totalRestockedQuantity;
    private Integer totalTransactions;
    private List<ItemSummary> itemSummaries;
    private List<TransactionResponse> transactions;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ItemSummary {
        private String itemName;
        private Integer soldQuantity;
        private Integer restockedQuantity;
        private Integer transactionCount;
    }
}

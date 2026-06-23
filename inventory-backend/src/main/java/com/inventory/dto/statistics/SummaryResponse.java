package com.inventory.dto.statistics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SummaryResponse {
    private long totalTransactions;
    private long totalQuantitySold;
    private long totalQuantityRestocked;
    private long totalItemsAffected;
    private ItemSummary mostSoldItem;
    private ItemSummary mostRestockedItem;
    private DateRange dateRange;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemSummary {
        private Long itemId;
        private String itemName;
        private long totalQuantity;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DateRange {
        private String startDate;
        private String endDate;
    }
}

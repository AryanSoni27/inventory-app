package com.inventory.dto.statistics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemBreakdownPageResponse {
    private List<ItemBreakdownResponse> content;
    private long totalElements;
    private int totalPages;
    private int currentPage;
}
